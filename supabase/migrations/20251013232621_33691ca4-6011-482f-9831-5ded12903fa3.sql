-- Add missing source types to the enum
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'blog';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'prnewswire';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'twitter';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'teamblind';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'ashby';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'greenhouse';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'clay';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'levels_fyi';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'teksystems';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'toptal';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'adecco_group';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'headhunter';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'recruiting_site';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'other';