-- =====================================================
-- ADD: attributes JSONB column to businesses table
-- This stores type-specific fields (star_rating, cuisine_type, difficulty, etc.)
-- =====================================================

-- Add attributes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'attributes'
  ) THEN
    ALTER TABLE businesses ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
    -- Create GIN index for efficient JSONB queries
    CREATE INDEX IF NOT EXISTS idx_businesses_attributes ON businesses USING GIN (attributes);
  END IF;
END $$;

-- Add other missing columns that might be needed
DO $$
BEGIN
  -- Add owner_user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE businesses ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_businesses_owner_user_id ON businesses(owner_user_id);
  END IF;

  -- Add type (business_type enum) if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'type'
  ) THEN
    -- Check if business_type enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type') THEN
      ALTER TABLE businesses ADD COLUMN type business_type;
    ELSE
      -- Create enum if it doesn't exist
      CREATE TYPE business_type AS ENUM ('hotels', 'food', 'nature', 'activities');
      ALTER TABLE businesses ADD COLUMN type business_type;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(type);
  END IF;

  -- Add lat/lng if they don't exist (alternative to latitude/longitude)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'lat'
  ) THEN
    ALTER TABLE businesses ADD COLUMN lat DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'lng'
  ) THEN
    ALTER TABLE businesses ADD COLUMN lng DECIMAL(11, 8);
  END IF;

  -- Add address_line if it doesn't exist (alternative to address)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'address_line'
  ) THEN
    ALTER TABLE businesses ADD COLUMN address_line TEXT;
  END IF;

  -- Add phone if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'phone'
  ) THEN
    ALTER TABLE businesses ADD COLUMN phone TEXT;
  END IF;

  -- Add website if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'website'
  ) THEN
    ALTER TABLE businesses ADD COLUMN website TEXT;
  END IF;
END $$;

-- Update RLS policies to ensure business owners can manage their businesses
-- and travelers can view all businesses
DROP POLICY IF EXISTS "Anyone can view businesses" ON businesses;
CREATE POLICY "Anyone can view businesses"
  ON businesses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Business owners can update their businesses" ON businesses;
CREATE POLICY "Business owners can update their businesses"
  ON businesses FOR UPDATE
  USING (
    owner_user_id = auth.uid() OR 
    owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Business owners can delete their businesses" ON businesses;
CREATE POLICY "Business owners can delete their businesses"
  ON businesses FOR DELETE
  USING (
    owner_user_id = auth.uid() OR 
    owner_id = auth.uid()
  );

