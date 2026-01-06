-- =====================================================
-- DATABASE FIXES FOR REPORTED ERRORS
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- 1. Create saved_businesses table if it doesn't exist
-- This addresses the 400 errors seen in the logs
CREATE TABLE IF NOT EXISTS saved_businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_businesses_user_id ON saved_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_businesses_business_id ON saved_businesses(business_id);

-- Enable RLS for saved_businesses
ALTER TABLE saved_businesses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'saved_businesses' AND policyname = 'Users can manage their saved businesses'
    ) THEN
        CREATE POLICY "Users can manage their saved businesses"
          ON saved_businesses FOR ALL
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'ro',
  currency TEXT DEFAULT 'RON',
  notification_enabled BOOLEAN DEFAULT true,
  travel_style TEXT,
  budget_split_hotel INTEGER DEFAULT 40,
  budget_split_food INTEGER DEFAULT 30,
  budget_split_activities INTEGER DEFAULT 30,
  activity_prefs TEXT[],
  food_prefs TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can manage their own preferences'
    ) THEN
        CREATE POLICY "Users can manage their own preferences"
          ON user_preferences FOR ALL
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. Ensure trips table has the expected structure
-- The application expects start_date, end_date, budget_total, etc.
DO $$
BEGIN
    -- Ensure trips exists (though it likely does as it's a core table)
    CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        city_id UUID, -- References cities table
        destination_city_id UUID, -- References cities table
        title TEXT,
        start_date DATE,
        end_date DATE,
        budget_total DECIMAL(10, 2) DEFAULT 0,
        status TEXT DEFAULT 'planning',
        cover_image TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add missing columns if any
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'title') THEN
        ALTER TABLE trips ADD COLUMN title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'budget_total') THEN
        ALTER TABLE trips ADD COLUMN budget_total DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'destination_city_id') THEN
        ALTER TABLE trips ADD COLUMN destination_city_id UUID;
    END IF;

    -- Fix status enum issue by converting to TEXT if it's an enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'status' AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE trips ALTER COLUMN status TYPE TEXT USING status::TEXT;
        ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'planning';
    END IF;
END $$;

-- Enable RLS for trips if not already enabled
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'trips' AND policyname = 'Users can manage their own trips'
    ) THEN
        CREATE POLICY "Users can manage their own trips"
          ON trips FOR ALL
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Create trip_items table for activity persistence
CREATE TABLE IF NOT EXISTS trip_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  business_name TEXT,
  business_category TEXT,
  estimated_cost DECIMAL(10, 2) DEFAULT 0,
  day_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_items_trip_id ON trip_items(trip_id);

-- Enable RLS for trip_items
ALTER TABLE trip_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'trip_items' AND policyname = 'Users can manage their own trip items'
    ) THEN
        CREATE POLICY "Users can manage their own trip items"
          ON trip_items FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM trips
              WHERE trips.id = trip_items.trip_id
              AND trips.user_id = auth.uid()
            )
          );
    END IF;
END $$;
