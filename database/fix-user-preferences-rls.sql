-- =====================================================
-- FIX: RLS Policies for user_preferences table
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Enable RLS on user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;

-- Step 3: Create SELECT policy - Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Step 4: Create UPDATE policy - Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Create INSERT policy - Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_preferences TO authenticated;

-- Step 7: Add comments
COMMENT ON POLICY "Users can view their own preferences" ON user_preferences IS 
  'Allows users to view their own user preferences';
COMMENT ON POLICY "Users can update their own preferences" ON user_preferences IS 
  'Allows users to update their own user preferences';
COMMENT ON POLICY "Users can insert their own preferences" ON user_preferences IS 
  'Allows users to create their own user preferences';

-- Done! The RLS policies for user_preferences should now work correctly.

