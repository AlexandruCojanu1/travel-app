-- =====================================================
-- UPDATE: Set owner_id for existing businesses
-- This script updates businesses that don't have owner_id set
-- Run this AFTER running fix-schema-issues.sql
-- =====================================================

-- Step 1: Check if owner_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'owner_id'
  ) THEN
    RAISE EXCEPTION 'owner_id column does not exist. Please run fix-schema-issues.sql first!';
  END IF;
END $$;

-- Step 2: For businesses without owner_id, set to the first authenticated user
-- (You can manually update owner_id later if needed)
DO $$
DECLARE
  default_user_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the first authenticated user as owner
  SELECT id INTO default_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF default_user_id IS NOT NULL THEN
    -- Update all businesses without owner_id
    UPDATE businesses
    SET owner_id = default_user_id
    WHERE owner_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Set owner_id for % businesses to user %', updated_count, default_user_id;
  ELSE
    RAISE NOTICE 'No users found, cannot set owner_id';
  END IF;
END $$;

-- Step 4: Show summary
DO $$
DECLARE
  total_count INTEGER;
  with_owner INTEGER;
  without_owner INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM businesses;
  SELECT COUNT(*) INTO with_owner FROM businesses WHERE owner_id IS NOT NULL;
  SELECT COUNT(*) INTO without_owner FROM businesses WHERE owner_id IS NULL;
  
  RAISE NOTICE 'Business summary:';
  RAISE NOTICE '  Total businesses: %', total_count;
  RAISE NOTICE '  With owner_id: %', with_owner;
  RAISE NOTICE '  Without owner_id: %', without_owner;
  RAISE NOTICE 'Business owner update completed!';
END $$;

