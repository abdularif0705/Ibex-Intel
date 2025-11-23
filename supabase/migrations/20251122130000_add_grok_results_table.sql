-- Migration: Add Grok Search Results table
-- Created: 2025-11-22
-- Description: Store detailed Grok search results for history and analysis

CREATE TABLE IF NOT EXISTS public.grok_search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  phase TEXT,
  signal_type TEXT,
  confidence INTEGER,
  share_impact TEXT,
  impacts JSONB, -- Array of impact strings
  summary TEXT,
  evidence JSONB, -- Array of evidence strings
  sources JSONB, -- Array of source objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_grok_results_user_id ON public.grok_search_results(user_id);
CREATE INDEX IF NOT EXISTS idx_grok_results_company ON public.grok_search_results(company_name);
CREATE INDEX IF NOT EXISTS idx_grok_results_created_at ON public.grok_search_results(created_at DESC);

-- Enable RLS
ALTER TABLE public.grok_search_results ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can insert their own results
DROP POLICY IF EXISTS "Users can insert own results" ON public.grok_search_results;
CREATE POLICY "Users can insert own results" ON public.grok_search_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own results
DROP POLICY IF EXISTS "Users can view own results" ON public.grok_search_results;
CREATE POLICY "Users can view own results" ON public.grok_search_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access" ON public.grok_search_results;
CREATE POLICY "Service role full access" ON public.grok_search_results
  FOR ALL
  TO service_role
  USING (true);

-- Comments
COMMENT ON TABLE public.grok_search_results IS 'Stores detailed strategic insights from Grok searches';
