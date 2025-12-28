-- =====================================================
-- EXTENDED FEATURES SCHEMA
-- Complete database schema for all new features
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENHANCED REVIEWS SYSTEM
-- =====================================================

-- Extend reviews table with additional fields
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_cleanliness INTEGER CHECK (rating_cleanliness >= 1 AND rating_cleanliness <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_service INTEGER CHECK (rating_service >= 1 AND rating_service <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_location INTEGER CHECK (rating_location >= 1 AND rating_location <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photos TEXT[]; -- Array of photo URLs
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false; -- Verified booking
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_text TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_date TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- Function to update business rating when review is added/updated
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE businesses
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE business_id = NEW.business_id
  )
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_business_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_business_rating();

-- =====================================================
-- 2. NOTIFICATIONS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking_confirmed', 'review_received', 'message', 'trip_shared', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (booking_id, business_id, etc.)
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Email notifications queue
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL, -- 'booking_confirmation', 'review_reminder', etc.
  data JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);

-- =====================================================
-- 3. MESSAGING/CHAT SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'booking', 'support', 'general'
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- =====================================================
-- 4. TRIP SHARING & COLLABORATION
-- =====================================================

-- Trip sharing
CREATE TABLE IF NOT EXISTS trip_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL, -- For public sharing
  access_level TEXT DEFAULT 'view', -- 'view', 'edit'
  is_public BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_shares_trip_id ON trip_shares(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_shares_token ON trip_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_trip_shares_shared_with ON trip_shares(shared_with_user_id);

-- Trip collaboration (who can edit)
CREATE TABLE IF NOT EXISTS trip_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor', -- 'viewer', 'editor'
  added_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_collaborators_trip_id ON trip_collaborators(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user_id ON trip_collaborators(user_id);

-- Trip comments
CREATE TABLE IF NOT EXISTS trip_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID, -- Reference to trip_item if commenting on specific item
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_comments_trip_id ON trip_comments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_user_id ON trip_comments(user_id);

-- Public trip templates
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS template_description TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS template_category TEXT; -- 'romantic', 'adventure', 'family', etc.

-- =====================================================
-- 5. EVENTS CALENDAR
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'festival', 'concert', 'sports', 'cultural', etc.
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  location_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  website_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_event_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_events_city_id ON events(city_id);
CREATE INDEX IF NOT EXISTS idx_events_business_id ON events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);

-- User event bookmarks
CREATE TABLE IF NOT EXISTS event_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_bookmarks_user_id ON event_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_event_id ON event_bookmarks(event_id);

-- Event-trip integration
CREATE TABLE IF NOT EXISTS trip_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  day_index INTEGER, -- Which day of the trip
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id ON trip_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_events_event_id ON trip_events(event_id);

-- =====================================================
-- 6. LOYALTY PROGRAM
-- =====================================================

CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  lifetime_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- Positive for earned, negative for spent
  type TEXT NOT NULL, -- 'booking', 'review', 'referral', 'reward_redemption'
  reference_id UUID, -- booking_id, review_id, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  discount_percentage INTEGER,
  discount_amount DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'used', 'expired'
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. GROUP BOOKINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  group_leader_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT,
  total_guests INTEGER NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_booking_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_booking_id UUID NOT NULL REFERENCES group_bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_owed DECIMAL(10, 2),
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'partial', 'paid'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_booking_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_bookings_booking_id ON group_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_group_bookings_leader ON group_bookings(group_leader_user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_booking ON group_booking_members(group_booking_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_booking_members(user_id);

-- =====================================================
-- 8. SEARCH & DISCOVERY ENHANCEMENTS
-- =====================================================

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
  search_query TEXT,
  filters JSONB, -- Store filter state
  name TEXT, -- User-given name for the search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);

-- Search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
  query TEXT,
  filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- =====================================================
-- 9. ANALYTICS & TRACKING
-- =====================================================

-- Business views tracking
CREATE TABLE IF NOT EXISTS business_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous tracking
  source TEXT, -- 'map', 'search', 'feed', 'direct'
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_views_business_id ON business_views(business_id);
CREATE INDEX IF NOT EXISTS idx_business_views_viewed_at ON business_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_business_views_user_id ON business_views(user_id);

-- Conversion tracking (view -> booking)
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  first_view_at TIMESTAMPTZ,
  booking_created_at TIMESTAMPTZ,
  conversion_time_seconds INTEGER, -- Time from view to booking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversions_business_id ON conversions(business_id);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);

-- Customer demographics (aggregated, privacy-safe)
CREATE TABLE IF NOT EXISTS business_demographics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  age_group_18_25 INTEGER DEFAULT 0,
  age_group_26_35 INTEGER DEFAULT 0,
  age_group_36_45 INTEGER DEFAULT 0,
  age_group_46_55 INTEGER DEFAULT 0,
  age_group_56_plus INTEGER DEFAULT 0,
  gender_distribution JSONB, -- {male: X, female: Y, other: Z}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, date)
);

-- =====================================================
-- 10. TRAVEL GUIDES
-- =====================================================

CREATE TABLE IF NOT EXISTS travel_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- 'food', 'attractions', 'nightlife', 'shopping', etc.
  cover_image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guide_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES travel_guides(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guide_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES travel_guides(id) ON DELETE CASCADE,
  tip_text TEXT NOT NULL,
  category TEXT, -- 'money', 'safety', 'transport', 'culture'
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_travel_guides_city_id ON travel_guides(city_id);
CREATE INDEX IF NOT EXISTS idx_guide_sections_guide_id ON guide_sections(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_tips_guide_id ON guide_tips(guide_id);

-- =====================================================
-- 11. BOOKING ENHANCEMENTS
-- =====================================================

-- Cancellation policies
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);

CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Flexible', 'Moderate', 'Strict'
  free_cancellation_hours INTEGER, -- Hours before check-in for free cancellation
  partial_refund_percentage INTEGER, -- Percentage refunded after deadline
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment plans
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  installments JSONB, -- Array of {amount, due_date, status}
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gift_recipient_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gift_message TEXT;

-- =====================================================
-- 12. BUSINESS PORTAL ENHANCEMENTS
-- =====================================================

-- Staff management
CREATE TABLE IF NOT EXISTS business_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'manager', 'staff', 'viewer'
  permissions JSONB, -- {can_manage_bookings: true, can_view_analytics: false, etc.}
  added_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_staff_business_id ON business_staff(business_id);
CREATE INDEX IF NOT EXISTS idx_business_staff_user_id ON business_staff(user_id);

-- Multi-location support
CREATE TABLE IF NOT EXISTS business_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Main Location', 'Branch 2', etc.
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_locations_business_id ON business_locations(business_id);

-- Bulk operations log
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL, -- 'price_update', 'availability_block', etc.
  affected_count INTEGER,
  details JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- 13. WEATHER INTEGRATION
-- =====================================================

CREATE TABLE IF NOT EXISTS weather_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weather_data JSONB NOT NULL, -- Store full weather API response
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(city_id, date)
);

CREATE INDEX IF NOT EXISTS idx_weather_cache_city_date ON weather_cache(city_id, date);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);

-- Weather alerts
CREATE TABLE IF NOT EXISTS weather_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  alert_date DATE NOT NULL,
  alert_type TEXT NOT NULL, -- 'rain', 'snow', 'extreme_heat', etc.
  severity TEXT DEFAULT 'moderate', -- 'low', 'moderate', 'high'
  message TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_user_id ON weather_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_trip_id ON weather_alerts(trip_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = business_user_id);
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_id = auth.uid() OR conversations.business_user_id = auth.uid())
    )
  );
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_id = auth.uid() OR conversations.business_user_id = auth.uid())
    )
  );

-- Trip sharing
ALTER TABLE trip_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their trip shares"
  ON trip_shares FOR SELECT
  USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id OR is_public = true);
CREATE POLICY "Users can create trip shares"
  ON trip_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by_user_id);

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (true);
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Loyalty
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own loyalty points"
  ON loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

-- Business staff
ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owners can manage staff"
  ON business_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_staff.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- Add more RLS policies as needed for other tables...

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to award loyalty points
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
BEGIN
  -- Award points based on booking amount (1 point per 10 RON)
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    points_to_award := FLOOR(COALESCE(NEW.total_amount, 0) / 10);
    
    INSERT INTO loyalty_transactions (user_id, points, type, reference_id, description)
    VALUES (NEW.user_id, points_to_award, 'booking', NEW.id, 'Points for booking #' || NEW.id);
    
    INSERT INTO loyalty_points (user_id, points, lifetime_points)
    VALUES (NEW.user_id, points_to_award, points_to_award)
    ON CONFLICT (user_id) DO UPDATE
    SET points = loyalty_points.points + points_to_award,
        lifetime_points = loyalty_points.lifetime_points + points_to_award,
        tier = CASE
          WHEN loyalty_points.lifetime_points + points_to_award >= 10000 THEN 'platinum'
          WHEN loyalty_points.lifetime_points + points_to_award >= 5000 THEN 'gold'
          WHEN loyalty_points.lifetime_points + points_to_award >= 2000 THEN 'silver'
          ELSE 'bronze'
        END,
        updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_loyalty_points
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION award_loyalty_points();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track business view
CREATE OR REPLACE FUNCTION track_business_view(
  p_business_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'direct'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO business_views (business_id, user_id, session_id, source)
  VALUES (p_business_id, p_user_id, p_session_id, p_source);
END;
$$ LANGUAGE plpgsql;

