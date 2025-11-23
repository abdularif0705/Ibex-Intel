-- Migration: Add past and future impact columns
-- Created: 2025-11-22
-- Description: Separate share impact into past and future components

ALTER TABLE public.grok_search_results
ADD COLUMN IF NOT EXISTS past_impacts JSONB,
ADD COLUMN IF NOT EXISTS future_impacts JSONB;

COMMENT ON COLUMN public.grok_search_results.past_impacts IS 'List of historical financial impacts';
COMMENT ON COLUMN public.grok_search_results.future_impacts IS 'List of forecasted financial impacts';
