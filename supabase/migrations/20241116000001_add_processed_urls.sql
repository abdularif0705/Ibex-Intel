-- Add processed_urls table for deduplication across smart searches
-- This prevents re-scraping the same URLs and wasting API credits
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS processed_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_hash TEXT NOT NULL,
  url TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT,
  signal_found BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_processed_urls_hash ON processed_urls(url_hash);
CREATE INDEX idx_processed_urls_user ON processed_urls(user_id);
CREATE INDEX idx_processed_urls_date ON processed_urls(processed_at DESC);
CREATE INDEX idx_processed_urls_user_hash ON processed_urls(user_id, url_hash);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX idx_processed_urls_unique ON processed_urls(user_id, url_hash);

-- Enable Row Level Security
ALTER TABLE processed_urls ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own processed URLs
CREATE POLICY "Users can view their own processed URLs"
ON processed_urls FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processed URLs"
ON processed_urls FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own processed URLs"
ON processed_urls FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE processed_urls IS 'Tracks URLs that have been scraped to prevent duplicate processing and optimize API usage';
COMMENT ON COLUMN processed_urls.url_hash IS 'Hash of normalized URL for fast duplicate detection';
COMMENT ON COLUMN processed_urls.signal_found IS 'Whether any transformation signals were detected in this URL';
COMMENT ON COLUMN processed_urls.processed_at IS 'When this URL was last scraped';

-- Create function to clean up old processed URLs (optional, for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_processed_urls()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete processed URLs older than 90 days
  DELETE FROM processed_urls
  WHERE processed_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Optional: Create a scheduled job to run cleanup weekly (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-processed-urls', '0 0 * * 0', 'SELECT cleanup_old_processed_urls()');




