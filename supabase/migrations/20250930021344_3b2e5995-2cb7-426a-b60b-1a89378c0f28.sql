-- Drop everything and start fresh
DROP TABLE IF EXISTS public.signal_evidence CASCADE;
DROP TABLE IF EXISTS public.signals CASCADE;
DROP TABLE IF EXISTS public.scraping_jobs CASCADE;
DROP TYPE IF EXISTS signal_type CASCADE;
DROP TYPE IF EXISTS source_type CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create enum for signal types
CREATE TYPE signal_type AS ENUM (
  'erp_transformation',
  'crm_implementation',
  'infrastructure_modernization',
  'digital_transformation',
  'cloud_migration',
  'data_analytics',
  'cybersecurity_upgrade'
);

-- Create enum for source types
CREATE TYPE source_type AS ENUM (
  'linkedin',
  'reddit',
  'fishbowl',
  'teamblind',
  'hackernews',
  'glassdoor',
  'facebook',
  'monster',
  'indeed',
  'levels',
  'sec_edgar',
  'gov_finance',
  'news_site',
  'seeking_alpha',
  'twitter',
  'company_website',
  'pr_wire',
  'employee_profile'
);

-- Create signals table
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_ticker TEXT,
  signal_type signal_type NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_type source_type NOT NULL,
  source_url TEXT NOT NULL,
  raw_content TEXT,
  extracted_data JSONB,
  keywords TEXT[],
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create signal evidence table
CREATE TABLE public.signal_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  evidence_text TEXT,
  relevance_score DECIMAL(3,2),
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scraping jobs table
CREATE TABLE public.scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type source_type NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to signals"
  ON public.signals FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to signals"
  ON public.signals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to signal_evidence"
  ON public.signal_evidence FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to signal_evidence"
  ON public.signal_evidence FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to scraping_jobs"
  ON public.scraping_jobs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to scraping_jobs"
  ON public.scraping_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to scraping_jobs"
  ON public.scraping_jobs FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX idx_signals_company ON public.signals(company_name);
CREATE INDEX idx_signals_confidence ON public.signals(confidence_score DESC);
CREATE INDEX idx_signals_detected_at ON public.signals(detected_at DESC);
CREATE INDEX idx_signals_type ON public.signals(signal_type);
CREATE INDEX idx_scraping_jobs_status ON public.scraping_jobs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_signals_updated_at
  BEFORE UPDATE ON public.signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();