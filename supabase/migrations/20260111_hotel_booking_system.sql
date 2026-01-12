-- Migration: Hotel Booking System
-- Creates tables for hotel rooms, availability, and bookings

-- ============================================
-- 1. HOTEL ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL, -- 'single', 'double', 'twin', 'suite', 'family', 'deluxe'
  name TEXT NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10,2) NOT NULL,
  max_guests INTEGER NOT NULL DEFAULT 2,
  total_rooms INTEGER NOT NULL DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by business
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_business_id ON hotel_rooms(business_id);

-- ============================================
-- 2. ROOM AVAILABILITY TABLE
-- ============================================
CREATE TABLE IFx§ NOT EXISTS room_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_count INTEGER NOT NULL DEFAULT 0,
  price_override DECIMAL(10,2), -- Optional: different price for specific dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, date)
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_room_availability_room_date ON room_availability(room_id, date);

-- ============================================
-- 3. BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  
  -- Booking details
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  rooms_count INTEGER NOT NULL DEFAULT 1,
  
  -- Pricing
  price_per_night DECIMAL(10,2) NOT NULL,
  total_nights INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  taxes DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_option TEXT NOT NULL DEFAULT 'full', -- 'full', 'deposit', 'on_site'
  deposit_amount DECIMAL(10,2),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'refunded'
  payment_intent_id TEXT, -- Stripe payment intent
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
  cancellation_policy TEXT NOT NULL DEFAULT 'flexible', -- 'flexible', 'moderate', 'strict'
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Guest info
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  special_requests TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user_id ON hotel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_business_id ON hotel_bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_room_id ON hotel_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON hotel_bookings(status);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_dates ON hotel_bookings(check_in, check_out);

-- ============================================
-- 4. ADD BOOKING SETTINGS TO BUSINESSES
-- ============================================
-- These fields will be stored in the 'attributes' JSONB column:
-- - payment_options: ['full', 'deposit', 'on_site']
-- - cancellation_policy: 'flexible' | 'moderate' | 'strict'
-- - deposit_percentage: 20 (for deposit option)
-- - min_advance_booking_days: 0
-- - max_advance_booking_days: 365

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;

-- Hotel Rooms: Business owners can manage, anyone can read
CREATE POLICY "Anyone can view active rooms" ON hotel_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can manage rooms" ON hotel_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = hotel_rooms.business_id 
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- Room Availability: Business owners can manage, anyone can read
CREATE POLICY "Anyone can view availability" ON room_availability
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage availability" ON room_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM hotel_rooms 
      JOIN businesses ON businesses.id = hotel_rooms.business_id
      WHERE hotel_rooms.id = room_availability.room_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- Bookings: Users can see their own, business owners can see theirs
CREATE POLICY "Users can view own bookings" ON hotel_bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings" ON hotel_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Business owners can view their bookings" ON hotel_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = hotel_bookings.business_id 
      AND businesses.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update booking status" ON hotel_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = hotel_bookings.business_id 
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to check room availability for a date range
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_rooms_needed INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_available BOOLEAN := true;
  v_date DATE;
  v_available_count INTEGER;
BEGIN
  -- Check each date in the range
  v_date := p_check_in;
  WHILE v_date < p_check_out LOOP
    SELECT COALESCE(available_count, 0) INTO v_available_count
    FROM room_availability
    WHERE room_id = p_room_id AND date = v_date;
    
    IF v_available_count < p_rooms_needed THEN
      v_available := false;
      EXIT;
    END IF;
    
    v_date := v_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_available;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate booking price
CREATE OR REPLACE FUNCTION calculate_booking_price(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_rooms_count INTEGER DEFAULT 1
) RETURNS TABLE(
  nights INTEGER,
  price_per_night DECIMAL,
  subtotal DECIMAL,
  taxes DECIMAL,
  total DECIMAL
) AS $$
DECLARE
  v_nights INTEGER;
  v_base_price DECIMAL;
BEGIN
  -- Calculate nights
  v_nights := p_check_out - p_check_in;
  
  -- Get base price from room
  SELECT hr.price_per_night INTO v_base_price
  FROM hotel_rooms hr
  WHERE hr.id = p_room_id;
  
  -- Calculate totals
  nights := v_nights;
  price_per_night := v_base_price;
  subtotal := v_base_price * v_nights * p_rooms_count;
  taxes := subtotal * 0.09; -- 9% TVA
  total := subtotal + taxes;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================
