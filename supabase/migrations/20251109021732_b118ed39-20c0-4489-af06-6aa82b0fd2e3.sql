-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Service role can update scan limits" ON public.user_scan_limits;

-- Create a properly restricted UPDATE policy that only allows service_role
CREATE POLICY "Service role can update scan limits"
ON public.user_scan_limits
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);