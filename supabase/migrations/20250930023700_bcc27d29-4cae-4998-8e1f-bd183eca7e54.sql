-- Add audience type enum
CREATE TYPE report_audience AS ENUM (
  'executive',
  'analyst',
  'technical'
);

-- Add audience column to report subscriptions
ALTER TABLE public.report_subscriptions ADD COLUMN audience report_audience DEFAULT 'analyst';

-- Add report name/title for easier identification
ALTER TABLE public.report_subscriptions ADD COLUMN report_name TEXT DEFAULT 'Transformation Signals Report';