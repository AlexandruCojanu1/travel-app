-- =====================================================
-- EXTEND BUSINESS SCHEMA - Complete Romanian Categories
-- =====================================================

-- First, ensure base columns exist (from add-business-attributes-column.sql)
DO $$
BEGIN
  -- Add attributes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'attributes'
  ) THEN
    ALTER TABLE businesses ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_businesses_attributes ON businesses USING GIN (attributes);
  END IF;

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
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type') THEN
      CREATE TYPE business_type AS ENUM (
        'restaurant', 'cafe', 'hotel', 'spa', 'amusement_park', 
        'shop', 'mall', 'museum', 'event', 'theater', 
        'nature', 'currency_exchange', 'parking', 'laundry', 
        'duty_free', 'hospital', 'pharmacy'
      );
    END IF;
    ALTER TABLE businesses ADD COLUMN type business_type;
    CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(type);
  END IF;

  -- Add lat/lng if they don't exist
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

  -- Add address_line if it doesn't exist
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

-- Add new columns for extended business information
DO $$
BEGIN
  -- Tagline (short description, max 100 chars)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE businesses ADD COLUMN tagline TEXT;
  END IF;

  -- Logo URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE businesses ADD COLUMN logo_url TEXT;
  END IF;

  -- Cover image URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE businesses ADD COLUMN cover_image_url TEXT;
  END IF;

  -- Email public
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'email'
  ) THEN
    ALTER TABLE businesses ADD COLUMN email TEXT;
  END IF;

  -- Social media links (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE businesses ADD COLUMN social_media JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Operating hours (JSONB - structured schedule)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'operating_hours'
  ) THEN
    ALTER TABLE businesses ADD COLUMN operating_hours JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- General facilities (JSONB - checklist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'facilities'
  ) THEN
    ALTER TABLE businesses ADD COLUMN facilities JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Services/Prices table structure (stored in JSONB)
  -- This will be in attributes for now, but we can create a separate table later
END $$;

-- Create business_services table for structured pricing
CREATE TABLE IF NOT EXISTS business_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RON',
  duration_minutes INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_services_business_id ON business_services(business_id);
CREATE INDEX IF NOT EXISTS idx_business_services_category ON business_services(category);

-- Create business_gallery table for images
CREATE TABLE IF NOT EXISTS business_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  label TEXT, -- "Intrare", "Meniu", "Interior", "Produs", etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_gallery_business_id ON business_gallery(business_id);
CREATE INDEX IF NOT EXISTS idx_business_gallery_display_order ON business_gallery(display_order);

-- Create business_rooms table for hotels
CREATE TABLE IF NOT EXISTS business_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Deluxe Suite", "Single Room", etc.
  room_type TEXT, -- "single", "double", "suite", "family"
  base_price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RON',
  capacity INTEGER,
  bed_type TEXT,
  amenities JSONB DEFAULT '[]'::jsonb, -- ["WiFi", "Balcony", "Sea View"]
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_rooms_business_id ON business_rooms(business_id);

-- Create business_menu_items table for restaurants/cafes
CREATE TABLE IF NOT EXISTS business_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  section TEXT, -- "Starters", "Mains", "Desserts", "Drinks"
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RON',
  grams INTEGER, -- Weight for food items
  allergens JSONB DEFAULT '[]'::jsonb, -- ["Gluten", "Dairy", "Nuts"]
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_menu_items_business_id ON business_menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_business_menu_items_section ON business_menu_items(section);

-- RLS Policies for new tables
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_menu_items ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their services
CREATE POLICY "Business owners can manage their services"
  ON business_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_services.business_id 
      AND (businesses.owner_user_id = auth.uid() OR businesses.owner_id = auth.uid())
    )
  );

-- Anyone can view services
CREATE POLICY "Anyone can view services"
  ON business_services FOR SELECT
  USING (true);

-- Business owners can manage their gallery
CREATE POLICY "Business owners can manage their gallery"
  ON business_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_gallery.business_id 
      AND (businesses.owner_user_id = auth.uid() OR businesses.owner_id = auth.uid())
    )
  );

-- Anyone can view gallery
CREATE POLICY "Anyone can view gallery"
  ON business_gallery FOR SELECT
  USING (true);

-- Business owners can manage their rooms
CREATE POLICY "Business owners can manage their rooms"
  ON business_rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_rooms.business_id 
      AND (businesses.owner_user_id = auth.uid() OR businesses.owner_id = auth.uid())
    )
  );

-- Anyone can view rooms
CREATE POLICY "Anyone can view rooms"
  ON business_rooms FOR SELECT
  USING (true);

-- Business owners can manage their menu items
CREATE POLICY "Business owners can manage their menu items"
  ON business_menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_menu_items.business_id 
      AND (businesses.owner_user_id = auth.uid() OR businesses.owner_id = auth.uid())
    )
  );

-- Anyone can view menu items
CREATE POLICY "Anyone can view menu items"
  ON business_menu_items FOR SELECT
  USING (true);

