-- Drop the existing SELECT policy that exposes email addresses
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.report_subscriptions;

-- Create a security definer function to retrieve subscriptions without exposing email
CREATE OR REPLACE FUNCTION public.get_user_subscriptions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  frequency text,
  report_name text,
  min_confidence_score numeric,
  signal_types text[],
  company_filters text[],
  source_filters text[],
  custom_monitor_urls text[],
  audience report_audience,
  is_active boolean,
  last_sent_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    frequency,
    report_name,
    min_confidence_score,
    signal_types,
    company_filters,
    source_filters,
    custom_monitor_urls,
    audience,
    is_active,
    last_sent_at,
    created_at,
    updated_at
  FROM public.report_subscriptions
  WHERE user_id = auth.uid();
$$;