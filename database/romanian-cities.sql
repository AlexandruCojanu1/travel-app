-- =====================================================
-- ROMANIAN CITIES SEED DATA
-- Populates the cities table with Romanian cities
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure cities table exists with correct structure
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Romania',
  state_province TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add country column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cities' AND column_name = 'country'
  ) THEN
    ALTER TABLE cities ADD COLUMN country TEXT NOT NULL DEFAULT 'Romania';
  END IF;
  
  -- Add state_province column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cities' AND column_name = 'state_province'
  ) THEN
    ALTER TABLE cities ADD COLUMN state_province TEXT;
  END IF;
  
  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cities' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE cities ADD COLUMN latitude DECIMAL(10, 8);
  END IF;
  
  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cities' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE cities ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
  
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cities' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE cities ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cities' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE cities ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create unique index on name if it doesn't exist (for ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cities_name_unique ON cities(name);

-- Insert Romanian cities
-- Note: Using INSERT with ON CONFLICT to avoid duplicates
-- If city already exists (by name), it will be skipped
INSERT INTO cities (name, country, state_province, latitude, longitude, is_active, created_at)
VALUES
  -- Major Cities
  ('Bucharest', 'Romania', 'București', 44.4268, 26.1025, true, NOW()),
  ('Cluj-Napoca', 'Romania', 'Cluj', 46.7712, 23.6236, true, NOW()),
  ('Timișoara', 'Romania', 'Timiș', 45.7489, 21.2087, true, NOW()),
  ('Iași', 'Romania', 'Iași', 47.1585, 27.6014, true, NOW()),
  ('Constanța', 'Romania', 'Constanța', 44.1598, 28.6348, true, NOW()),
  ('Craiova', 'Romania', 'Dolj', 44.3302, 23.7949, true, NOW()),
  ('Brașov', 'Romania', 'Brașov', 45.6427, 25.5887, true, NOW()),
  ('Galați', 'Romania', 'Galați', 45.4353, 28.0080, true, NOW()),
  ('Ploiești', 'Romania', 'Prahova', 44.9469, 26.0365, true, NOW()),
  ('Oradea', 'Romania', 'Bihor', 47.0465, 21.9190, true, NOW()),
  
  -- Transylvania Region
  ('Sibiu', 'Romania', 'Sibiu', 45.8035, 24.1460, true, NOW()),
  ('Târgu Mureș', 'Romania', 'Mureș', 46.5448, 24.5519, true, NOW()),
  ('Baia Mare', 'Romania', 'Maramureș', 47.6567, 23.5700, true, NOW()),
  ('Satu Mare', 'Romania', 'Satu Mare', 47.8017, 22.8575, true, NOW()),
  ('Bistrița', 'Romania', 'Bistrița-Năsăud', 47.1333, 24.4833, true, NOW()),
  ('Alba Iulia', 'Romania', 'Alba', 46.0667, 23.5833, true, NOW()),
  
  -- Moldavia Region
  ('Bacău', 'Romania', 'Bacău', 46.5679, 26.9145, true, NOW()),
  ('Piatra Neamț', 'Romania', 'Neamț', 46.9275, 26.3708, true, NOW()),
  ('Suceava', 'Romania', 'Suceava', 47.6516, 26.2556, true, NOW()),
  ('Botoșani', 'Romania', 'Botoșani', 47.7489, 26.6694, true, NOW()),
  
  -- Wallachia Region
  ('Pitești', 'Romania', 'Argeș', 44.8568, 24.8692, true, NOW()),
  ('Râmnicu Vâlcea', 'Romania', 'Vâlcea', 45.1000, 24.3667, true, NOW()),
  ('Drobeta-Turnu Severin', 'Romania', 'Mehedinți', 44.6319, 22.6561, true, NOW()),
  ('Târgoviște', 'Romania', 'Dâmbovița', 44.9258, 25.4567, true, NOW()),
  
  -- Dobrogea Region
  ('Tulcea', 'Romania', 'Tulcea', 45.1787, 28.8064, true, NOW()),
  ('Mangalia', 'Romania', 'Constanța', 43.8178, 28.5828, true, NOW()),
  
  -- Banat Region
  ('Arad', 'Romania', 'Arad', 46.1866, 21.3123, true, NOW()),
  ('Reșița', 'Romania', 'Caraș-Severin', 45.3000, 21.9000, true, NOW()),
  
  -- Popular Tourist Destinations
  ('Sighișoara', 'Romania', 'Mureș', 46.2200, 24.7900, true, NOW()),
  ('Sinaia', 'Romania', 'Prahova', 45.3500, 25.5500, true, NOW()),
  ('Predeal', 'Romania', 'Brașov', 45.5000, 25.5667, true, NOW()),
  ('Poiana Brașov', 'Romania', 'Brașov', 45.6000, 25.5833, true, NOW()),
  ('Mamaia', 'Romania', 'Constanța', 44.2500, 28.6333, true, NOW())
ON CONFLICT (name) DO NOTHING;

-- Update RLS policies to allow public read access to cities
-- This is important so users can see cities without authentication
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON cities;
DROP POLICY IF EXISTS "Public can view active cities" ON cities;

-- Create policy to allow public read access to active cities
CREATE POLICY "Public can view active cities"
  ON cities FOR SELECT
  USING (is_active = true);

-- Create policy to allow authenticated users to view all cities (for admin purposes)
CREATE POLICY "Authenticated users can view all cities"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

