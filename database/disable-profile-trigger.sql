-- =====================================================
-- TEMPORARY: Disable profile creation trigger
-- Use this if the trigger is causing signup to fail
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Note: After disabling, profiles will need to be created manually
-- during onboarding, which is what we're doing in completeOnboarding

-- To re-enable the trigger later, run:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

