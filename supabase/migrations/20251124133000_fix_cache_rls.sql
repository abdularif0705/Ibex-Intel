-- Migration: Allow authenticated users to insert into cache
-- Created: 2025-11-24
-- Description: Fix RLS violation when caching search results

-- Allow authenticated users to insert into cache
DROP POLICY IF EXISTS "Allow authenticated users to insert cache" ON public.grok_search_cache;
CREATE POLICY "Allow authenticated users to insert cache" ON public.grok_search_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update cache (e.g. hit count)
DROP POLICY IF EXISTS "Allow authenticated users to update cache" ON public.grok_search_cache;
CREATE POLICY "Allow authenticated users to update cache" ON public.grok_search_cache
  FOR UPDATE
  TO authenticated
  USING (true);
