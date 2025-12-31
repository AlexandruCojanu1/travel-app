-- =====================================================
-- VERIFY: Check business ownership for a specific user
-- Replace 'YOUR_USER_ID' with your actual user ID
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Check all businesses and their owners
SELECT 
  id, 
  name, 
  owner_id, 
  created_at,
  CASE 
    WHEN owner_id IS NULL THEN '❌ NO OWNER'
    WHEN owner_id = '54800c95-4dbe-459d-b3a9-c449796c3864' THEN '✅ YOUR BUSINESS'
    ELSE '👤 OTHER OWNER'
  END as status
FROM businesses
ORDER BY created_at DESC;

-- Step 2: Check specifically for your user ID
SELECT 
  id, 
  name, 
  owner_id, 
  created_at
FROM businesses
WHERE owner_id = '54800c95-4dbe-459d-b3a9-c449796c3864'
ORDER BY created_at DESC;

-- Step 3: Count businesses per owner
SELECT 
  owner_id,
  COUNT(*) as business_count,
  STRING_AGG(name, ', ') as business_names
FROM businesses
WHERE owner_id IS NOT NULL
GROUP BY owner_id
ORDER BY business_count DESC;

-- Step 4: Check if owner_id column exists and has correct type
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'businesses' 
  AND column_name = 'owner_id';

