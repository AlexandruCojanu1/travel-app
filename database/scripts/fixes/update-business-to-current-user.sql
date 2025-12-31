-- =====================================================
-- UPDATE: Assign business to your current user
-- Run this AFTER you create/login with your account
-- =====================================================

-- Step 1: Find your user ID (replace 'your-email@example.com' with your actual email)
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com'  -- CHANGE THIS to your email
ORDER BY created_at DESC
LIMIT 1;

-- Step 2: Update the business to use your user ID
-- Replace '<YOUR_USER_ID>' with the ID from Step 1
UPDATE businesses
SET owner_user_id = '<YOUR_USER_ID>'  -- CHANGE THIS to your user ID from Step 1
WHERE name = 'Test Business Brașov';

-- Step 3: Verify the update
SELECT 
  b.id,
  b.name,
  b.owner_user_id,
  u.email as owner_email,
  b.type,
  c.name as city_name
FROM businesses b
LEFT JOIN auth.users u ON b.owner_user_id = u.id
LEFT JOIN cities c ON b.city_id = c.id
WHERE b.name = 'Test Business Brașov';

-- Done! Now you can login with your email and see the business dashboard.

