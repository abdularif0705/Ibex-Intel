/**
 * Grok Search Cache Manager
 * Handles caching of Grok search results to reduce API calls and costs
 */

interface CachedSearch {
  id?: string;
  query_hash: string;
  query: string;
  results: any;
  cached_at: string;
  expires_at: string;
  hit_count?: number;
}

/**
 * Generate a hash for a query string
 */
export function hashQuery(query: string): string {
  // Simple hash function - in production, consider using crypto.subtle.digest
  let hash = 0;
  const normalized = query.toLowerCase().trim();
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Get cached search results if available and not expired
 */
export async function getCachedSearch(
  query: string,
  supabase: any
): Promise<CachedSearch | null> {
  try {
    const queryHash = hashQuery(query);
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('grok_search_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .gt('expires_at', now)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No results found - not an error
        return null;
      }
      console.error('[Cache] Error fetching cached search:', error);
      return null;
    }
    
    // Increment hit count
    if (data) {
      await supabase
        .from('grok_search_cache')
        .update({ hit_count: (data.hit_count || 0) + 1 })
        .eq('id', data.id)
        .then(() => {
          console.log(`[Cache] Hit count incremented for query: ${query.substring(0, 50)}...`);
        });
    }
    
    return data;
  } catch (error) {
    console.error('[Cache] Error in getCachedSearch:', error);
    return null;
  }
}

/**
 * Cache search results
 */
export async function cacheSearch(
  query: string,
  results: any,
  supabase: any,
  ttlHours: number = 24
): Promise<void> {
  try {
    const queryHash = hashQuery(query);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    
    const { error } = await supabase
      .from('grok_search_cache')
      .upsert({
        query_hash: queryHash,
        query: query,
        results: results,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        hit_count: 0
      }, {
        onConflict: 'query_hash'
      });
    
    if (error) {
      console.error('[Cache] Error caching search:', error);
      // Don't throw - caching is optional
    } else {
      console.log(`[Cache] Cached results for query: ${query.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error('[Cache] Error in cacheSearch:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Get cached search even if expired (for fallback scenarios)
 */
export async function getExpiredCachedSearch(
  query: string,
  supabase: any
): Promise<CachedSearch | null> {
  try {
    const queryHash = hashQuery(query);
    
    const { data, error } = await supabase
      .from('grok_search_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    console.log('[Cache] Using expired cache as fallback');
    return data;
  } catch (error) {
    console.error('[Cache] Error in getExpiredCachedSearch:', error);
    return null;
  }
}

/**
 * Invalidate cache for a specific query
 */
export async function invalidateCache(
  query: string,
  supabase: any
): Promise<void> {
  try {
    const queryHash = hashQuery(query);
    
    await supabase
      .from('grok_search_cache')
      .delete()
      .eq('query_hash', queryHash);
    
    console.log(`[Cache] Invalidated cache for query: ${query.substring(0, 50)}...`);
  } catch (error) {
    console.error('[Cache] Error invalidating cache:', error);
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(supabase: any): Promise<number> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('grok_search_cache')
      .delete()
      .lt('expires_at', now)
      .select('id');
    
    if (error) {
      console.error('[Cache] Error clearing expired cache:', error);
      return 0;
    }
    
    const count = data?.length || 0;
    console.log(`[Cache] Cleared ${count} expired cache entries`);
    return count;
  } catch (error) {
    console.error('[Cache] Error in clearExpiredCache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  totalHits: number;
  avgHitsPerEntry: number;
  cacheSize: number; // in bytes (approximate)
}

export async function getCacheStats(supabase: any): Promise<CacheStats> {
  try {
    const now = new Date().toISOString();
    
    // Get all cache entries
    const { data: allEntries } = await supabase
      .from('grok_search_cache')
      .select('hit_count, expires_at, results');
    
    if (!allEntries) {
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalHits: 0,
        avgHitsPerEntry: 0,
        cacheSize: 0
      };
    }
    
    const totalEntries = allEntries.length;
    const validEntries = allEntries.filter(e => e.expires_at > now).length;
    const expiredEntries = totalEntries - validEntries;
    const totalHits = allEntries.reduce((sum, e) => sum + (e.hit_count || 0), 0);
    const avgHitsPerEntry = totalEntries > 0 ? totalHits / totalEntries : 0;
    
    // Approximate cache size
    const cacheSize = JSON.stringify(allEntries).length;
    
    return {
      totalEntries,
      validEntries,
      expiredEntries,
      totalHits,
      avgHitsPerEntry: Math.round(avgHitsPerEntry * 10) / 10,
      cacheSize
    };
  } catch (error) {
    console.error('[Cache] Error getting cache stats:', error);
    return {
      totalEntries: 0,
      validEntries: 0,
      expiredEntries: 0,
      totalHits: 0,
      avgHitsPerEntry: 0,
      cacheSize: 0
    };
  }
}

/**
 * Warm up cache with common queries (for optimization)
 */
export async function warmUpCache(
  commonQueries: string[],
  searchFunction: (query: string) => Promise<any>,
  supabase: any
): Promise<void> {
  console.log(`[Cache] Warming up cache with ${commonQueries.length} queries...`);
  
  for (const query of commonQueries) {
    try {
      // Check if already cached
      const cached = await getCachedSearch(query, supabase);
      if (cached) {
        console.log(`[Cache] Query already cached: ${query.substring(0, 50)}...`);
        continue;
      }
      
      // Fetch and cache
      const results = await searchFunction(query);
      await cacheSearch(query, results, supabase, 48); // 48 hour TTL for warmup
      
      console.log(`[Cache] Warmed up cache for: ${query.substring(0, 50)}...`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[Cache] Error warming up cache for query: ${query}`, error);
    }
  }
  
  console.log('[Cache] Cache warmup complete');
}

