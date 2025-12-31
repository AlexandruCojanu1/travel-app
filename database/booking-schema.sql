-- =====================================================
-- BOOKINGS SCHEMA
-- Complete schema for bookings system with resources and availability
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: business_resources
-- Stores rooms, units, or bookable resources for businesses
-- =====================================================
CREATE TABLE IF NOT EXISTS business_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'room', -- 'room', 'unit', 'table', 'ticket', 'activity'
  type TEXT, -- 'single', 'double', 'suite', etc.
  price_per_night DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_guests INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  attributes JSONB, -- Additional metadata (amenities, size, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_resources_business_id ON business_resources(business_id);
CREATE INDEX IF NOT EXISTS idx_business_resources_active ON business_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_business_resources_kind ON business_resources(kind);

-- =====================================================
-- TABLE: resource_availability
-- Stores daily availability for each resource
-- =====================================================
-- Check if table exists and has 'date' column, if not create/alter it
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'resource_availability') THEN
    CREATE TABLE resource_availability (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      resource_id UUID NOT NULL REFERENCES business_resources(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      units_available INTEGER NOT NULL DEFAULT 1,
      price_override DECIMAL(10, 2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(resource_id, date)
    );
  ELSE
    -- Table exists, check if 'date' column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'resource_availability' 
      AND column_name = 'date'
    ) THEN
      -- Add 'date' column if it doesn't exist
      ALTER TABLE resource_availability ADD COLUMN IF NOT EXISTS date DATE;
      -- Add unique constraint if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'resource_availability_resource_id_date_key'
      ) THEN
        ALTER TABLE resource_availability ADD CONSTRAINT resource_availability_resource_id_date_key 
        UNIQUE (resource_id, date);
      END IF;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_resource_availability_resource_id ON resource_availability(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_availability_date ON resource_availability(date);
CREATE INDEX IF NOT EXISTS idx_resource_availability_resource_date ON resource_availability(resource_id, date);

-- =====================================================
-- TABLE: bookings
-- Main bookings table
-- =====================================================
-- Check if table exists, if not create it, if yes add missing columns
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
    CREATE TABLE bookings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      resource_id UUID NOT NULL REFERENCES business_resources(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      guest_count INTEGER NOT NULL DEFAULT 1,
      total_amount DECIMAL(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'awaiting_payment',
      cancellation_policy_id UUID REFERENCES cancellation_policies(id) ON DELETE SET NULL,
      cancellation_deadline TIMESTAMPTZ,
      refund_amount DECIMAL(10, 2),
      is_gift BOOLEAN DEFAULT false,
      gift_recipient_email TEXT,
      gift_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT valid_date_range CHECK (end_date > start_date),
      CONSTRAINT valid_guest_count CHECK (guest_count > 0 AND guest_count <= 20)
    );
  ELSE
    -- Table exists, add missing columns
    -- Check if columns exist first to avoid errors
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'start_date'
    ) THEN
      ALTER TABLE bookings ADD COLUMN start_date DATE;
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bookings' 
      AND column_name = 'end_date'
    ) THEN
      ALTER TABLE bookings ADD COLUMN end_date DATE;
    END IF;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES business_resources(id) ON DELETE CASCADE;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'awaiting_payment';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy_id UUID REFERENCES cancellation_policies(id) ON DELETE SET NULL;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMPTZ;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gift_recipient_email TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gift_message TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    
    -- Add constraints if they don't exist
    IF NOT EXISTS (
      SELECT FROM pg_constraint WHERE conname = 'valid_date_range'
    ) THEN
      ALTER TABLE bookings ADD CONSTRAINT valid_date_range CHECK (end_date > start_date);
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM pg_constraint WHERE conname = 'valid_guest_count'
    ) THEN
      ALTER TABLE bookings ADD CONSTRAINT valid_guest_count CHECK (guest_count > 0 AND guest_count <= 20);
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_resource_id ON bookings(resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE business_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Business Resources Policies
DROP POLICY IF EXISTS "Anyone can view active resources" ON business_resources;
CREATE POLICY "Anyone can view active resources"
  ON business_resources FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Business owners can view all their resources" ON business_resources;
CREATE POLICY "Business owners can view all their resources"
  ON business_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_resources.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business owners can manage resources" ON business_resources;
CREATE POLICY "Business owners can manage resources"
  ON business_resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_resources.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_resources.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- Resource Availability Policies
DROP POLICY IF EXISTS "Anyone can view availability" ON resource_availability;
CREATE POLICY "Anyone can view availability"
  ON resource_availability FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Business owners can manage availability" ON resource_availability;
CREATE POLICY "Business owners can manage availability"
  ON resource_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_resources
      JOIN businesses ON businesses.id = business_resources.business_id
      WHERE business_resources.id = resource_availability.resource_id
      AND businesses.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_resources
      JOIN businesses ON businesses.id = business_resources.business_id
      WHERE business_resources.id = resource_availability.resource_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- Bookings Policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Business owners can view their bookings" ON bookings;
CREATE POLICY "Business owners can view their bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Business owners can update bookings" ON bookings;
CREATE POLICY "Business owners can update bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_business_resources_updated_at ON business_resources;
CREATE TRIGGER update_business_resources_updated_at
  BEFORE UPDATE ON business_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resource_availability_updated_at ON resource_availability;
CREATE TRIGGER update_resource_availability_updated_at
  BEFORE UPDATE ON resource_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically decrease availability when booking is confirmed
CREATE OR REPLACE FUNCTION decrease_availability_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  current_day DATE;
  booking_end_date DATE;
BEGIN
  -- Check if required columns exist (for safety)
  IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Only process when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    current_day := NEW.start_date;
    booking_end_date := NEW.end_date;
    
    -- Decrease availability for each day in the booking range
    WHILE current_day < booking_end_date LOOP
      -- Use INSERT ... ON CONFLICT with proper column reference
      INSERT INTO resource_availability (resource_id, date, units_available)
      VALUES (NEW.resource_id, current_day, 0)
      ON CONFLICT (resource_id, date) 
      DO UPDATE SET 
        units_available = GREATEST(0, resource_availability.units_available - 1),
        updated_at = NOW();
      
      current_day := current_day + INTERVAL '1 day';
    END LOOP;
  END IF;
  
  -- Restore availability when booking is cancelled
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    current_day := NEW.start_date;
    booking_end_date := NEW.end_date;
    
    -- Increase availability for each day in the booking range
    WHILE current_day < booking_end_date LOOP
      -- Use INSERT ... ON CONFLICT with proper column reference
      INSERT INTO resource_availability (resource_id, date, units_available)
      VALUES (NEW.resource_id, current_day, 1)
      ON CONFLICT (resource_id, date) 
      DO UPDATE SET 
        units_available = resource_availability.units_available + 1,
        updated_at = NOW();
      
      current_day := current_day + INTERVAL '1 day';
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle availability changes
DROP TRIGGER IF EXISTS trigger_decrease_availability_on_booking ON bookings;
CREATE TRIGGER trigger_decrease_availability_on_booking
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION decrease_availability_on_booking();

-- =====================================================
-- COMPLETE!
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create
-- all bookings-related tables, policies, and triggers
-- =====================================================

