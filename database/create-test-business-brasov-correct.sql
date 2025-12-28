-- =====================================================
-- CREATE: Test business in Brașov (CORRECT VERSION)
-- Uses owner_user_id (NOT NULL) and type (NOT NULL)
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Get Brașov city ID and verify user exists
DO $$
DECLARE
  brasov_city_id UUID;
  test_user_id UUID := '54800c95-4dbe-459d-b3a9-c449796c3864';
  business_id UUID;
  business_type TEXT; -- Will try to determine from existing businesses or use default
BEGIN
  -- Find Brașov city
  SELECT id INTO brasov_city_id
  FROM cities
  WHERE name = 'Brașov' OR name ILIKE '%brasov%'
  LIMIT 1;
  
  IF brasov_city_id IS NULL THEN
    RAISE EXCEPTION 'Brașov city not found. Please run romanian-cities.sql first!';
  END IF;
  
  RAISE NOTICE 'Found Brașov city: %', brasov_city_id;
  
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    RAISE EXCEPTION 'User with ID % not found!', test_user_id;
  END IF;
  
  RAISE NOTICE 'Using user ID: %', test_user_id;
  
  -- Try to get enum values from pg_enum first (most reliable)
  SELECT e.enumlabel INTO business_type
  FROM pg_type t 
  JOIN pg_enum e ON t.oid = e.enumtypid  
  WHERE t.typname = 'business_type'
  ORDER BY e.enumsortorder
  LIMIT 1;
  
  -- If no enum found, try to get a valid type from existing businesses
  IF business_type IS NULL THEN
    SELECT DISTINCT type::text INTO business_type
    FROM businesses
    WHERE type IS NOT NULL
    LIMIT 1;
  END IF;
  
  -- If still NULL, we need to know the enum values
  -- Common values might be: 'restaurant', 'hotel', 'activity', 'attraction', 'shop'
  -- Or they might match category values: 'Hotels', 'Food', 'Nature', 'Activities'
  IF business_type IS NULL THEN
    RAISE EXCEPTION 'Could not determine business_type enum value. Please run check-business-type-enum.sql first to see available values, then update this script with a valid enum value.';
  END IF;
  
  RAISE NOTICE 'Using business type: %', business_type;
  
  -- Step 2: Check if business already exists
  SELECT id INTO business_id
  FROM businesses
  WHERE name = 'Test Business Brașov' AND owner_user_id = test_user_id
  LIMIT 1;
  
  -- Step 3: Create or update the business
  IF business_id IS NULL THEN
    -- Business doesn't exist, create it with required columns
    -- Cast business_type TEXT to business_type enum
    INSERT INTO businesses (
      city_id,
      name,
      type,
      owner_user_id
    ) VALUES (
      brasov_city_id,
      'Test Business Brașov',
      business_type::business_type, -- Cast TEXT to business_type enum
      test_user_id
    )
    RETURNING id INTO business_id;
    
    RAISE NOTICE '✅ Created test business with ID: %', business_id;
  ELSE
    -- Business exists, update owner_user_id if needed
    UPDATE businesses
    SET owner_user_id = test_user_id
    WHERE id = business_id AND (owner_user_id IS NULL OR owner_user_id != test_user_id);
    
    RAISE NOTICE '✅ Test business already exists with ID: %', business_id;
  END IF;
  
  RAISE NOTICE 'Business ID: %', business_id;
  RAISE NOTICE 'Owner User ID: %', test_user_id;
  RAISE NOTICE 'City: Brașov';
  RAISE NOTICE 'Type: %', business_type;
END $$;

-- Step 4: Show summary
SELECT 
  b.id,
  b.name,
  b.owner_user_id,
  b.type,
  b.city_id,
  c.name as city_name,
  b.created_at
FROM businesses b
LEFT JOIN cities c ON b.city_id = c.id
WHERE b.name = 'Test Business Brașov' AND b.owner_user_id = '54800c95-4dbe-459d-b3a9-c449796c3864'
ORDER BY b.created_at DESC
LIMIT 1;

-- Done! Now you can login with the user account and see the business dashboard.

