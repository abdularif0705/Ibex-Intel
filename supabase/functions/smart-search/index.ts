import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { discoverUrls, generateFallbackUrls, SearchResult } from '../shared/search-discovery.ts';
import { analyzeTemporalClustering } from '../shared/signal-analyzer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartSearchRequest {
  keywords: string[];
  sourceTypes: string[];
  location?: string;
  dateRange?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  maxResults?: number;
}

interface CompanySignalGroup {
  companyName: string;
  signalCount: number;
  signals: any[];
  avgConfidence: number;
  vendors: string[];
  phases: string[];
  hasTemporalCluster: boolean;
  firstDetected: string;
  lastDetected: string;
  sources: string[];
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

    const requestBody: SmartSearchRequest = await req.json();
    const { 
      keywords,
      sourceTypes,
      location,
      dateRange,
      maxResults = 50 
    } = requestBody;

    // Validate input
    if (!keywords || keywords.length === 0) {
      throw new Error('At least one keyword is required');
    }

    if (!sourceTypes || sourceTypes.length === 0) {
      throw new Error('At least one source type is required');
    }

    console.log(`Smart search initiated: keywords=${keywords.join(', ')}, sources=${sourceTypes.join(', ')}`);

    // Check user scan limits
    const { data: scanLimits } = await supabase
      .from('user_scan_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const isFreeTrialUser = scanLimits?.plan_type === 'free_trial';
    const FREE_TRIAL_LIMIT = 15;
    
    if (isFreeTrialUser && scanLimits?.scan_count >= FREE_TRIAL_LIMIT) {
      throw new Error(`Free trial limit reached (${FREE_TRIAL_LIMIT} scans). Please upgrade to continue.`);
    }

    // PHASE 1: Discover URLs via Google Custom Search
    let discoveredUrls: SearchResult[] = [];
    
    try {
      discoveredUrls = await discoverUrls({
        keywords,
        sourceTypes,
        location,
        dateRange,
        maxResults: maxResults * 2 // Get extra URLs for filtering
      });
    } catch (error) {
      console.error('Google Search failed, using fallback:', error);
      discoveredUrls = generateFallbackUrls(keywords, sourceTypes);
    }

    console.log(`Discovered ${discoveredUrls.length} URLs`);

    if (discoveredUrls.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No URLs found matching your search criteria. Try different keywords or sources.',
          jobId: null,
          urlsToScrape: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // PHASE 2: Filter & Deduplicate URLs
    const filteredUrls = await filterAndDeduplicateUrls(
      discoveredUrls,
      user.id,
      supabase
    );
    
    console.log(`After filtering: ${filteredUrls.length} URLs`);

    // PHASE 3: Prioritize by source reliability
    const prioritizedUrls = prioritizeUrls(filteredUrls);

    // PHASE 4: Create master scraping job
    const { data: masterJob, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        user_id: user.id,
        source_type: 'smart_search',
        target_url: keywords.join(', '),
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // PHASE 5: Start background scraping task (don't await)
    performSmartScrape(
      prioritizedUrls.slice(0, maxResults),
      keywords,
      user.id,
      masterJob.id,
      supabase
    ).catch(err => console.error('Background scrape failed:', err));

    // PHASE 6: Return immediately
    return new Response(
      JSON.stringify({
        success: true,
        jobId: masterJob.id,
        urlsToScrape: Math.min(prioritizedUrls.length, maxResults),
        estimatedTime: `${Math.ceil(Math.min(prioritizedUrls.length, maxResults) / 10)} minutes`,
        message: 'Smart search initiated. Results will appear as they are found. Refresh the dashboard to see updates.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in smart-search:', error);
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

/**
 * Filter out already-processed URLs and deduplicate
 */
async function filterAndDeduplicateUrls(
  urls: SearchResult[],
  userId: string,
  supabase: any
): Promise<SearchResult[]> {
  // Remove duplicates by normalized URL
  const uniqueUrls = new Map<string, SearchResult>();
  for (const result of urls) {
    const normalizedUrl = normalizeUrl(result.url);
    if (!uniqueUrls.has(normalizedUrl)) {
      uniqueUrls.set(normalizedUrl, result);
    }
  }

  // Check which URLs we've already processed (within last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const urlHashes = Array.from(uniqueUrls.keys()).map(url => hashUrl(url));
  
  const { data: processedUrls } = await supabase
    .from('processed_urls')
    .select('url_hash')
    .in('url_hash', urlHashes)
    .eq('user_id', userId)
    .gte('processed_at', thirtyDaysAgo);

  const processedSet = new Set(processedUrls?.map((p: any) => p.url_hash) || []);

  // Filter out already-processed URLs
  const filtered = Array.from(uniqueUrls.values()).filter(result => {
    const hash = hashUrl(normalizeUrl(result.url));
    return !processedSet.has(hash);
  });

  console.log(`Filtered out ${uniqueUrls.size - filtered.length} already-processed URLs`);
  return filtered;
}

/**
 * Prioritize URLs by source reliability
 */
function prioritizeUrls(urls: SearchResult[]): SearchResult[] {
  // Source reliability scores (based on signal quality)
  const sourceScores: Record<string, number> = {
    'linkedin': 10,
    'greenhouse': 9,
    'sec_edgar': 9,
    'workday': 9,
    'indeed': 8,
    'glassdoor': 7,
    'lever': 7,
    'ashby': 7,
    'company_website': 6,
    'news_site': 5,
    'reddit': 3,
    'hackernews': 3,
    'teamblind': 3,
    'other': 2
  };

  return urls.sort((a, b) => {
    const scoreA = sourceScores[a.source] || 0;
    const scoreB = sourceScores[b.source] || 0;
    
    // Higher score first
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    // If same score, prioritize newer content
    if (a.datePublished && b.datePublished) {
      return new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime();
    }
    
    return 0;
  });
}

/**
 * Background task: Scrape URLs and analyze signals
 */
async function performSmartScrape(
  urls: SearchResult[],
  keywords: string[],
  userId: string,
  jobId: string,
  supabase: any
) {
  let signalsFound = 0;
  const companySignals = new Map<string, any[]>(); // Group by company
  const startTime = Date.now();
  const MAX_SCRAPE_TIME = 5 * 60 * 1000; // 5 minutes max

  console.log(`Starting smart scrape of ${urls.length} URLs`);

  for (const urlResult of urls) {
    // Check timeout
    if (Date.now() - startTime > MAX_SCRAPE_TIME) {
      console.log('Smart scrape timeout reached, completing with partial results');
      break;
    }

    try {
      console.log(`Scraping: ${urlResult.url}`);

      // Scrape using existing scrape-source function
      const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke('scrape-source', {
        body: {
          targetUrl: urlResult.url,
          sourceType: urlResult.source,
          scanType: 'smart_search'
        }
      });

      if (scrapeError) {
        console.error(`Scrape error for ${urlResult.url}:`, scrapeError);
        continue;
      }

      if (scrapeResult?.signals && scrapeResult.signals.length > 0) {
        signalsFound += scrapeResult.signals.length;

        // Group signals by company
        for (const signal of scrapeResult.signals) {
          const company = signal.company_name || 'Unknown Company';
          if (!companySignals.has(company)) {
            companySignals.set(company, []);
          }
          companySignals.get(company)!.push(signal);
        }

        console.log(`Found ${scrapeResult.signals.length} signals from ${urlResult.url}`);
      }

      // Mark URL as processed
      await supabase.from('processed_urls').insert({
        url_hash: hashUrl(normalizeUrl(urlResult.url)),
        url: urlResult.url,
        user_id: userId,
        source_type: urlResult.source,
        signal_found: scrapeResult?.signals?.length > 0
      }).catch((err: any) => {
        // Ignore duplicate key errors
        if (!err.message?.includes('duplicate')) {
          console.error('Error inserting processed URL:', err);
        }
      });

    } catch (error) {
      console.error(`Failed to scrape ${urlResult.url}:`, error);
    }
  }

  // Analyze temporal clustering for each company
  const companyGroups: CompanySignalGroup[] = [];
  
  for (const [company, signals] of companySignals.entries()) {
    const clustering = analyzeTemporalClustering(signals, 90);
    
    // Calculate aggregate metrics
    const avgConfidence = signals.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / signals.length;
    const vendors = [...new Set(signals.map(s => s.extracted_data?.vendor).filter(Boolean))];
    const phases = [...new Set(signals.map(s => s.extracted_data?.phase).filter(Boolean))];
    const sources = [...new Set(signals.map(s => s.source_type))];
    
    const dates = signals.map(s => new Date(s.detected_at).getTime()).sort();
    const firstDetected = new Date(dates[0]).toISOString();
    const lastDetected = new Date(dates[dates.length - 1]).toISOString();
    
    companyGroups.push({
      companyName: company,
      signalCount: signals.length,
      signals,
      avgConfidence,
      vendors,
      phases,
      hasTemporalCluster: clustering.hasCluster,
      firstDetected,
      lastDetected,
      sources
    });
    
    console.log(`${company}: ${signals.length} signals, avg confidence=${avgConfidence.toFixed(2)}, cluster=${clustering.hasCluster}`);
  }

  // Sort companies by signal strength (count × confidence)
  companyGroups.sort((a, b) => {
    const scoreA = a.signalCount * a.avgConfidence;
    const scoreB = b.signalCount * b.avgConfidence;
    return scoreB - scoreA;
  });

  // Update master job
  await supabase
    .from('scraping_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      results_count: signalsFound,
    })
    .eq('id', jobId);

  console.log(`Smart search complete: ${signalsFound} signals found across ${companySignals.size} companies`);
  console.log(`Top 5 companies:`, companyGroups.slice(0, 5).map(c => `${c.companyName} (${c.signalCount} signals)`));
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'ref', 'source', 'fbclid', 'gclid'
    ];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    // Remove trailing slash
    let pathname = urlObj.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    urlObj.pathname = pathname;
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

function hashUrl(url: string): string {
  // Simple hash function (use crypto.subtle.digest in production for better hashing)
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

