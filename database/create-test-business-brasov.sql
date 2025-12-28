-- =====================================================
-- CREATE: Test business in Brașov for testing dashboard
-- This script creates a business in Brașov and assigns it to the first user
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Get Brașov city ID
DO $$
DECLARE
  brasov_city_id UUID;
  test_user_id UUID;
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
  
  -- Use your specific user ID
  test_user_id := '54800c95-4dbe-459d-b3a9-c449796c3864';
  
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    RAISE EXCEPTION 'User with ID % not found. Please use a valid user ID!', test_user_id;
  END IF;
  
  RAISE NOTICE 'Using user ID: %', test_user_id;
  
  -- Step 2: Check if business already exists
  SELECT id INTO business_id
  FROM businesses
  WHERE name = 'Test Business Brașov' AND owner_id = test_user_id
  LIMIT 1;
  
  -- Step 3: Create or update the business
  -- Only use columns that definitely exist: id, city_id, name, description, image_url, rating, is_verified, owner_id, created_at, updated_at
  IF business_id IS NULL THEN
    -- Business doesn't exist, create it
    INSERT INTO businesses (
      city_id,
      name,
      description,
      image_url,
      rating,
      is_verified,
      owner_id
    ) VALUES (
      brasov_city_id,
      'Test Business Brașov',
      'A test business in Brașov for testing the business dashboard functionality.',
      'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800',
      4.5,
      true,
      test_user_id
    )
    RETURNING id INTO business_id;
    
    IF business_id IS NOT NULL THEN
      RAISE NOTICE 'Created test business with ID: %', business_id;
    END IF;
  ELSE
    -- Business exists, update owner_id if needed
    UPDATE businesses
    SET owner_id = test_user_id
    WHERE id = business_id AND (owner_id IS NULL OR owner_id != test_user_id);
    
    RAISE NOTICE 'Test business already exists with ID: %', business_id;
  END IF;
  
  -- Step 4: Verify the business was created/updated
  IF business_id IS NOT NULL THEN
    RAISE NOTICE '✅ Test business created/updated successfully!';
    RAISE NOTICE 'Business ID: %', business_id;
    RAISE NOTICE 'Owner ID: %', test_user_id;
    RAISE NOTICE 'City: Brașov';
  ELSE
    RAISE EXCEPTION 'Failed to create test business';
  END IF;
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
WHERE b.name = 'Test Business Brașov'
ORDER BY b.created_at DESC
LIMIT 1;

-- Done! Now you can login with the user account and see the business dashboard.

