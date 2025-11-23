-- Add scan_type column to signals table to differentiate manual vs smart scans
ALTER TABLE public.signals 
ADD COLUMN scan_type text NOT NULL DEFAULT 'manual' CHECK (scan_type IN ('manual', 'smart'));

-- Add index for faster filtering
CREATE INDEX idx_signals_scan_type ON public.signals(scan_type);

-- Add comment
COMMENT ON COLUMN public.signals.scan_type IS 'Type of scan: manual (individual source) or smart (intelligent company scan)';
