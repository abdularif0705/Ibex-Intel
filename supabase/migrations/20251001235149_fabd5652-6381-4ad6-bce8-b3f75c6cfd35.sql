-- Add SEC Edgar to source_type enum
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'sec_edgar';