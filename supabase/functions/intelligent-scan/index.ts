import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { analyzeCompany, organizeScanPhases, buildSourceUrl } from '../shared/company-analyzer.ts';
import { extractJobUrls } from './url-extractor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanProgress {
  phase: number;
  totalPhases: number;
  sourcesScanned: string[];
  signalsFound: number;
  currentConfidence: number;
  status: 'scanning' | 'complete' | 'stopped_early';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { companyName, ticker } = await req.json();

    const normalizedName = (typeof companyName === 'string' && companyName.trim())
      || (typeof ticker === 'string' && ticker.trim())
      || '';

    if (!normalizedName) {
      throw new Error('Either company name or ticker is required');
    }

    console.log(`Starting intelligent scan for: ${normalizedName}${ticker ? ` (${ticker})` : ''}`);

    // Step 1: Analyze company to determine type and relevant sources
    const companyProfile = await analyzeCompany(normalizedName, ticker);
    console.log('Company profile:', companyProfile);

    // Step 2: Check scan limits
    const { data: scanLimits } = await supabase
      .from('user_scan_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const isFreeTrialUser = scanLimits?.plan_type === 'free_trial';
    const FREE_TRIAL_SCAN_LIMIT = 999999999; // remove before PR
    // const FREE_TRIAL_SCAN_LIMIT = 15;
    const remainingScans = isFreeTrialUser 
      ? Math.max(0, FREE_TRIAL_SCAN_LIMIT - (scanLimits?.scan_count || 0))
      : 999;

    // Calculate total scans needed
    const totalScansNeeded = companyProfile.suggestedSources.length;
    
    if (remainingScans < totalScansNeeded) {
      throw new Error(
        `Insufficient scans. This search requires ${totalScansNeeded} scans, but you have ${remainingScans} remaining.`
      );
    }

    // Step 3: Create a master job record
    const { data: masterJob, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        user_id: user.id,
        source_type: 'company_website',
        target_url: normalizedName,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Step 4: Organize sources into scanning phases
    const scanPhases = organizeScanPhases(companyProfile.suggestedSources);
    console.log('Scan phases:', scanPhases);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Background task for the actual scanning
    const performScan = async () => {
      let allSignals: any[] = [];
      let currentMaxConfidence = 0;
      let sourcesScanned: string[] = [];
      const startTime = Date.now();
      const MAX_SCAN_TIME = 4 * 60 * 1000; // 4 minutes max

      try {
        // Step 5: Scan with time limit
        for (let phaseIndex = 0; phaseIndex < scanPhases.length; phaseIndex++) {
          // Check timeout
          if (Date.now() - startTime > MAX_SCAN_TIME) {
            console.log('Scan timeout reached, completing with partial results');
            break;
          }

          const phase = scanPhases[phaseIndex];
          console.log(`Phase ${phaseIndex + 1}: Scanning ${phase.length} sources`);

          // Scan sources in parallel with individual timeout
          const phasePromises = phase.map(async (sourceType) => {
            try {
              const listingUrl = buildSourceUrl(normalizedName, sourceType);
              console.log(`Scanning ${sourceType}: ${listingUrl}`);
              
              const allSourceSignals: any[] = [];
              
              // Scan listing page with timeout
              const scanPromise = supabase.functions.invoke('advanced-scrape', {
                body: { 
                  url: listingUrl,
                  method: 'python'
                }
              });

              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Source scan timeout')), 45000)
              );

              const { data: listingData } = await Promise.race([scanPromise, timeoutPromise]) as any;


              if (listingData?.signals) {
                allSourceSignals.push(...listingData.signals);
              }

              // Extract and scan job URLs - more for high-value sources
              const jobUrls = extractJobUrls(
                listingData?.html || '', 
                listingUrl,
                sourceType
              );
              
              // Scan more URLs for high-signal sources (company sites get deeper crawling automatically)
              const urlLimit = ['company_website', 'google', 'linkedin', 'greenhouse'].includes(sourceType) ? 15 : 5;
              console.log(`Found ${jobUrls.length} job URLs in ${sourceType}, scanning top ${urlLimit}...`);

              const jobScanPromises = jobUrls.slice(0, urlLimit).map(async (jobUrl) => {
                try {
                  await delay(Math.floor(Math.random() * 500) + 200); // Delay between 200 to 500 ms

                  console.log("scraping jobUrl: ",jobUrl)
                  const { data: jobData } = await supabase.functions.invoke('scrape-source', {
                    body: { 
                      sourceType, 
                      targetUrl: jobUrl,
                      scanType: 'smart'
                    }
                  });

                  console.log("completed scraping, jobData: ",jobData)

                  return jobData?.signals || [];
                } catch (err) {
                  console.error(`Failed to scan job URL:`, err);
                  return [];
                }
              });

              const jobResults = await Promise.all(jobScanPromises);
              console.log("jobResults for ",sourceType,jobResults)
              jobResults.forEach(signals => allSourceSignals.push(...signals));

              sourcesScanned.push(sourceType);
              
              return { sourceType, signals: allSourceSignals, success: true };
            } catch (error) {
              console.error(`Failed to scan ${sourceType}:`, error);
              return { sourceType, signals: [], success: false };
            }
          });

          const phaseResults = await Promise.all(phasePromises);

          phaseResults.forEach(result => {
            if (result.success && result.signals.length > 0) {
              allSignals = [...allSignals, ...result.signals];
              
              result.signals.forEach((signal: any) => {
                if (signal.confidence_score > currentMaxConfidence) {
                  currentMaxConfidence = signal.confidence_score;
                }
              });
            }
          });

          console.log(`Phase ${phaseIndex + 1} complete. Total signals: ${allSignals.length}`);
        }

        // Update master job with success
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            results_count: allSignals.length,
          })
          .eq('id', masterJob.id);

        // Update scan count
        if (isFreeTrialUser) {
          await supabase
            .from('user_scan_limits')
            .update({ 
              scan_count: (scanLimits?.scan_count || 0) + sourcesScanned.length 
            })
            .eq('user_id', user.id);
        }

        console.log(`Scan complete: ${allSignals.length} signals found from ${sourcesScanned.length} sources`);
      } catch (error) {
        console.error('Background scan error:', error);
        
        // Update job with failure
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString(),
            results_count: allSignals.length,
          })
          .eq('id', masterJob.id);
      }
    };

    // Start background scan (don't await)
    performScan().catch(err => console.error('Background scan failed:', err));

    // Return immediately
    const progress: ScanProgress = {
      phase: 0,
      totalPhases: scanPhases.length,
      sourcesScanned: [],
      signalsFound: 0,
      currentConfidence: 0,
      status: 'scanning'
    };

    return new Response(
      JSON.stringify({
        success: true,
        companyProfile,
        progress,
        signals: [],
        jobId: masterJob.id,
        message: `Scan started for ${normalizedName}. This will take 2-5 minutes. Refresh to see results.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in intelligent-scan:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
