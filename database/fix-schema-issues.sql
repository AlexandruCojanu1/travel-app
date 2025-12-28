-- =====================================================
-- FIX: Schema Issues - Add missing columns and fix enum
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Fix role column in profiles table
-- This handles enum types and converts them to TEXT with CHECK constraint
DO $$
DECLARE
  col_type TEXT;
  enum_name TEXT;
  invalid_count INTEGER;
BEGIN
  -- Check if role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    -- Column doesn't exist, add it
    ALTER TABLE profiles ADD COLUMN role TEXT;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('tourist', 'local'));
    RAISE NOTICE 'Added role column to profiles table';
  ELSE
    -- Column exists, get its type
    SELECT data_type, udt_name INTO col_type, enum_name
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role';
    
    -- Drop existing CHECK constraint if it exists (we'll recreate it)
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- If it's an enum (USER-DEFINED), we need to convert it
    IF col_type = 'USER-DEFINED' THEN
      -- Convert enum to TEXT
      EXECUTE format('ALTER TABLE profiles ALTER COLUMN role TYPE TEXT USING role::TEXT');
      RAISE NOTICE 'Converted role column from enum to TEXT';
    ELSIF col_type != 'text' THEN
      -- Ensure it's TEXT type
      ALTER TABLE profiles ALTER COLUMN role TYPE TEXT USING role::TEXT;
      RAISE NOTICE 'Converted role column to TEXT';
    END IF;
    
    -- Clean up invalid role values before adding constraint
    -- Count invalid values
    SELECT COUNT(*) INTO invalid_count
    FROM profiles
    WHERE role IS NOT NULL 
      AND role NOT IN ('tourist', 'local');
    
    IF invalid_count > 0 THEN
      RAISE NOTICE 'Found % invalid role values, setting them to "tourist" as default', invalid_count;
      -- Set invalid values to 'tourist' as default (they can be updated later)
      UPDATE profiles
      SET role = 'tourist'
      WHERE role IS NOT NULL 
        AND role NOT IN ('tourist', 'local');
    END IF;
    
    -- Check if there's a NOT NULL constraint and handle it
    -- First, try to add CHECK constraint that allows NULL
    BEGIN
      ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IS NULL OR role IN ('tourist', 'local'));
      RAISE NOTICE 'Added CHECK constraint (allows NULL, tourist, or local)';
    EXCEPTION
      WHEN OTHERS THEN
        -- If it fails, there might be a NOT NULL constraint
        -- Try to add constraint without NULL check
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
          CHECK (role IN ('tourist', 'local'));
        RAISE NOTICE 'Added CHECK constraint (requires tourist or local, no NULL allowed)';
    END;
    
    RAISE NOTICE 'Added CHECK constraint to role column (allows NULL, tourist, or local)';
  END IF;
END $$;

-- Step 2: Add owner_id column to businesses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE businesses ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
    RAISE NOTICE 'Added owner_id column to businesses table';
  END IF;
END $$;

-- Step 3: Add rating column to businesses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'rating'
  ) THEN
    ALTER TABLE businesses ADD COLUMN rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5);
    CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(rating DESC);
    RAISE NOTICE 'Added rating column to businesses table';
  END IF;
END $$;

-- Step 4: Add is_active column to promotions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE promotions ADD COLUMN is_active BOOLEAN DEFAULT true;
    CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
    RAISE NOTICE 'Added is_active column to promotions table';
  END IF;
END $$;

-- Step 5: Update RLS policies for businesses to check owner_id
DROP POLICY IF EXISTS "Business owners can update their businesses" ON businesses;
CREATE POLICY "Business owners can update their businesses"
  ON businesses FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND 
    (owner_id IS NULL OR auth.uid() = owner_id)
  );

-- Step 6: Add policy for business owners to view their own businesses
DROP POLICY IF EXISTS "Business owners can view their own businesses" ON businesses;
CREATE POLICY "Business owners can view their own businesses"
  ON businesses FOR SELECT
  USING (
    true OR 
    (owner_id IS NOT NULL AND auth.uid() = owner_id)
  );

-- Done!
DO $$
BEGIN
  RAISE NOTICE 'Schema fixes completed successfully!';
  RAISE NOTICE 'The role column should now accept both "tourist" and "local" values.';
END $$;

