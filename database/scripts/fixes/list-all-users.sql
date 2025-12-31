-- =====================================================
-- LIST: All users in the system
-- This will show you all available user emails
-- =====================================================

SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Copy one of these emails and use it in assign-business-to-user.sql

