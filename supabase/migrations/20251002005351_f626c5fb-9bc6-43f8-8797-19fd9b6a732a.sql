-- Add staffing agency source types to the source_type enum
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'teksystems';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'toptal';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'adecco_group';