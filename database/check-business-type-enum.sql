-- =====================================================
-- CHECK: What are the possible values for business.type?
-- Run this to see what enum values exist
-- =====================================================

-- Method 1: Check enum values directly (most reliable)
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'business_type'
ORDER BY e.enumsortorder;

-- Method 2: Check what values are currently used in businesses table
SELECT DISTINCT type::text as used_type_value
FROM businesses 
WHERE type IS NOT NULL
ORDER BY used_type_value;

