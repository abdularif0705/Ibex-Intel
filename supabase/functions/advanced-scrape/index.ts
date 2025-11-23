import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  url: string;
  method?: 'fetch' | 'python';
  useJavaScript?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, method = 'fetch', useJavaScript = false }: ScrapeRequest = await req.json();
    
    console.log(`[Advanced Scrape] Starting scrape for ${url} using method: ${method}`);

    if (method === 'python') {
      // Call external Python service with curl_cffi
      return await scrapeWithPython(url);
    } else {
      // Use enhanced fetch with browser-like headers
      return await scrapeWithFetch(url, useJavaScript);
    }
  } catch (error) {
    console.error('[Advanced Scrape] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function scrapeWithFetch(url: string, useJavaScript: boolean): Promise<Response> {
  console.log(`[Fetch Scrape] Fetching ${url}`);
  
  // Generate realistic browser headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"'
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract text content (basic extraction)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return new Response(
      JSON.stringify({
        success: true,
        content: textContent,
        html: html,
        method: 'fetch',
        url: url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Fetch Scrape] Error:', error);
    throw error;
  }
}

async function scrapeWithPython(url: string): Promise<Response> {
  const pythonServiceUrl = Deno.env.get('PYTHON_SCRAPER_URL') ?? 'https://signalstream-python-1q73.onrender.com'; // 'http://host.docker.internal:5000';
  
  if (!pythonServiceUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Python scraper service not configured. Set PYTHON_SCRAPER_URL secret.',
        hint: 'Deploy the Python service (see python-scraper/ folder) and add the URL as a secret.'
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  console.log(`[Python Scrape] Calling Python service at ${pythonServiceUrl}`);

  try {
    const response = await fetch(pythonServiceUrl+"/scrape", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        ...data,
        method: 'python',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Python Scrape] Error:', error);
    throw error;
  }
}
