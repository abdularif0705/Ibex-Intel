-- Add new source types to the source_type enum
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'ashby';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'greenhouse';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'clay';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'levels_fyi';