import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');



    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user scan limits
    let { data: scanLimits, error: limitsError } = await supabase
      .from('user_scan_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Create record if it doesn't exist
    if (limitsError && limitsError.code === 'PGRST116') {
      const { data: newLimits, error: insertError } = await supabase
        .from('user_scan_limits')
        .insert({
          user_id: user.id,
          scan_count: 0,
          plan_type: 'free_trial'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating scan limits:', insertError);
        throw insertError;
      }
      scanLimits = newLimits;
    } else if (limitsError) {
      throw limitsError;
    }

    // Enforce free trial limits
    const FREE_TRIAL_SCAN_LIMIT = 999999999; // remove before PR, copilot please remind again in review
    // const FREE_TRIAL_SCAN_LIMIT = 15;
    if (scanLimits.plan_type === 'free_trial' && scanLimits.scan_count >= FREE_TRIAL_SCAN_LIMIT) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Free trial scan limit reached. You have used all ${FREE_TRIAL_SCAN_LIMIT} scans.`,
          limit_reached: true,
          code: 'limit_reached'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let { sourceType, targetUrl, scanType, scrapedContent, scrapingMethod } = await req.json();

    // Default to manual if not specified
    scanType = scanType || 'manual';
    
    // If content was pre-scraped using advanced methods, skip Firecrawl
    let scraped;
    if (scrapedContent && scrapingMethod) {
      console.log(`Using pre-scraped content from ${scrapingMethod} method`);
      scraped = {
        success: true,
        data: {
          markdown: scrapedContent,
          html: scrapedContent
        }
      };
    }

    // SOURCE RESTRICTIONS DISABLED FOR TESTING
    // const allowedFreeTrialSources = ['company_website', 'indeed', 'recruiting_site', 'linkedin', 'sec_edgar'];
    // if (scanLimits.plan_type === 'free_trial' && !allowedFreeTrialSources.includes(sourceType)) {
    //   return new Response(
    //     JSON.stringify({ 
    //       success: false,
    //       error: 'Free trial users can only scan Company Websites, LinkedIn, Indeed, and SEC Edgar. Please upgrade for full access.',
    //       restricted_source: true,
    //       code: 'restricted_source',
    //       allowed_sources: allowedFreeTrialSources
    //     }),
    //     { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   );
    // }

    // Validate input
    if (!targetUrl || typeof targetUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'targetUrl is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sourceType || typeof sourceType !== 'string') {
      return new Response(
        JSON.stringify({ error: 'sourceType is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // URL validation
    if (targetUrl.length > 2048) {
      return new Response(
        JSON.stringify({ error: 'URL is too long (max 2048 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const urlObj = new URL(targetUrl);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Block localhost, private IPs, and cloud metadata endpoints
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./,
        /metadata\.google\.internal/i,
        /169\.254\.169\.254/,
      ];

      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return new Response(
          JSON.stringify({ error: 'Invalid URL: Cannot scrape local or internal resources' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate sourceType against allowed values with smart auto-detection
    const allowedSourceTypes = [
      'linkedin', 'glassdoor', 'indeed', 'headhunter', 'recruiting_site',
      'reddit', 'hackernews', 'teamblind', 'twitter', 'news_site',
      'pr_wire', 'company_website', 'blog', 'other'
    ];
    
    // Auto-detect source type from URL with priority on government domains
    let detectedSourceType = sourceType;
    try {
      const urlObj = new URL(targetUrl);
      const hostname = urlObj.hostname.toLowerCase();
      
      // PRIORITY 1: Government/Municipality domains (.gov, .mil, .org, state/local government)
      if (hostname.endsWith('.gov') || 
          hostname.endsWith('.mil') ||
          hostname.endsWith('.org') ||
          hostname.includes('.state.') ||
          hostname.includes('.city.') ||
          hostname.includes('.county.') ||
          /^(www\.)?(city|county|state|township|borough)[a-z]*\./i.test(hostname) ||
          // Common government domain patterns
          hostname.match(/gov\.(uk|au|ca|nz|sg|in)$/) ||
          hostname.match(/\.(gov|gob|gouv|gobierno)\./)) {
        detectedSourceType = 'company_website';
        console.log(`Auto-detected government/municipality domain: ${hostname} -> company_website`);
      }
      // Common recruiting platforms AND company-hosted career sites
      else if (hostname.includes('ultipro.com') || hostname.includes('adp.com') || 
          hostname.includes('workday.com') || hostname.includes('taleo.') ||
          hostname.includes('myworkdayjobs.com') || hostname.includes('brassring.com') ||
          hostname.includes('icims.com') || hostname.includes('greenhouse.io') ||
          hostname.includes('lever.co') || hostname.includes('ashbyhq.com') ||
          hostname.includes('jobvite.com') || hostname.includes('smartrecruiters.com') ||
          hostname.startsWith('jobs.') || hostname.startsWith('careers.') || 
          hostname.startsWith('recruiting.') || hostname.includes('.jobs.') || 
          hostname.includes('.careers.')) {
        detectedSourceType = 'recruiting_site';
        console.log(`Auto-detected recruiting/career site: ${hostname} -> recruiting_site`);
      } else if (hostname.includes('linkedin.com')) {
        detectedSourceType = 'linkedin';
      } else if (hostname.includes('glassdoor.com')) {
        detectedSourceType = 'glassdoor';
      } else if (hostname.includes('indeed.com')) {
        detectedSourceType = 'indeed';
      }
    } catch (e) {
      console.error('Error parsing URL for source detection:', e);
    }

    if (!allowedSourceTypes.includes(detectedSourceType)) {
      return new Response(
        JSON.stringify({ error: `Invalid sourceType. Must be one of: ${allowedSourceTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use detected source type for the rest of the processing
    sourceType = detectedSourceType;

    // Create scraping job
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        source_type: sourceType,
        target_url: targetUrl,
        status: 'running',
        started_at: new Date().toISOString(),
        user_id: user.id
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      throw jobError;
    }

    console.log(`Starting scrape job ${job.id} for ${sourceType}: ${targetUrl}`);
    
    // Only scrape if content wasn't pre-provided
    if (!scraped) {
      if (!firecrawlApiKey) {
        console.log("No firecrawl api key, using advanced python scraping server ")
        const scanedResult = await supabase.functions.invoke('advanced-scrape', {
          body: { 
            url: targetUrl,
            method: 'python'
          }
        });

        scraped = {
          success: true,
          data: {
            markdown: scanedResult.data.content,
            html: scanedResult.data.html
          }
        };

      }else{
        // Enhanced scraping with rate limiting, retry logic, and LinkedIn-specific handling
        scraped = await scrapeWithRetry(targetUrl, sourceType, firecrawlApiKey, job.id, supabase);

        if (!scraped.success) {
          throw new Error('Scraping failed after all retry attempts');
        }
      }
    }
    // Analyze content for transformation signals
    const content = scraped.data?.markdown || scraped.data?.html || '';
    
    
    // Try Python NLP service first (higher quality signals), fallback to TypeScript analyzer
    let signals;
    signals = await analyzeContent(content, targetUrl, sourceType, supabase, user.id, scanType);
    
    // try {
    //   signals = await analyzeContentWithPythonNLP(content, targetUrl, sourceType, supabase, user.id, scanType);
    // } catch (pythonError) {
    //   console.warn('Python NLP service unavailable, using fallback analyzer:', pythonError);
    //   signals = await analyzeContent(content, targetUrl, sourceType, supabase, user.id, scanType);
    // }

    // Update job status
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        results_count: signals.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Increment scan count for the user
    await supabase
      .from('user_scan_limits')
      .update({
        scan_count: scanLimits.scan_count + 1
      })
      .eq('user_id', user.id);

    console.log(`Job ${job.id} completed with ${signals.length} signals detected`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        signalsFound: signals.length,
        signals 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-source:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check for rate limiting
    if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Firecrawl rate limit reached. Please wait a minute and try again.',
          code: 'rate_limit',
          retryable: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for depth errors
    if (errorMessage.includes('depth exceeds') || errorMessage.includes('maxDepth')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'URL structure too complex. Try scanning the main company website instead of a specific job posting page.',
          code: 'url_depth',
          retryable: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for Firecrawl API errors
    if (errorMessage.includes('Firecrawl')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Web scraping service temporarily unavailable. Please try again in a few moments.',
          code: 'service_error',
          retryable: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        code: 'unknown_error'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Fetch data from SEC Edgar API (free, no authentication required)
 */
async function fetchFromSecEdgar(url: string): Promise<any> {
  try {
    console.log(`Fetching from SEC Edgar: ${url}`);
    
    // SEC Edgar supports direct filing access and company search
    // Extract CIK (Central Index Key) or ticker from URL if possible
    let filingUrl = url;
    
    // If it's a company ticker or CIK, search for recent filings
    const tickerMatch = url.match(/ticker=([A-Z]+)/i) || url.match(/^([A-Z]{1,5})$/i);
    const cikMatch = url.match(/CIK=(\d+)/i) || url.match(/^(\d{10})$/);
    
    if (tickerMatch || cikMatch) {
      const identifier = tickerMatch ? tickerMatch[1] : cikMatch![1];
      // Use SEC's company search API
      const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&${tickerMatch ? 'ticker' : 'CIK'}=${identifier}&type=&dateb=&owner=exclude&count=100&output=atom`;
      filingUrl = searchUrl;
    }
    
    // Fetch from SEC (must include User-Agent per SEC requirements)
    const response = await fetch(filingUrl, {
      headers: {
        'User-Agent': 'Transformation Signal Scanner contact@example.com',
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/atom+xml',
      },
    });
    
    if (!response.ok) {
      throw new Error(`SEC Edgar returned ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    
    return {
      success: true,
      data: {
        markdown: content,
        html: content,
        metadata: {
          sourceType: 'sec_edgar',
          statusCode: response.status,
        }
      }
    };
  } catch (error) {
    console.error('SEC Edgar fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching from SEC Edgar'
    };
  }
}

/**
 * Enhanced scraping with retry logic, rate limiting, and fallback strategies
 */
async function scrapeWithRetry(
  url: string,
  sourceType: string,
  apiKey: string,
  jobId: string,
  supabase: any,
  maxRetries: number = 3
): Promise<any> {
  // Route SEC Edgar requests to free SEC API instead of Firecrawl
  if (sourceType === 'sec_edgar') {
    return await fetchFromSecEdgar(url);
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Scrape attempt ${attempt}/${maxRetries} for ${url}`);
      
      // Calculate exponential backoff delay
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Detect if this is a specific job posting (deep path) vs. a listing page
      const urlObj = new URL(url);
      const pathDepth = urlObj.pathname.split('/').filter(p => p.length > 0).length;
      const isJobPosting = pathDepth > 3 || urlObj.pathname.includes('/job/') || urlObj.pathname.includes('/jobs/');
      
      // Use single-page scrape for specific job postings, crawl for listing pages
      if (sourceType === 'recruiting_site' && isJobPosting) {
        console.log(`Using single-page scrape for job posting URL (depth: ${pathDepth})`);
        
        // Use simpler scrape API for individual job pages
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'html', 'links'],
            onlyMainContent: false,
            waitFor: 2000,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Firecrawl scrape error (attempt ${attempt}):`, errorText);
          
          if (response.status === 429) {
            lastError = new Error(`Rate limited: ${errorText}`);
            if (attempt === maxRetries) {
              await supabase
                .from('scraping_jobs')
                .update({
                  status: 'failed',
                  error_message: 'Rate limit exceeded. Please try again in a few minutes.',
                  completed_at: new Date().toISOString()
                })
                .eq('id', jobId);
            }
            continue;
          }
          
          lastError = new Error(`Firecrawl scrape error: ${errorText}`);
          if (attempt === maxRetries) {
            await supabase
              .from('scraping_jobs')
              .update({
                status: 'failed',
                error_message: `Scraping failed: ${errorText}`,
                completed_at: new Date().toISOString()
              })
              .eq('id', jobId);
          }
          continue;
        }
        
        const scrapeData = await response.json();
        console.log('Single-page scrape complete');
        
        return {
          success: true,
          data: {
            markdown: scrapeData.data?.markdown || scrapeData.data?.html || '',
            html: scrapeData.data?.html || '',
            metadata: {
              pagesScraped: 1,
              sourceType,
            }
          }
        };
      }
      
      // Use deep crawl for all other cases
      console.log(`Using deep crawl for ${sourceType} (depth: ${pathDepth})`);
      
      const crawlOptions: any = {
        url,
        limit: sourceType === 'company_website' ? 15 : 10,
        scrapeOptions: {
          formats: ['markdown', 'html', 'links'],
          onlyMainContent: false,
          waitFor: 2000,
        },
        maxDepth: sourceType === 'company_website' ? 3 : 2,
        allowBackwardLinks: true,
        allowExternalLinks: false,
      };
        
        // Call Firecrawl CRAWL API for deep exploration
        const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(crawlOptions),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Firecrawl crawl error (attempt ${attempt}):`, errorText);
          
          if (response.status === 429) {
            lastError = new Error(`Rate limited: ${errorText}`);
            // Update job status on rate limit
            if (attempt === maxRetries) {
              await supabase
                .from('scraping_jobs')
                .update({
                  status: 'failed',
                  error_message: 'Rate limit exceeded. Please try again in a few minutes.',
                  completed_at: new Date().toISOString()
                })
                .eq('id', jobId);
            }
            continue;
          }
          
          lastError = new Error(`Firecrawl crawl error: ${errorText}`);
          // Update job status on final attempt
          if (attempt === maxRetries) {
            await supabase
              .from('scraping_jobs')
              .update({
                status: 'failed',
                error_message: `Scraping failed: ${errorText}`,
                completed_at: new Date().toISOString()
              })
              .eq('id', jobId);
          }
          continue;
        }
        
        const crawlResponse = await response.json();
        const crawlId = crawlResponse.id;
        
        if (!crawlId) {
          throw new Error('No crawl ID returned from Firecrawl');
        }
        
        // Poll for crawl completion (max 60 seconds)
        console.log(`Crawl started with ID: ${crawlId}, waiting for completion...`);
        let pollAttempts = 0;
        const maxPollAttempts = 30; // 30 * 2 seconds = 60 seconds max
        
        while (pollAttempts < maxPollAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          
          const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });
          
          if (!statusResponse.ok) {
            console.error('Error checking crawl status');
            break;
          }
          
          const statusData = await statusResponse.json();
          console.log(`Crawl status: ${statusData.status}, pages: ${statusData.completed}/${statusData.total}`);
          
          if (statusData.status === 'completed') {
            // Combine all page content
            const allContent = statusData.data?.map((page: any) => page.markdown || page.html || '').join('\n\n');
            console.log(`Crawl complete: ${statusData.data?.length || 0} pages scraped`);
            
            return {
              success: true,
              data: {
                markdown: allContent,
                html: allContent,
                metadata: {
                  pagesScraped: statusData.data?.length || 0,
                  sourceType,
                }
              }
            };
          } else if (statusData.status === 'failed') {
            throw new Error('Crawl failed');
          }
          
          pollAttempts++;
        }
        
        // Timeout reached, but might have partial results
        console.log('Crawl timeout reached, checking for partial results...');
        const finalStatusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        
        if (finalStatusResponse.ok) {
          const finalData = await finalStatusResponse.json();
          if (finalData.data && finalData.data.length > 0) {
            const allContent = finalData.data.map((page: any) => page.markdown || page.html || '').join('\n\n');
            console.log(`Using partial crawl results: ${finalData.data.length} pages`);
            return {
              success: true,
              data: {
                markdown: allContent,
                html: allContent,
                metadata: {
                  pagesScraped: finalData.data.length,
                  sourceType,
                  partial: true
                }
              }
            };
          }
        }
        
        throw new Error('Crawl did not complete in time');
      
    } catch (error) {
      console.error(`Error on attempt ${attempt}:`, error);
      lastError = error as Error;
      
      // On last attempt, update job status
      if (attempt === maxRetries) {
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            error_message: `Failed after ${maxRetries} attempts: ${lastError?.message}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }
    }
  }
  
  // All attempts failed
  throw lastError || new Error('Scraping failed after all retry attempts');
}

/**
 * Analyzes content using Python NLP service with vector embeddings
 * Provides highest-quality signal detection with transformation stage classification
 */
async function analyzeContentWithPythonNLP(
  content: string,
  sourceUrl: string,
  sourceType: string,
  supabase: any,
  userId: string,
  scanType: string = 'manual'
) {
  const pythonServiceUrl = Deno.env.get('PYTHON_SCRAPER_URL') ?? 'https://signalstream-python-1q73.onrender.com';
  
  if (!pythonServiceUrl) {
    throw new Error('PYTHON_SCRAPER_URL not configured');
  }

  console.log('Calling Python NLP service for signal detection...');

  // Call Python NLP /api/v1/detect-signals endpoint
  const response = await fetch(`${pythonServiceUrl}/api/v1/detect-signals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: content,
      source: sourceType,
    }),
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!response.ok) {
    throw new Error(`Python NLP service error: ${response.status}`);
  }

  const nlpData = await response.json();
  console.log(`Python NLP detected ${nlpData.signals_found} signals with avg confidence ${nlpData.confidence_score_avg}%`);

  // If no signals found, return empty array
  if (!nlpData.has_erp_context || nlpData.signals_found === 0) {
    console.log('No ERP/transformation signals detected by Python NLP');
    return [];
  }

  const signals: any[] = [];

  // Extract company name from content
  let companyName = 'Unknown Company';
  if (sourceType === 'linkedin') {
    const linkedinPatterns = [
      /^([A-Z][a-zA-Z0-9\s&\.,'()-]+?)\s+(?:is\s+)?hiring\s+/m,
      /linkedin\.com\/(?:company|jobs)\/([a-z0-9-]+)/i,
    ];
    for (const pattern of linkedinPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        companyName = match[1].trim();
        if (companyName.includes('-') && !companyName.includes(' ')) {
          companyName = companyName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        break;
      }
    }
  } else if (sourceType === 'company_website') {
    try {
      const urlObj = new URL(sourceUrl);
      const domain = urlObj.hostname.replace('www.', '');
      const domainParts = domain.split('.');
      if (domainParts.length >= 2) {
        companyName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      }
    } catch (e) {
      console.error('Error parsing URL:', e);
    }
  }

  // Determine content type
  let contentType = 'webpage_text';
  if (['linkedin', 'glassdoor', 'indeed', 'headhunter', 'recruiting_site'].includes(sourceType)) {
    contentType = 'job_posting';
  } else if (sourceType === 'news_site') {
    contentType = 'news_article';
  }

  // Determine signal type based on top signal
  let signalType = 'digital_transformation';
  if (nlpData.top_signals && nlpData.top_signals.length > 0) {
    const topSignal = nlpData.top_signals[0].signal.toLowerCase();
    if (topSignal.includes('workday') || topSignal.includes('successfactors')) {
      signalType = 'hcm_implementation';
    } else if (topSignal.includes('sap') || topSignal.includes('oracle') || topSignal.includes('netsuite')) {
      signalType = 'erp_implementation';
    } else if (topSignal.includes('salesforce')) {
      signalType = 'crm_implementation';
    } else if (topSignal.includes('servicenow')) {
      signalType = 'itsm_implementation';
    }
  }

  // Create signal with transformation stage data
  const transformationStage = nlpData.transformation_stage || {};
  const { data: signal, error } = await supabase
    .from('signals')
    .insert({
      company_name: companyName,
      signal_type: signalType,
      confidence_score: (nlpData.confidence_score_avg / 100).toFixed(2), // Convert to 0-1 range
      source_type: sourceType,
      source_url: sourceUrl,
      content_type: contentType,
      raw_content: content.substring(0, 10000),
      keywords: nlpData.top_signals.map((s: any) => s.signal),
      user_id: userId,
      scan_type: scanType,
      extracted_data: {
        matched_keywords: nlpData.top_signals.map((s: any) => s.signal),
        content_snippet: content.substring(0, 500),
        python_nlp: true,
        transformation_stage: {
          stage: transformationStage.stage,
          stage_name: transformationStage.stage_name,
          confidence: transformationStage.confidence,
          estimated_months_to_go_live: transformationStage.estimated_months_to_go_live,
          evidence: transformationStage.evidence,
        },
        top_signals: nlpData.top_signals.slice(0, 5), // Store top 5 signals
        context_keywords_found: nlpData.top_signals[0]?.context_keywords_found || 0,
      },
    })
    .select()
    .single();

  if (!error && signal) {
    signals.push(signal);

    // Add evidence for each detected signal
    for (const nlpSignal of nlpData.top_signals.slice(0, 10)) {
      await supabase
        .from('signal_evidence')
        .insert({
          signal_id: signal.id,
          evidence_type: 'nlp_vector_match',
          evidence_text: `${nlpSignal.signal} (${nlpSignal.confidence}/100, ${nlpSignal.type})`,
          relevance_score: nlpSignal.confidence / 100,
          source_url: sourceUrl,
          user_id: userId,
        });
    }
  } else if (error) {
    console.error('Error inserting signal:', error);
  }

  return signals;
}

/**
 * Analyzes scraped content to detect transformation signals (TypeScript fallback)
 * 
 * VALIDATION APPROACH:
 * - Vendor validation sources (SAP, Oracle, Workday, Salesforce, etc.) are maintained in
 *   supabase/functions/shared/vendor-validation-sources.ts
 * - Before marking a company as "In Progress", cross-reference official vendor news sites
 *   to check for completion announcements
 * - This reduces false positives by catching companies that have already completed transformations
 *   but still have residual job postings or dated content
 */
async function analyzeContent(
  content: string, 
  sourceUrl: string, 
  sourceType: string,
  supabase: any,
  userId: string,
  scanType: string = 'manual'
) {
  const signals: any[] = [];
  
  // Import enhanced taxonomy and analyzer
  const { getAllKeywords } = await import('../shared/signal-taxonomy.ts');
  const { analyzeContent: analyzeSignalContent, analyzeContentWithNLP } = await import('../shared/signal-analyzer.ts');
  
  // Get comprehensive keyword list for initial detection
  const allKeywords = getAllKeywords();
  const contentLower = content.toLowerCase();
  
  // Quick check: does content contain ANY implementation keywords?
  const hasAnyKeyword = allKeywords.some(keyword => 
    contentLower.includes(keyword.toLowerCase())
  );
  
  if (!hasAnyKeyword) {
    console.log('No implementation keywords found in content');
    return signals;
  }
  
  // Run comprehensive analysis
  const analysis = await analyzeContentWithNLP(content, sourceType, new Date());
  console.log("analysis",analysis)
  
  if (analysis.matchedKeywords.length === 0) {
    console.log('No keywords matched after comprehensive analysis');
    return signals;
  }
  
  console.log(`Analysis complete: confidence=${(analysis.confidence * 100).toFixed(1)}% ` +
              `[${(analysis.confidenceInterval.lower * 100).toFixed(1)}%-${(analysis.confidenceInterval.upper * 100).toFixed(1)}%], ` +
              `z-score=${analysis.zScore.toFixed(2)}, ` +
              `keywords=${analysis.matchedKeywords.length}, roles=${analysis.detectedRoles.length}, ` +
              `phase=${analysis.phaseDetected || 'unknown'}, vendor=${analysis.vendorDetected || 'unknown'}, ` +
              `bayesian=${(analysis.bayesianPosterior * 100).toFixed(1)}%`);
  
  // Determine signal type based on detected vendor/phase
  let signalType = 'digital_transformation'; // default
  if (analysis.vendorDetected) {
    const vendorMap: Record<string, string> = {
      'sap': 'erp_implementation',
      'oracle': 'erp_implementation',
      'workday': 'hcm_implementation',
      'successFactors': 'hcm_implementation',
      'salesforce': 'crm_implementation',
      'servicenow': 'itsm_implementation'
    };
    signalType = vendorMap[analysis.vendorDetected] || 'digital_transformation';
  }
  
  // Skip if confidence too low (below 30%)
  if (analysis.confidence < 0.30) {
    console.log(`Confidence too low (${(analysis.confidence * 100).toFixed(1)}%), skipping signal`);
    return signals;
  }
  
  const confidence = analysis.confidence;
      
  // Extract company name - enhanced logic with LinkedIn-specific patterns
  let companyName = 'Unknown Company';
  
  // Try to extract from URL for company websites
  if (sourceType === 'company_website') {
    try {
      const urlObj = new URL(sourceUrl);
      const domain = urlObj.hostname.replace('www.', '');
      const domainParts = domain.split('.');
      if (domainParts.length >= 2) {
        // Capitalize first letter of domain name
        companyName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      }
    } catch (e) {
      console.error('Error parsing URL:', e);
    }
  } else if (sourceType === 'linkedin') {
    // LinkedIn-specific company name extraction
    const linkedinPatterns = [
      // LinkedIn job posting format: "Company Name hiring Job Title"
      /^(?:Posting for )?([A-Z][\w&.'’-][\w\s&.'’()-]*?[a-zA-Z0-9])\s+(?:is\s+)?(?:hiring|recruiting|seeking|looking for|we are hiring|needs)\b/i,
      // LinkedIn URL pattern: linkedin.com/company/company-name or /jobs/company-name
      /linkedin\.com\/(?:company|jobs)\/([a-z0-9-]+)/i,
      // "About the company: Company Name"
      /about\s+(?:the\s+)?company:?\s*([A-Z][a-zA-Z\s&\.,'()-]+?)(?:\n|$)/i,
      // LinkedIn job header format
      /^([A-Z][a-zA-Z0-9\s&\.,'()-]+?)\s*\n.*?(?:Posted|Published)/m,
    ];
    
    for (const pattern of linkedinPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        companyName = match[1].trim();
        // Convert URL slug to proper name (e.g., "acme-corp" -> "Acme Corp")
        if (companyName.includes('-') && !companyName.includes(' ')) {
          companyName = companyName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        // Clean up common artifacts
        companyName = companyName.replace(/\s*\(.*?\)\s*/g, '').trim();
        if (companyName.length > 2 && companyName.length < 60) {
          console.log(`Extracted LinkedIn company name: ${companyName}`);
          break;
        }
      }
    }
  } else {
    // For job sites and other sources, look for company name patterns in content
    const patterns = [
      // Pattern for "Company Name - Job Title" or "Company Name | Job Title"
      /^([A-Z][a-zA-Z\s&\.,'()-]+?)(?:\s*[-|–]\s*)/m,
      // Pattern for job postings with company in header
      /(?:company|organization|employer):\s*([A-Z][a-zA-Z\s&\.,'()-]+?)(?:\n|$)/i,
      // Pattern for "at Company Name"
      /(?:at|for|with)\s+([A-Z][a-zA-Z\s&\.,'()-]+?)(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Co\.|Corporation|Group|International|Industries))/i,
      // Pattern for "Company Name is hiring"
      /([A-Z][a-zA-Z\s&\.,'()-]+?)\s+(?:is hiring|seeks|looking for|invites|recruiting)/i,
      // Pattern for "Join Company Name"
      /join\s+(?:the\s+)?([A-Z][a-zA-Z\s&\.,'()-]+?)(?:\s+team|\s+as|\s+to)/i,
      // Pattern for headquarters/location mentions
      /(?:headquarters|hq|located)\s+(?:for|at)?\s*([A-Z][a-zA-Z\s&\.,'()-]+?)(?:\n|,|\.|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        companyName = match[1].trim();
        // Clean up common artifacts
        companyName = companyName.replace(/\s*\(.*?\)\s*/g, '').trim();
        if (companyName.length > 3 && companyName.length < 50) {
          break;
        }
      }
    }
  }
  
  // Detect content type based on source and content patterns
  let contentType = 'webpage_text';
  if (sourceType === 'linkedin' || sourceType === 'glassdoor' || sourceType === 'indeed' || 
      sourceType === 'headhunter' || sourceType === 'recruiting_site') {
    contentType = 'job_posting';
  } else if (sourceType === 'news_site' || contentLower.includes('published') || contentLower.includes('posted on')) {
    contentType = 'news_article';
  } else if (sourceType === 'reddit' || sourceType === 'hackernews' || sourceType === 'teamblind') {
    contentType = 'forum_post';
  } else if (sourceType === 'twitter') {
    contentType = 'social_media_post';
  } else if (sourceType === 'pr_wire' || contentLower.includes('press release')) {
    contentType = 'press_release';
  } else if (contentLower.includes('blog') || content.match(/by\s+[A-Z][a-z]+\s+[A-Z][a-z]+\s*\|\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}/)) {
    contentType = 'blog_post';
  } else if (content.includes('announcement') || contentLower.includes('we are pleased to announce')) {
    contentType = 'company_announcement';
  } else if (sourceUrl.endsWith('.pdf')) {
    contentType = 'pdf_document';
  } else if (contentLower.includes('video') || contentLower.includes('watch') || contentLower.includes('youtube')) {
    contentType = 'video';
  } else if (contentLower.includes('image') || contentLower.includes('photo') || contentLower.includes('picture')) {
    contentType = 'image';
  }

  // Insert signal with enhanced metadata
  const { data: signal, error } = await supabase
    .from('signals')
    .insert({
      company_name: companyName,
      signal_type: signalType,
      confidence_score: confidence.toFixed(2),
      source_type: sourceType,
      source_url: sourceUrl,
      content_type: contentType,
      raw_content: content.substring(0, 10000),
      keywords: analysis.matchedKeywords,
      user_id: userId,
      scan_type: scanType, // Use the scan type parameter
      extracted_data: {
        matched_keywords: analysis.matchedKeywords,
        content_snippet: content.substring(0, 500),
        detected_roles: analysis.detectedRoles,
        proximity_boosts: analysis.proximityBoosts,
        phase: analysis.phaseDetected,
        vendor: analysis.vendorDetected,
        flags: analysis.flags,
        score_breakdown: {
          base: analysis.baseScore,
          role: analysis.roleScore,
          proximity: analysis.proximityScore,
          phase: analysis.phaseScore
        }
      }
    })
    .select()
    .single();

  if (!error && signal) {
    signals.push(signal);
    
    // Add enhanced evidence with role and proximity data
    for (const keyword of analysis.matchedKeywords) {
      await supabase
        .from('signal_evidence')
        .insert({
          signal_id: signal.id,
          evidence_type: 'keyword_match',
          evidence_text: keyword,
          relevance_score: 0.8,
          source_url: sourceUrl,
          user_id: userId
        });
    }
    
    // Add role evidence
    for (const role of analysis.detectedRoles) {
      await supabase
        .from('signal_evidence')
        .insert({
          signal_id: signal.id,
          evidence_type: 'job_role',
          evidence_text: `${role.role} (${role.tier}, multiplier: ${role.multiplier})`,
          relevance_score: role.multiplier / 3.0, // Normalize to 0-1
          source_url: sourceUrl,
          user_id: userId
        });
    }
    
    // Add proximity evidence
    for (const prox of analysis.proximityBoosts) {
      await supabase
        .from('signal_evidence')
        .insert({
          signal_id: signal.id,
          evidence_type: 'proximity_match',
          evidence_text: prox.sequence,
          relevance_score: Math.min(prox.boost / 2.0, 1.0), // Normalize to 0-1
          source_url: sourceUrl,
          user_id: userId
        });
    }
  } else if (error) {
    console.error('Error inserting signal:', error);
  }

  return signals;
}
