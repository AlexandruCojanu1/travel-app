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
-- all feed-related tables
-- Note: Sample data should be added through the application
-- or via separate seeding scripts for Romanian cities only
-- =====================================================
