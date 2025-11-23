-- Add user_id columns to core intelligence tables
ALTER TABLE public.signals 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.signal_evidence 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.scraping_jobs 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.scheduled_scans 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX idx_signals_user_id ON public.signals(user_id);
CREATE INDEX idx_signal_evidence_user_id ON public.signal_evidence(user_id);
CREATE INDEX idx_scraping_jobs_user_id ON public.scraping_jobs(user_id);
CREATE INDEX idx_scheduled_scans_user_id ON public.scheduled_scans(user_id);

-- Drop all old public access policies
DROP POLICY IF EXISTS "Allow public insert to signals" ON public.signals;
DROP POLICY IF EXISTS "Allow public read access to signals" ON public.signals;
DROP POLICY IF EXISTS "Allow public insert to signal_evidence" ON public.signal_evidence;
DROP POLICY IF EXISTS "Allow public read access to signal_evidence" ON public.signal_evidence;
DROP POLICY IF EXISTS "Allow public insert to scraping_jobs" ON public.scraping_jobs;
DROP POLICY IF EXISTS "Allow public read access to scraping_jobs" ON public.scraping_jobs;
DROP POLICY IF EXISTS "Allow public update to scraping_jobs" ON public.scraping_jobs;
DROP POLICY IF EXISTS "Allow public access to scheduled_scans" ON public.scheduled_scans;

-- Create user-specific RLS policies for signals
CREATE POLICY "Users can view their own signals"
ON public.signals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signals"
ON public.signals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signals"
ON public.signals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signals"
ON public.signals
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create user-specific RLS policies for signal_evidence
CREATE POLICY "Users can view their own evidence"
ON public.signal_evidence
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evidence"
ON public.signal_evidence
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evidence"
ON public.signal_evidence
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evidence"
ON public.signal_evidence
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create user-specific RLS policies for scraping_jobs
CREATE POLICY "Users can view their own scraping jobs"
ON public.scraping_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scraping jobs"
ON public.scraping_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraping jobs"
ON public.scraping_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraping jobs"
ON public.scraping_jobs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create user-specific RLS policies for scheduled_scans
CREATE POLICY "Users can view their own scheduled scans"
ON public.scheduled_scans
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled scans"
ON public.scheduled_scans
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled scans"
ON public.scheduled_scans
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled scans"
ON public.scheduled_scans
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);