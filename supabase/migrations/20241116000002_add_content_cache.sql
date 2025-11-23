-- Add content caching table to reduce Firecrawl API costs
-- Caches scraped content for 24 hours to avoid re-scraping the same URLs

CREATE TABLE IF NOT EXISTS content_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_hash TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_content_cache_hash ON content_cache(url_hash);
CREATE INDEX idx_content_cache_expires ON content_cache(expires_at);
CREATE INDEX idx_content_cache_scraped ON content_cache(scraped_at DESC);

-- Add comment for documentation
COMMENT ON TABLE content_cache IS 'Caches scraped content to reduce API costs. TTL: 24 hours';
COMMENT ON COLUMN content_cache.url_hash IS 'Hash of normalized URL for fast lookup';
COMMENT ON COLUMN content_cache.expires_at IS 'When this cache entry expires (24 hours from scraped_at)';
COMMENT ON COLUMN content_cache.hit_count IS 'Number of times this cached content was reused';

-- Create function to automatically set expires_at
CREATE OR REPLACE FUNCTION set_cache_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expiry to 24 hours from now
  NEW.expires_at := NOW() + INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set expires_at on insert
CREATE TRIGGER set_cache_expiry_trigger
BEFORE INSERT ON content_cache
FOR EACH ROW
EXECUTE FUNCTION set_cache_expiry();

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM content_cache
  WHERE expires_at < NOW();
  
  RAISE NOTICE 'Cleaned up expired cache entries';
END;
$$;

-- Create function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE (
  total_entries BIGINT,
  total_hits BIGINT,
  avg_hit_count NUMERIC,
  cache_size_mb NUMERIC,
  oldest_entry TIMESTAMP WITH TIME ZONE,
  newest_entry TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_entries,
    SUM(hit_count)::BIGINT as total_hits,
    ROUND(AVG(hit_count), 2) as avg_hit_count,
    ROUND(pg_total_relation_size('content_cache')::NUMERIC / (1024*1024), 2) as cache_size_mb,
    MIN(scraped_at) as oldest_entry,
    MAX(scraped_at) as newest_entry
  FROM content_cache;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-content-cache', '0 2 * * *', 'SELECT cleanup_expired_cache()');

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON content_cache TO authenticated;




