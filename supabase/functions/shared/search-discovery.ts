/**
 * Search Discovery Module
 * Uses Google Custom Search API to find URLs across the web matching transformation keywords
 */

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  source: string;
  datePublished?: string;
  displayUrl?: string;
}

export interface SearchOptions {
  keywords: string[];
  sourceTypes: string[];
  location?: string;
  dateRange?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  maxResults?: number;
}

/**
 * Discover URLs across the web using Google Custom Search API
 */
export async function discoverUrls(
  options: SearchOptions
): Promise<SearchResult[]> {
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_CUSTOM_SEARCH_KEY');
  const SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
  
  if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
    console.warn('Google Custom Search not configured, using fallback');
    return [];
  }

  const { keywords, sourceTypes, location, dateRange, maxResults = 100 } = options;
  const results: SearchResult[] = [];
  
  // Build search queries with site restrictions
  const queries = buildSearchQueries(keywords, sourceTypes, location, dateRange);
  
  console.log(`Executing ${queries.length} search queries`);
  
  // Execute searches in parallel (respect API limits: 100 queries/day free tier)
  const batchSize = 5; // Process 5 queries at a time
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(query => executeGoogleSearch(query, GOOGLE_API_KEY, SEARCH_ENGINE_ID))
    );
    
    results.push(...batchResults.flat());
    
    // Stop if we have enough results
    if (results.length >= maxResults) {
      break;
    }
  }
  
  // Deduplicate by URL
  const uniqueResults = deduplicateResults(results);
  
  console.log(`Found ${uniqueResults.length} unique URLs`);
  return uniqueResults.slice(0, maxResults);
}

interface SearchQuery {
  q: string;
  sourceType: string;
  priority: number;
}

function buildSearchQueries(
  keywords: string[],
  sourceTypes: string[],
  location?: string,
  dateRange?: string
): SearchQuery[] {
  const queries: SearchQuery[] = [];
  
  // Priority sources (scan these first)
  const sourcePriority: Record<string, number> = {
    'linkedin': 10,
    'greenhouse': 9,
    'sec_edgar': 9,
    'indeed': 8,
    'glassdoor': 7,
    'company_website': 6,
    'news_site': 5,
    'other': 3
  };
  
  for (const keyword of keywords) {
    for (const sourceType of sourceTypes) {
      const siteRestriction = getSiteRestriction(sourceType);
      let query = keyword;
      
      // Add site restriction
      if (siteRestriction) {
        query += ` ${siteRestriction}`;
      }
      
      // Add location filter
      if (location) {
        query += ` "${location}"`;
      }
      
      // Add date range filter
      if (dateRange) {
        const dateFilter = getDateFilter(dateRange);
        if (dateFilter) {
          query += ` ${dateFilter}`;
        }
      }
      
      queries.push({
        q: query,
        sourceType,
        priority: sourcePriority[sourceType] || 3
      });
    }
  }
  
  // Sort by priority (high priority first)
  return queries.sort((a, b) => b.priority - a.priority);
}

function getSiteRestriction(sourceType: string): string {
  const siteMap: Record<string, string> = {
    'linkedin': 'site:linkedin.com/jobs',
    'indeed': 'site:indeed.com',
    'glassdoor': 'site:glassdoor.com',
    'greenhouse': 'site:greenhouse.io',
    'lever': 'site:lever.co',
    'ashby': 'site:ashbyhq.com',
    'workday': 'site:myworkdayjobs.com',
    'company_website': '-site:linkedin.com -site:indeed.com -site:glassdoor.com', // Exclude job boards
    'news_site': '(site:prnewswire.com OR site:businesswire.com OR site:reuters.com)',
    'sec_edgar': 'site:sec.gov',
    'reddit': 'site:reddit.com',
    'hackernews': 'site:news.ycombinator.com',
    'teamblind': 'site:teamblind.com'
  };
  
  return siteMap[sourceType] || '';
}

function getDateFilter(dateRange: string): string {
  const now = new Date();
  let startDate: Date;
  
  switch (dateRange) {
    case 'last_7_days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last_30_days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last_90_days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'last_year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return '';
  }
  
  // Format: after:YYYY-MM-DD
  const dateStr = startDate.toISOString().split('T')[0];
  return `after:${dateStr}`;
}

async function executeGoogleSearch(
  query: SearchQuery,
  apiKey: string,
  searchEngineId: string
): Promise<SearchResult[]> {
  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', searchEngineId);
    url.searchParams.set('q', query.q);
    url.searchParams.set('num', '10'); // Max results per query
    
    console.log(`Searching: ${query.q}`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Search API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log(`No results for: ${query.q}`);
      return [];
    }
    
    return data.items.map((item: any) => ({
      url: item.link,
      title: item.title,
      snippet: item.snippet,
      source: query.sourceType,
      datePublished: item.pagemap?.metatags?.[0]?.['article:published_time'] ||
                     item.pagemap?.metatags?.[0]?.['og:updated_time'],
      displayUrl: item.displayLink
    }));
    
  } catch (error) {
    console.error(`Search failed for query: ${query.q}`, error);
    return [];
  }
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const unique: SearchResult[] = [];
  
  for (const result of results) {
    const normalizedUrl = normalizeUrl(result.url);
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      unique.push(result);
    }
  }
  
  return unique;
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid'
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

/**
 * Fallback: Generate URLs from known patterns when Google Search is unavailable
 */
export function generateFallbackUrls(
  keywords: string[],
  sourceTypes: string[]
): SearchResult[] {
  const results: SearchResult[] = [];
  
  // LinkedIn job search URLs
  if (sourceTypes.includes('linkedin')) {
    for (const keyword of keywords) {
      results.push({
        url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}`,
        title: `LinkedIn Jobs: ${keyword}`,
        snippet: `Job listings for ${keyword}`,
        source: 'linkedin'
      });
    }
  }
  
  // Indeed job search URLs
  if (sourceTypes.includes('indeed')) {
    for (const keyword of keywords) {
      results.push({
        url: `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}`,
        title: `Indeed Jobs: ${keyword}`,
        snippet: `Job listings for ${keyword}`,
        source: 'indeed'
      });
    }
  }
  
  return results;
}

