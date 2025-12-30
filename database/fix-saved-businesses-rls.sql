-- =====================================================
-- FIX: RLS Policies for saved_businesses table
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Enable RLS on saved_businesses table
ALTER TABLE saved_businesses ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own saved businesses" ON saved_businesses;
DROP POLICY IF EXISTS "Users can insert their own saved businesses" ON saved_businesses;
DROP POLICY IF EXISTS "Users can delete their own saved businesses" ON saved_businesses;

-- Step 3: Create SELECT policy - Users can view their own saved businesses
CREATE POLICY "Users can view their own saved businesses"
  ON saved_businesses FOR SELECT
  USING (auth.uid() = user_id);

-- Step 4: Create INSERT policy - Users can insert their own saved businesses
CREATE POLICY "Users can insert their own saved businesses"
  ON saved_businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Create DELETE policy - Users can delete their own saved businesses
CREATE POLICY "Users can delete their own saved businesses"
  ON saved_businesses FOR DELETE
  USING (auth.uid() = user_id);

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON saved_businesses TO authenticated;

-- Step 7: Add comments
COMMENT ON POLICY "Users can view their own saved businesses" ON saved_businesses IS 
  'Allows users to view their own saved businesses';
COMMENT ON POLICY "Users can insert their own saved businesses" ON saved_businesses IS 
  'Allows users to save businesses';
COMMENT ON POLICY "Users can delete their own saved businesses" ON saved_businesses IS 
  'Allows users to unsave businesses';

-- Done! The RLS policies for saved_businesses should now work correctly.

