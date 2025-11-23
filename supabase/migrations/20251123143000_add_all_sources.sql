-- Migration: Add all_sources column
-- Created: 2025-11-23
-- Description: Store all researched sources, not just verified ones

ALTER TABLE public.grok_search_results
ADD COLUMN IF NOT EXISTS all_sources JSONB;

COMMENT ON COLUMN public.grok_search_results.all_sources IS 'List of all sources found during research phase';
