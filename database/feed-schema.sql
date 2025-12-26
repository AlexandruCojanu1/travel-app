-- =====================================================
-- FEED TABLES SCHEMA
-- Tables: city_posts, businesses, promotions
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: businesses
-- Stores places, hotels, restaurants, activities
-- =====================================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_city_id ON businesses(city_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON businesses(is_verified);

-- =====================================================
-- TABLE: city_posts
-- Stores news, events, blog posts about cities
-- =====================================================
CREATE TABLE IF NOT EXISTS city_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  category TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for city_posts
CREATE INDEX IF NOT EXISTS idx_city_posts_city_id ON city_posts(city_id);
CREATE INDEX IF NOT EXISTS idx_city_posts_author_id ON city_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_city_posts_published ON city_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_city_posts_created_at ON city_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_posts_category ON city_posts(category);

-- =====================================================
-- TABLE: promotions
-- Stores active promotions/deals for businesses
-- =====================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

-- Indexes for promotions
CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_valid_dates ON promotions(valid_from, valid_until);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Businesses: Public read for all active businesses
CREATE POLICY "Anyone can view businesses"
  ON businesses FOR SELECT
  USING (true);

CREATE POLICY "Verified users can insert businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Business owners can update their businesses"
  ON businesses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- City Posts: Public read for published posts
CREATE POLICY "Anyone can view published posts"
  ON city_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can create posts"
  ON city_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON city_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
  ON city_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Promotions: Public read for active promotions
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND valid_until);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- First, get city IDs (assuming cities exist from previous setup)
DO $$
DECLARE
  new_york_id UUID;
  los_angeles_id UUID;
  london_id UUID;
  paris_id UUID;
  tokyo_id UUID;
  sample_user_id UUID;
BEGIN
  -- Get city IDs
  SELECT id INTO new_york_id FROM cities WHERE name = 'New York' LIMIT 1;
  SELECT id INTO los_angeles_id FROM cities WHERE name = 'Los Angeles' LIMIT 1;
  SELECT id INTO london_id FROM cities WHERE name = 'London' LIMIT 1;
  SELECT id INTO paris_id FROM cities WHERE name = 'Paris' LIMIT 1;
  SELECT id INTO tokyo_id FROM cities WHERE name = 'Tokyo' LIMIT 1;

  -- Get or create a sample user for posts
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NULL THEN
    -- If no users exist, we'll skip creating posts
    RAISE NOTICE 'No users found. Skipping post creation.';
  ELSE
    -- Insert sample businesses for New York
    IF new_york_id IS NOT NULL THEN
      INSERT INTO businesses (city_id, name, description, category, address, rating, is_verified, image_url) VALUES
      (new_york_id, 'The Plaza Hotel', 'Iconic luxury hotel in the heart of Manhattan with timeless elegance', 'Hotels', '768 5th Ave, New York, NY 10019', 4.7, true, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'),
      (new_york_id, 'Central Park', 'Urban park offering walking paths, sports facilities, and cultural attractions', 'Nature', 'Central Park, New York, NY', 4.9, true, 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800'),
      (new_york_id, 'Katz''s Delicatessen', 'Famous NYC deli serving pastrami sandwiches since 1888', 'Food', '205 E Houston St, New York, NY', 4.5, true, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'),
      (new_york_id, 'MoMA', 'World-renowned modern art museum', 'Activities', '11 W 53rd St, New York, NY', 4.8, true, 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800'),
      (new_york_id, 'Brooklyn Bridge Park', 'Waterfront park with stunning Manhattan views', 'Nature', 'Brooklyn Bridge Park, Brooklyn, NY', 4.6, false, 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800');

      -- Insert sample city posts for New York
      INSERT INTO city_posts (city_id, author_id, title, content, excerpt, category, image_url) VALUES
      (new_york_id, sample_user_id, 'Summer Street Festivals Return to NYC', 'New York City''s beloved street festivals are back this summer! Experience food, music, and culture from around the world right in your neighborhood.', 'Street festivals return with food, music, and culture', 'Activities', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'),
      (new_york_id, sample_user_id, 'New Restaurant Week Deals', 'Restaurant Week kicks off next Monday with exclusive prix-fixe menus at over 500 restaurants citywide. Don''t miss this chance to try NYC''s best dining spots.', 'Restaurant Week features 500+ dining deals', 'Food', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'),
      (new_york_id, sample_user_id, 'Free Concert Series in Central Park', 'Central Park announces its free summer concert series featuring local and international artists every weekend through August.', 'Free concerts every weekend this summer', 'Activities', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800');
    END IF;

    -- Insert sample businesses for Los Angeles
    IF los_angeles_id IS NOT NULL THEN
      INSERT INTO businesses (city_id, name, description, category, address, rating, is_verified, image_url) VALUES
      (los_angeles_id, 'Griffith Observatory', 'Iconic hilltop observatory with planetarium and city views', 'Activities', '2800 E Observatory Rd, Los Angeles, CA', 4.8, true, 'https://images.unsplash.com/photo-1542223189-67a03fa0f0bd?w=800'),
      (los_angeles_id, 'Santa Monica Pier', 'Historic pier with amusement park and ocean views', 'Activities', '200 Santa Monica Pier, Santa Monica, CA', 4.5, true, 'https://images.unsplash.com/photo-1533619043865-1c2e2fbbda8b?w=800'),
      (los_angeles_id, 'The Beverly Hills Hotel', 'Legendary pink palace hotel in Beverly Hills', 'Hotels', '9641 Sunset Blvd, Beverly Hills, CA', 4.6, true, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800');

      -- Insert city posts for LA
      INSERT INTO city_posts (city_id, author_id, title, content, excerpt, category, image_url) VALUES
      (los_angeles_id, sample_user_id, 'Beach Clean-Up Day This Weekend', 'Join hundreds of volunteers for our monthly beach clean-up at Santa Monica Beach. Make a difference while enjoying the ocean breeze!', 'Monthly beach clean-up at Santa Monica', 'Nature', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800');
    END IF;

    -- Insert sample businesses for London
    IF london_id IS NOT NULL THEN
      INSERT INTO businesses (city_id, name, description, category, address, rating, is_verified, image_url) VALUES
      (london_id, 'The Shard', 'Iconic skyscraper with observation deck and restaurants', 'Activities', '32 London Bridge St, London', 4.7, true, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800'),
      (london_id, 'Borough Market', 'Historic food market with artisan producers', 'Food', '8 Southwark St, London', 4.6, true, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800');

      -- Insert city posts for London
      INSERT INTO city_posts (city_id, author_id, title, content, excerpt, category, image_url) VALUES
      (london_id, sample_user_id, 'New Exhibition at the British Museum', 'The British Museum unveils a stunning new exhibition exploring ancient civilizations. Free entry for all visitors!', 'Free exhibition at British Museum', 'Activities', 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800');
    END IF;

    -- Insert sample promotions
    IF new_york_id IS NOT NULL THEN
      -- Get business IDs for promotions
      DECLARE
        plaza_hotel_id UUID;
        katz_deli_id UUID;
      BEGIN
        SELECT id INTO plaza_hotel_id FROM businesses WHERE name = 'The Plaza Hotel' LIMIT 1;
        SELECT id INTO katz_deli_id FROM businesses WHERE name = 'Katz''s Delicatessen' LIMIT 1;

        IF plaza_hotel_id IS NOT NULL THEN
          INSERT INTO promotions (business_id, title, description, discount_percentage, valid_from, valid_until) VALUES
          (plaza_hotel_id, 'Summer Stay Special', 'Book 3 nights and get 20% off your entire stay', 20, NOW(), NOW() + INTERVAL '30 days');
        END IF;

        IF katz_deli_id IS NOT NULL THEN
          INSERT INTO promotions (business_id, title, description, discount_percentage, valid_from, valid_until) VALUES
          (katz_deli_id, 'Lunch Special', 'Get 15% off any sandwich between 11 AM - 2 PM', 15, NOW(), NOW() + INTERVAL '60 days');
        END IF;
      END;
    END IF;
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
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
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_city_posts_updated_at
  BEFORE UPDATE ON city_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETE!
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create
-- all feed-related tables with sample data
-- =====================================================


-- FEED TABLES SCHEMA
-- Tables: city_posts, businesses, promotions
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: businesses
-- Stores places, hotels, restaurants, activities
-- =====================================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_city_id ON businesses(city_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON businesses(is_verified);

-- =====================================================
-- TABLE: city_posts
-- Stores news, events, blog posts about cities
-- =====================================================
CREATE TABLE IF NOT EXISTS city_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  category TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for city_posts
CREATE INDEX IF NOT EXISTS idx_city_posts_city_id ON city_posts(city_id);
CREATE INDEX IF NOT EXISTS idx_city_posts_author_id ON city_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_city_posts_published ON city_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_city_posts_created_at ON city_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_posts_category ON city_posts(category);

-- =====================================================
-- TABLE: promotions
-- Stores active promotions/deals for businesses
-- =====================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

-- Indexes for promotions
CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_valid_dates ON promotions(valid_from, valid_until);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Businesses: Public read for all active businesses
CREATE POLICY "Anyone can view businesses"
  ON businesses FOR SELECT
  USING (true);

CREATE POLICY "Verified users can insert businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Business owners can update their businesses"
  ON businesses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- City Posts: Public read for published posts
CREATE POLICY "Anyone can view published posts"
  ON city_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can create posts"
  ON city_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON city_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
  ON city_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Promotions: Public read for active promotions
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND valid_until);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- First, get city IDs (assuming cities exist from previous setup)
DO $$
DECLARE
  new_york_id UUID;
  los_angeles_id UUID;
  london_id UUID;
  paris_id UUID;
  tokyo_id UUID;
  sample_user_id UUID;
BEGIN
  -- Get city IDs
  SELECT id INTO new_york_id FROM cities WHERE name = 'New York' LIMIT 1;
  SELECT id INTO los_angeles_id FROM cities WHERE name = 'Los Angeles' LIMIT 1;
  SELECT id INTO london_id FROM cities WHERE name = 'London' LIMIT 1;
  SELECT id INTO paris_id FROM cities WHERE name = 'Paris' LIMIT 1;
  SELECT id INTO tokyo_id FROM cities WHERE name = 'Tokyo' LIMIT 1;

  -- Get or create a sample user for posts
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NULL THEN
    -- If no users exist, we'll skip creating posts
    RAISE NOTICE 'No users found. Skipping post creation.';
  ELSE
    -- Insert sample businesses for New York
    IF new_york_id IS NOT NULL THEN
      INSERT INTO businesses (city_id, name, description, category, address, rating, is_verified, image_url) VALUES
      (new_york_id, 'The Plaza Hotel', 'Iconic luxury hotel in the heart of Manhattan with timeless elegance', 'Hotels', '768 5th Ave, New York, NY 10019', 4.7, true, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'),
      (new_york_id, 'Central Park', 'Urban park offering walking paths, sports facilities, and cultural attractions', 'Nature', 'Central Park, New York, NY', 4.9, true, 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800'),
      (new_york_id, 'Katz''s Delicatessen', 'Famous NYC deli serving pastrami sandwiches since 1888', 'Food', '205 E Houston St, New York, NY', 4.5, true, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'),
      (new_york_id, 'MoMA', 'World-renowned modern art museum', 'Activities', '11 W 53rd St, New York, NY', 4.8, true, 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800'),
      (new_york_id, 'Brooklyn Bridge Park', 'Waterfront park with stunning Manhattan views', 'Nature', 'Brooklyn Bridge Park, Brooklyn, NY', 4.6, false, 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800');

      -- Insert sample city posts for New York
      INSERT INTO city_posts (city_id, author_id, title, content, excerpt, category, image_url) VALUES
      (new_york_id, sample_user_id, 'Summer Street Festivals Return to NYC', 'New York City''s beloved street festivals are back this summer! Experience food, music, and culture from around the world right in your neighborhood.', 'Street festivals return with food, music, and culture', 'Activities', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'),
      (new_york_id, sample_user_id, 'New Restaurant Week Deals', 'Restaurant Week kicks off next Monday with exclusive prix-fixe menus at over 500 restaurants citywide. Don''t miss this chance to try NYC''s best dining spots.', 'Restaurant Week features 500+ dining deals', 'Food', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'),
      (new_york_id, sample_user_id, 'Free Concert Series in Central Park', 'Central Park announces its free summer concert series featuring local and international artists every weekend through August.', 'Free concerts every weekend this summer', 'Activities', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800');
    END IF;

    -- Insert sample businesses for Los Angeles
    IF los_angeles_id IS NOT NULL THEN
      INSERT INTO businesses (city_id, name, description, category, address, rating, is_verified, image_url) VALUES
      (los_angeles_id, 'Griffith Observatory', 'Iconic hilltop observatory with planetarium and city views', 'Activities', '2800 E Observatory Rd, Los Angeles, CA', 4.8, true, 'https://images.unsplash.com/photo-1542223189-67a03fa0f0bd?w=800'),
      (los_angeles_id, 'Santa Monica Pier', 'Historic pier with amusement park and ocean views', 'Activities', '200 Santa Monica Pier, Santa Monica, CA', 4.5, true, 'https://images.unsplash.com/photo-1533619043865-1c2e2fbbda8b?w=800'),
      (los_angeles_id, 'The Beverly Hills Hotel', 'Legendary pink palace hotel in Beverly Hills', 'Hotels', '9641 Sunset Blvd, Beverly Hills, CA', 4.6, true, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800');

      -- Insert city posts for LA
      INSERT INTO city_posts (city_id, author_id, title, content, excerpt, category, image_url) VALUES
      (los_angeles_id, sample_user_id, 'Beach Clean-Up Day This Weekend', 'Join hundreds of volunteers for our monthly beach clean-up at Santa Monica Beach. Make a difference while enjoying the ocean breeze!', 'Monthly beach clean-up at Santa Monica', 'Nature', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800');
    END IF;

    -- Insert sample businesses for London
    IF london_id IS NOT NULL THEN
      INSERT INTO businesses (city_id, name, description, category, address, rating, is_verified, image_url) VALUES
      (london_id, 'The Shard', 'Iconic skyscraper with observation deck and restaurants', 'Activities', '32 London Bridge St, London', 4.7, true, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800'),
      (london_id, 'Borough Market', 'Historic food market with artisan producers', 'Food', '8 Southwark St, London', 4.6, true, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800');

      -- Insert city posts for London
      INSERT INTO city_posts (city_id, author_id, title, content, excerpt, category, image_url) VALUES
      (london_id, sample_user_id, 'New Exhibition at the British Museum', 'The British Museum unveils a stunning new exhibition exploring ancient civilizations. Free entry for all visitors!', 'Free exhibition at British Museum', 'Activities', 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800');
    END IF;

    -- Insert sample promotions
    IF new_york_id IS NOT NULL THEN
      -- Get business IDs for promotions
      DECLARE
        plaza_hotel_id UUID;
        katz_deli_id UUID;
      BEGIN
        SELECT id INTO plaza_hotel_id FROM businesses WHERE name = 'The Plaza Hotel' LIMIT 1;
        SELECT id INTO katz_deli_id FROM businesses WHERE name = 'Katz''s Delicatessen' LIMIT 1;

        IF plaza_hotel_id IS NOT NULL THEN
          INSERT INTO promotions (business_id, title, description, discount_percentage, valid_from, valid_until) VALUES
          (plaza_hotel_id, 'Summer Stay Special', 'Book 3 nights and get 20% off your entire stay', 20, NOW(), NOW() + INTERVAL '30 days');
        END IF;

        IF katz_deli_id IS NOT NULL THEN
          INSERT INTO promotions (business_id, title, description, discount_percentage, valid_from, valid_until) VALUES
          (katz_deli_id, 'Lunch Special', 'Get 15% off any sandwich between 11 AM - 2 PM', 15, NOW(), NOW() + INTERVAL '60 days');
        END IF;
      END;
    END IF;
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
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
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_city_posts_updated_at
  BEFORE UPDATE ON city_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETE!
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create
-- all feed-related tables with sample data
-- =====================================================

