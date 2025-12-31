-- =====================================================
-- FIX: Add owner_id to businesses table and restrict posts to business owners
-- =====================================================

-- Step 1: Add owner_id column to businesses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE businesses ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
    COMMENT ON COLUMN businesses.owner_id IS 'User ID of the business owner';
  END IF;
END $$;

-- Step 2: Update RLS policy for businesses to check owner_id
DROP POLICY IF EXISTS "Business owners can update their businesses" ON businesses;
CREATE POLICY "Business owners can update their businesses"
  ON businesses FOR UPDATE
  USING (auth.uid() = owner_id);

-- Step 3: Update RLS policy for city_posts to only allow business owners to create posts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON city_posts;
CREATE POLICY "Only business owners can create posts"
  ON city_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE owner_id = auth.uid()
    )
  );

-- Step 4: Add comment explaining the restriction
COMMENT ON POLICY "Only business owners can create posts" ON city_posts IS 
  'Only users who own at least one business can create city posts';


