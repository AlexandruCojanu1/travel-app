-- =====================================================
-- CHECK: User credentials for business owner
-- This will show the email associated with the user ID
-- =====================================================

SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE id = '54800c95-4dbe-459d-b3a9-c449796c3864';

-- If the user doesn't exist, you'll need to create an account
-- The email will be shown above - use that to login

