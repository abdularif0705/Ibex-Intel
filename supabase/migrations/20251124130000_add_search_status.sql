-- Migration: Add status column to grok_search_results
-- Created: 2025-11-24
-- Description: Track the status of async search tasks

ALTER TABLE public.grok_search_results
ADD COLUMN IF NOT EXISTS status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'));

COMMENT ON COLUMN public.grok_search_results.status IS 'Status of the async search task: running, completed, or failed';
