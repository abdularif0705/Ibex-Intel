-- Clean up NULL user_id records before adding constraints
DELETE FROM public.signal_evidence WHERE user_id IS NULL;
DELETE FROM public.signals WHERE user_id IS NULL;
DELETE FROM public.scraping_jobs WHERE user_id IS NULL;

-- Add NOT NULL constraints to all core tables
ALTER TABLE public.signals 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.signal_evidence 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.scraping_jobs 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.scheduled_scans 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.report_subscriptions 
ALTER COLUMN user_id SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.signals.user_id IS 'User ID is required for all signals - enforces data integrity and RLS';
COMMENT ON COLUMN public.signal_evidence.user_id IS 'User ID is required for all evidence - enforces data integrity and RLS';
COMMENT ON COLUMN public.scraping_jobs.user_id IS 'User ID is required for all jobs - enforces data integrity and RLS';
COMMENT ON COLUMN public.scheduled_scans.user_id IS 'User ID is required for all scans - enforces data integrity and RLS';
COMMENT ON COLUMN public.report_subscriptions.user_id IS 'User ID is required for all subscriptions - enforces data integrity and RLS';