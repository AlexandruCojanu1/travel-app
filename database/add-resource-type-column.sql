-- =====================================================
-- ADD: resource_type column to business_resources table
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Check if business_resources table exists, if not create it
CREATE TABLE IF NOT EXISTS business_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT,
  kind TEXT NOT NULL DEFAULT 'resource', -- Add kind column with default
  base_price NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add resource_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_resources' AND column_name = 'resource_type'
  ) THEN
    ALTER TABLE business_resources ADD COLUMN resource_type TEXT;
    CREATE INDEX IF NOT EXISTS idx_business_resources_resource_type ON business_resources(resource_type);
    RAISE NOTICE 'Added resource_type column to business_resources table';
  ELSE
    RAISE NOTICE 'resource_type column already exists';
  END IF;
END $$;

-- Add kind column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_resources' AND column_name = 'kind'
  ) THEN
    -- Check if there are existing rows
    IF EXISTS (SELECT 1 FROM business_resources LIMIT 1) THEN
      -- If table has data, add column with default first, then update based on resource_type
      ALTER TABLE business_resources ADD COLUMN kind TEXT;
      UPDATE business_resources SET kind = COALESCE(resource_type, 'resource') WHERE kind IS NULL;
      ALTER TABLE business_resources ALTER COLUMN kind SET NOT NULL;
      ALTER TABLE business_resources ALTER COLUMN kind SET DEFAULT 'resource';
    ELSE
      -- If table is empty, add with NOT NULL and default
      ALTER TABLE business_resources ADD COLUMN kind TEXT NOT NULL DEFAULT 'resource';
    END IF;
    CREATE INDEX IF NOT EXISTS idx_business_resources_kind ON business_resources(kind);
    RAISE NOTICE 'Added kind column to business_resources table';
  ELSE
    -- If column exists but is nullable, make it NOT NULL with default
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'business_resources' 
      AND column_name = 'kind' 
      AND is_nullable = 'YES'
    ) THEN
      UPDATE business_resources SET kind = COALESCE(resource_type, 'resource') WHERE kind IS NULL;
      ALTER TABLE business_resources ALTER COLUMN kind SET NOT NULL;
      ALTER TABLE business_resources ALTER COLUMN kind SET DEFAULT 'resource';
    END IF;
    RAISE NOTICE 'kind column already exists';
  END IF;
END $$;

-- Add other columns if they don't exist
DO $$
BEGIN
  -- Add is_active if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_resources' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE business_resources ADD COLUMN is_active BOOLEAN DEFAULT true;
    CREATE INDEX IF NOT EXISTS idx_business_resources_is_active ON business_resources(is_active);
  END IF;

  -- Add base_price if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_resources' AND column_name = 'base_price'
  ) THEN
    ALTER TABLE business_resources ADD COLUMN base_price NUMERIC(10, 2);
  END IF;

  -- Add image_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_resources' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE business_resources ADD COLUMN image_url TEXT;
  END IF;

  -- Add attributes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_resources' AND column_name = 'attributes'
  ) THEN
    ALTER TABLE business_resources ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_business_resources_attributes ON business_resources USING GIN (attributes);
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_resources' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE business_resources ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_resources_business_id ON business_resources(business_id);
CREATE INDEX IF NOT EXISTS idx_business_resources_resource_type ON business_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_business_resources_is_active ON business_resources(is_active);

-- =====================================================
-- DONE!
-- =====================================================
-- After running this script, the resource_type column will be available
-- Refresh the Supabase schema cache if needed
-- =====================================================

