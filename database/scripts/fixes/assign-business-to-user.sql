-- =====================================================
-- ASSIGN: Business to your user account
-- Replace 'your-email@example.com' with your actual email
-- =====================================================

DO $$
DECLARE
  user_email TEXT := 'your-email@example.com';  -- CHANGE THIS to your email
  user_id_found UUID;
  business_id_found UUID;
BEGIN
  -- Step 1: Find user by email
  SELECT id INTO user_id_found
  FROM auth.users
  WHERE email = user_email
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF user_id_found IS NULL THEN
    RAISE EXCEPTION 'User with email % not found! Please create an account first or check the email.', user_email;
  END IF;
  
  RAISE NOTICE 'Found user: % (ID: %)', user_email, user_id_found;
  
  -- Step 2: Find the test business
  SELECT id INTO business_id_found
  FROM businesses
  WHERE name = 'Test Business Brașov'
  LIMIT 1;
  
  IF business_id_found IS NULL THEN
    RAISE EXCEPTION 'Test Business Brașov not found! Please run create-test-business-brasov-correct.sql first.';
  END IF;
  
  RAISE NOTICE 'Found business: Test Business Brașov (ID: %)', business_id_found;
  
  -- Step 3: Update business owner
  UPDATE businesses
  SET owner_user_id = user_id_found
  WHERE id = business_id_found;
  
  RAISE NOTICE '✅ Successfully assigned business to user!';
  RAISE NOTICE 'Business ID: %', business_id_found;
  RAISE NOTICE 'Owner User ID: %', user_id_found;
  RAISE NOTICE 'Owner Email: %', user_email;
END $$;

-- Step 4: Verify the update
SELECT 
  b.id as business_id,
  b.name as business_name,
  b.owner_user_id,
  u.email as owner_email,
  b.type,
  c.name as city_name,
  b.created_at
FROM businesses b
LEFT JOIN auth.users u ON b.owner_user_id = u.id
LEFT JOIN cities c ON b.city_id = c.id
WHERE b.name = 'Test Business Brașov';

-- Done! Now login with your email and you'll be redirected to the business dashboard.

