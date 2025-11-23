-- Add user_id column to report_subscriptions table
ALTER TABLE public.report_subscriptions 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_report_subscriptions_user_id ON public.report_subscriptions(user_id);

-- Drop the existing public access policy
DROP POLICY IF EXISTS "Allow public access to report_subscriptions" ON public.report_subscriptions;

-- Create user-specific RLS policies for report_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.report_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.report_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.report_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.report_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);