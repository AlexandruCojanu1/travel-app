-- =====================================================
-- ENSURE: category column exists in businesses table
-- Run this in Supabase SQL Editor if category column is missing
-- =====================================================

-- Check if category column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'category'
  ) THEN
    ALTER TABLE businesses ADD COLUMN category TEXT NOT NULL DEFAULT 'Other';
    CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
    RAISE NOTICE 'Added category column to businesses table';
  ELSE
    RAISE NOTICE 'Category column already exists in businesses table';
  END IF;
END $$;

-- Verify the column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'businesses' AND column_name = 'category';

