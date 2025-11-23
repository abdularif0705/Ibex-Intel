-- Add headhunter to source_type enum
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'headhunter';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'recruiting_site';