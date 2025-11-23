-- Add filtering columns to report_subscriptions table
ALTER TABLE public.report_subscriptions
ADD COLUMN IF NOT EXISTS company_filters TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS source_filters TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.report_subscriptions.company_filters IS 'Array of company names, tickers, or municipalities to filter signals';
COMMENT ON COLUMN public.report_subscriptions.source_filters IS 'Array of source types to filter signals';