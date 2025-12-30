-- =====================================================
-- FIX: RLS Policies for bookings and business_resources
-- Run this script in Supabase SQL Editor to fix 400 errors
-- =====================================================

-- =====================================================
-- BOOKINGS RLS POLICIES
-- =====================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Business owners can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Business owners can update bookings" ON bookings;

CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Business owners can view their bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
-- BUSINESS RESOURCES RLS POLICIES
-- =====================================================

ALTER TABLE business_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active resources" ON business_resources;
DROP POLICY IF EXISTS "Business owners can view all their resources" ON business_resources;
DROP POLICY IF EXISTS "Business owners can manage resources" ON business_resources;

CREATE POLICY "Anyone can view active resources"
  ON business_resources FOR SELECT
  USING (is_active = true);

CREATE POLICY "Business owners can view all their resources"
  ON business_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_resources.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

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

-- =====================================================
-- DONE!
-- =====================================================
-- After running this script, refresh the dashboard page
-- The 400 errors should be resolved
-- =====================================================

