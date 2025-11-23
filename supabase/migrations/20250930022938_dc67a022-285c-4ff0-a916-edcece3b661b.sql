-- Add content type enum
CREATE TYPE content_type AS ENUM (
  'webpage_text',
  'blog_post',
  'press_release',
  'job_posting',
  'video',
  'image',
  'pdf_document',
  'news_article',
  'social_media_post',
  'forum_post',
  'company_announcement'
);

-- Add content_type column to signals table
ALTER TABLE public.signals ADD COLUMN content_type content_type DEFAULT 'webpage_text';