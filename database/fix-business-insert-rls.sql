-- =====================================================
-- FIX: Ensure INSERT policy works for businesses table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure owner_user_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE businesses ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_businesses_owner_user_id ON businesses(owner_user_id);
    RAISE NOTICE 'Added owner_user_id column to businesses table';
  ELSE
    RAISE NOTICE 'owner_user_id column already exists';
  END IF;
END $$;

-- Step 2: Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Verified users can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Authenticated users can insert businesses" ON businesses;

-- Step 3: Create INSERT policy - Allow authenticated users to insert businesses
-- The policy only checks that the user is authenticated (simplest approach)
-- We don't check owner_user_id because it might not exist in schema cache
CREATE POLICY "Authenticated users can insert businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 4: Verify the policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'businesses' AND cmd = 'INSERT';

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON businesses TO authenticated;

-- Done! The INSERT policy should now work correctly.

