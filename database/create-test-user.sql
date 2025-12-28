-- =====================================================
-- CREATE: Test user for business owner
-- This creates a user with a known email and password
-- =====================================================

-- Note: Supabase Auth doesn't allow direct INSERT into auth.users
-- You need to create the user through the signup form or Supabase Dashboard
-- 
-- OPTION 1: Create user through signup form
-- Go to: http://localhost:3000/auth/login
-- Click "Sign Up" tab
-- Use:
--   Email: business.owner@test.com
--   Password: TestPassword123!
--   Full Name: Business Owner
--
-- After signup, run this query to get the new user ID:
SELECT id, email, created_at
FROM auth.users
WHERE email = 'business.owner@test.com'
ORDER BY created_at DESC
LIMIT 1;

-- Then update the business to use this new user ID:
-- UPDATE businesses
-- SET owner_user_id = '<NEW_USER_ID_FROM_ABOVE>'
-- WHERE name = 'Test Business Brașov';

-- OPTION 2: If you already have a user, just update the business:
-- First, find your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then update the business:
-- UPDATE businesses
-- SET owner_user_id = '<YOUR_USER_ID>'
-- WHERE name = 'Test Business Brașov';

