-- =====================================================
-- FIX: Check if email column exists in profiles table
-- If it doesn't exist, we'll remove it from inserts
-- =====================================================

-- Check if email column exists
DO $$
BEGIN
  -- If email column doesn't exist, we don't need to add it
  -- The application will work without it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    -- Email column doesn't exist - this is OK, we'll use auth.users.email instead
    RAISE NOTICE 'Email column does not exist in profiles table. This is OK - we can use auth.users.email instead.';
  ELSE
    RAISE NOTICE 'Email column exists in profiles table.';
  END IF;
END $$;

-- Ensure profiles table has the correct structure
-- Make sure all required columns exist
DO $$
BEGIN
  -- Add full_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Add avatar_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add home_city_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'home_city_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN home_city_id UUID REFERENCES cities(id);
  END IF;

  -- Add role if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('tourist', 'local'));
  END IF;
END $$;


