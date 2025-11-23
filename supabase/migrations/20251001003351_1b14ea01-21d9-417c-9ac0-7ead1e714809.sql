-- Add scan_count tracking to monitor free trial usage
CREATE TABLE IF NOT EXISTS public.user_scan_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  scan_count INTEGER NOT NULL DEFAULT 0,
  plan_type TEXT NOT NULL DEFAULT 'free_trial',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_scan_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own scan limits
CREATE POLICY "Users can view their own scan limits" 
ON public.user_scan_limits 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own scan limits (for first-time setup)
CREATE POLICY "Users can insert their own scan limits" 
ON public.user_scan_limits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Service role can update scan counts (for edge function)
CREATE POLICY "Service role can update scan limits" 
ON public.user_scan_limits 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_scan_limits_updated_at
BEFORE UPDATE ON public.user_scan_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_user_scan_limits_user_id ON public.user_scan_limits(user_id);