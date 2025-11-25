-- Migration: Allow authenticated users to update their own results
-- Created: 2025-11-24
-- Description: Fix RLS violation preventing background task from updating results

-- Allow authenticated users to update their own results
DROP POLICY IF EXISTS "Users can update own results" ON public.grok_search_results;
CREATE POLICY "Users can update own results" ON public.grok_search_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
