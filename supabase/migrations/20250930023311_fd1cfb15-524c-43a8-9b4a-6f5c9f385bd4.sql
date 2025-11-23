-- Create scheduled scans table
CREATE TABLE public.scheduled_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_types source_type[] NOT NULL,
  target_urls TEXT[] NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create report subscriptions table
CREATE TABLE public.report_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  min_confidence_score DECIMAL(3,2) DEFAULT 0.5,
  signal_types signal_type[],
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to scheduled_scans"
  ON public.scheduled_scans FOR ALL
  USING (true);

CREATE POLICY "Allow public access to report_subscriptions"
  ON public.report_subscriptions FOR ALL
  USING (true);

-- Create indexes
CREATE INDEX idx_scheduled_scans_next_run ON public.scheduled_scans(next_run_at) WHERE is_active = true;
CREATE INDEX idx_report_subscriptions_active ON public.report_subscriptions(email) WHERE is_active = true;

-- Create updated_at triggers
CREATE TRIGGER update_scheduled_scans_updated_at
  BEFORE UPDATE ON public.scheduled_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_subscriptions_updated_at
  BEFORE UPDATE ON public.report_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();