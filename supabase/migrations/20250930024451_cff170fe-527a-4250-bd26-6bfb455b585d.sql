-- Add custom URL monitoring column to report_subscriptions
ALTER TABLE public.report_subscriptions
ADD COLUMN IF NOT EXISTS custom_monitor_urls TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.report_subscriptions.custom_monitor_urls IS 'Array of custom URLs to monitor for signals (up to 5)';