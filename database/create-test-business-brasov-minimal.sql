-- =====================================================
-- CREATE: Test business in Brașov (MINIMAL - only required columns)
-- This script uses ONLY the columns that definitely exist
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Get Brașov city ID and verify user exists
DO $$
DECLARE
  brasov_city_id UUID;
  test_user_id UUID := '54800c95-4dbe-459d-b3a9-c449796c3864';
  business_id UUID;
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
  
  -- Step 2: Check if business already exists
  SELECT id INTO business_id
  FROM businesses
  WHERE name = 'Test Business Brașov' AND owner_id = test_user_id
  LIMIT 1;
  
  -- Step 3: Create or update the business (ONLY required columns)
  IF business_id IS NULL THEN
    -- Business doesn't exist, create it with ONLY required columns
    -- city_id and name are required, owner_id is what we need
    INSERT INTO businesses (
      city_id,
      name,
      owner_id
    ) VALUES (
      brasov_city_id,
      'Test Business Brașov',
      test_user_id
    )
    RETURNING id INTO business_id;
    
    RAISE NOTICE '✅ Created test business with ID: %', business_id;
  ELSE
    -- Business exists, update owner_id if needed
    UPDATE businesses
    SET owner_id = test_user_id
    WHERE id = business_id AND (owner_id IS NULL OR owner_id != test_user_id);
    
    RAISE NOTICE '✅ Test business already exists with ID: %', business_id;
  END IF;
  
  RAISE NOTICE 'Business ID: %', business_id;
  RAISE NOTICE 'Owner ID: %', test_user_id;
  RAISE NOTICE 'City: Brașov';
END $$;

-- Step 4: Show summary
SELECT 
  b.id,
  b.name,
  b.owner_id,
  b.city_id,
  c.name as city_name,
  b.created_at
FROM businesses b
LEFT JOIN cities c ON b.city_id = c.id
WHERE b.name = 'Test Business Brașov' AND b.owner_id = '54800c95-4dbe-459d-b3a9-c449796c3864'
ORDER BY b.created_at DESC
LIMIT 1;

-- Done! Now you can login with the user account and see the business dashboard.

