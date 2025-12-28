-- =====================================================
-- SET: Assign owner_id to businesses for a specific user
-- Replace 'YOUR_USER_ID' with your actual user ID
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Check current businesses and their owners
SELECT 
  id, 
  name, 
  owner_id, 
  created_at,
  CASE 
    WHEN owner_id IS NULL THEN 'NO OWNER'
    ELSE 'HAS OWNER'
  END as status
FROM businesses
ORDER BY created_at DESC
LIMIT 20;

-- Step 2: Set owner_id for businesses that don't have one
-- Replace '54800c95-4dbe-459d-b3a9-c449796c3864' with your actual user ID
DO $$
DECLARE
  target_user_id UUID := '54800c95-4dbe-459d-b3a9-c449796c3864';
  updated_count INTEGER;
BEGIN
  -- Update businesses without owner_id to the target user
  UPDATE businesses
  SET owner_id = target_user_id
  WHERE owner_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % businesses with owner_id', updated_count;
END $$;

-- Step 3: Verify the update
SELECT 
  id, 
  name, 
  owner_id, 
  created_at
FROM businesses
WHERE owner_id = '54800c95-4dbe-459d-b3a9-c449796c3864'
ORDER BY created_at DESC;

-- Done!

