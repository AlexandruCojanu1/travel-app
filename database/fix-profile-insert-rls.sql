-- =====================================================
-- FIX: Ensure INSERT policy works for profile creation
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Step 3: Create INSERT policy - Users can insert their own profile
-- This allows users to create their profile when signing up
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- Step 5: Verify the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Add comment
COMMENT ON POLICY "Users can insert their own profile" ON profiles IS 
  'Allows users to create their own profile during signup';

-- Done! The INSERT policy should now work correctly.

