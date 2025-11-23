-- Add SELECT policy to restrict users to their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.report_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);