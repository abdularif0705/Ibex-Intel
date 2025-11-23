/**
 * Content Cache Manager
 * Reduces Firecrawl API costs by caching scraped content for 24 hours
 */

export interface CachedContent {
  url: string;
  content: string;
  metadata?: any;
  scrapedAt: Date;
  expiresAt: Date;
}

export class ContentCacheManager {
  private supabase: any;
  private readonly TTL_HOURS = 24;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Get cached content for a URL
   * Returns null if not cached or expired
   */
  async get(url: string): Promise<CachedContent | null> {
    try {
      const urlHash = this.hashUrl(url);
      
      const { data, error } = await this.supabase
        .from('content_cache')
        .select('*')
        .eq('url_hash', urlHash)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Increment hit count
      await this.supabase
        .from('content_cache')
        .update({ hit_count: data.hit_count + 1 })
        .eq('id', data.id);

      console.log(`Cache HIT: ${url} (hit count: ${data.hit_count + 1})`);

      return {
        url: data.url,
        content: data.content,
        metadata: data.metadata,
        scrapedAt: new Date(data.scraped_at),
        expiresAt: new Date(data.expires_at)
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Store content in cache
   */
  async set(url: string, content: string, metadata?: any): Promise<void> {
    try {
      const urlHash = this.hashUrl(url);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.TTL_HOURS * 60 * 60 * 1000);

      // Upsert (insert or update)
      const { error } = await this.supabase
        .from('content_cache')
        .upsert({
          url_hash: urlHash,
          url,
          content,
          metadata,
          scraped_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          hit_count: 0
        }, {
          onConflict: 'url_hash'
        });

      if (error) {
        console.error('Cache set error:', error);
      } else {
        console.log(`Cache SET: ${url} (expires: ${expiresAt.toISOString()})`);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Check if URL is cached and not expired
   */
  async has(url: string): Promise<boolean> {
    const cached = await this.get(url);
    return cached !== null;
  }

  /**
   * Invalidate (delete) cached content for a URL
   */
  async invalidate(url: string): Promise<void> {
    try {
      const urlHash = this.hashUrl(url);
      
      await this.supabase
        .from('content_cache')
        .delete()
        .eq('url_hash', urlHash);

      console.log(`Cache INVALIDATE: ${url}`);
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_cache_stats');

      if (error) {
        console.error('Cache stats error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Manually clean up expired entries
   */
  async cleanup(): Promise<void> {
    try {
      await this.supabase.rpc('cleanup_expired_cache');
      console.log('Cache cleanup complete');
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Hash URL for consistent cache keys
   */
  private hashUrl(url: string): string {
    // Normalize URL first
    const normalized = this.normalizeUrl(url);
    
    // Simple hash function (use crypto.subtle.digest for better hashing in production)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Normalize URL for consistent caching
   */
  private normalizeUrl(url: string): string {
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
      
      // Sort query parameters for consistency
      const sortedParams = new URLSearchParams(
        Array.from(urlObj.searchParams.entries()).sort()
      );
      urlObj.search = sortedParams.toString();
      
      return urlObj.toString().toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }
}

/**
 * Wrapper function to scrape with caching
 */
export async function scrapeWithCache(
  url: string,
  scrapeFn: () => Promise<string>,
  supabaseClient: any
): Promise<string> {
  const cache = new ContentCacheManager(supabaseClient);
  
  // Check cache first
  const cached = await cache.get(url);
  if (cached) {
    return cached.content;
  }
  
  // Cache miss - scrape the URL
  console.log(`Cache MISS: ${url} - scraping...`);
  const content = await scrapeFn();
  
  // Store in cache
  await cache.set(url, content);
  
  return content;
}

/**
 * Calculate potential cost savings from caching
 */
export async function calculateCacheSavings(
  supabaseClient: any,
  costPerScrape: number = 1.0
): Promise<{
  totalHits: number;
  estimatedSavings: number;
  cacheHitRate: number;
}> {
  const cache = new ContentCacheManager(supabaseClient);
  const stats = await cache.getStats();
  
  if (!stats || !stats[0]) {
    return {
      totalHits: 0,
      estimatedSavings: 0,
      cacheHitRate: 0
    };
  }
  
  const totalHits = parseInt(stats[0].total_hits) || 0;
  const totalEntries = parseInt(stats[0].total_entries) || 0;
  const estimatedSavings = totalHits * costPerScrape;
  const cacheHitRate = totalEntries > 0 ? (totalHits / (totalHits + totalEntries)) * 100 : 0;
  
  return {
    totalHits,
    estimatedSavings,
    cacheHitRate
  };
}

