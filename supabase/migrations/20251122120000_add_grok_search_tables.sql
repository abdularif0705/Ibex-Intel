-- Migration: Add Grok Search cache and usage tracking tables
-- Created: 2025-11-22
-- Description: Support caching and rate limiting for Grok Search API

-- Create grok_search_cache table for caching search results
CREATE TABLE IF NOT EXISTS public.grok_search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_hash TEXT UNIQUE NOT NULL,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grok_cache_query_hash ON public.grok_search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_grok_cache_expires_at ON public.grok_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_grok_cache_hit_count ON public.grok_search_cache(hit_count DESC);

-- Create grok_api_usage table for rate limiting
CREATE TABLE IF NOT EXISTS public.grok_api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  requests INTEGER DEFAULT 0,
  quota_limit INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_grok_usage_user_date ON public.grok_api_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_grok_usage_date ON public.grok_api_usage(date);

-- Add RLS policies for grok_search_cache
ALTER TABLE public.grok_search_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cache
DROP POLICY IF EXISTS "Allow authenticated users to read cache" ON public.grok_search_cache;
CREATE POLICY "Allow authenticated users to read cache" ON public.grok_search_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to manage cache
DROP POLICY IF EXISTS "Allow service role to manage cache" ON public.grok_search_cache;
CREATE POLICY "Allow service role to manage cache" ON public.grok_search_cache
  FOR ALL
  TO service_role
  USING (true);

-- Add RLS policies for grok_api_usage
ALTER TABLE public.grok_api_usage ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own usage
DROP POLICY IF EXISTS "Users can read own usage" ON public.grok_api_usage;
CREATE POLICY "Users can read own usage" ON public.grok_api_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to manage usage
DROP POLICY IF EXISTS "Allow service role to manage usage" ON public.grok_api_usage;
CREATE POLICY "Allow service role to manage usage" ON public.grok_api_usage
  FOR ALL
  TO service_role
  USING (true);

-- Create function to automatically clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_grok_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.grok_search_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's remaining quota
CREATE OR REPLACE FUNCTION get_grok_quota_remaining(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  today_usage INTEGER;
  quota_limit INTEGER;
BEGIN
  SELECT requests, quota_limit INTO today_usage, quota_limit
  FROM public.grok_api_usage
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    -- No usage today, return default quota
    RETURN 50;
  END IF;
  
  RETURN GREATEST(0, quota_limit - today_usage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION clean_expired_grok_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_grok_quota_remaining(UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE public.grok_search_cache IS 'Cache for Grok Search API results to reduce API calls';
COMMENT ON TABLE public.grok_api_usage IS 'Track Grok API usage for rate limiting';
COMMENT ON FUNCTION clean_expired_grok_cache() IS 'Removes expired cache entries';
COMMENT ON FUNCTION get_grok_quota_remaining(UUID) IS 'Returns remaining API quota for a user';
