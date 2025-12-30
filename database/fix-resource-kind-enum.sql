-- =====================================================
-- FIX: Add missing values to resource_kind enum
-- Run this script in Supabase SQL Editor
-- =====================================================

-- First, check what values exist in the enum
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'resource_kind'
ORDER BY e.enumsortorder;

-- Add 'menu_section' to resource_kind enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'menu_section' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'resource_kind')
  ) THEN
    ALTER TYPE resource_kind ADD VALUE 'menu_section';
    RAISE NOTICE 'Added menu_section to resource_kind enum';
  ELSE
    RAISE NOTICE 'menu_section already exists in resource_kind enum';
  END IF;
END $$;

-- Add 'menu_item' to resource_kind enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'menu_item' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'resource_kind')
  ) THEN
    ALTER TYPE resource_kind ADD VALUE 'menu_item';
    RAISE NOTICE 'Added menu_item to resource_kind enum';
  ELSE
    RAISE NOTICE 'menu_item already exists in resource_kind enum';
  END IF;
END $$;

-- Verify the enum values after adding
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'resource_kind'
ORDER BY e.enumsortorder;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this script, menu_section and menu_item
-- will be valid values for the resource_kind enum
-- =====================================================

