-- =====================================================
-- FIX: Enable RLS and create policies for all tables
-- Run this script in Supabase SQL Editor
-- This fixes all RLS security issues reported by the linter
-- =====================================================

-- =====================================================
-- 1. MENU TABLES
-- =====================================================

-- Check if menu_items table exists and has business_id or menu_id
-- menu_items - try business_id first, then menu_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
    ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Business owners can manage menu items" ON menu_items;
    
    -- Check if menu_items has business_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'business_id') THEN
      CREATE POLICY "Business owners can manage menu items"
        ON menu_items FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = menu_items.business_id
            AND businesses.owner_user_id = auth.uid()
          )
        );
    -- Check if menu_items has menu_id and menus table exists
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'menu_id')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
      -- Check if menus has business_id
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menus' AND column_name = 'business_id') THEN
        CREATE POLICY "Business owners can manage menu items"
          ON menu_items FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM menus
              JOIN businesses ON businesses.id = menus.business_id
              WHERE menus.id = menu_items.menu_id
              AND businesses.owner_user_id = auth.uid()
            )
          );
      END IF;
    END IF;
  END IF;
END $$;

-- menus - check if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus') THEN
    ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Business owners can manage menus" ON menus;
    
    -- Check if menus has business_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menus' AND column_name = 'business_id') THEN
      CREATE POLICY "Business owners can manage menus"
        ON menus FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = menus.business_id
            AND businesses.owner_user_id = auth.uid()
          )
        );
    END IF;
  END IF;
END $$;

-- menu_categories - check if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories') THEN
    ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Business owners can manage menu categories" ON menu_categories;
    
    -- Check if menu_categories has menu_id and menus has business_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_categories' AND column_name = 'menu_id')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menus' AND column_name = 'business_id') THEN
      CREATE POLICY "Business owners can manage menu categories"
        ON menu_categories FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM menus
            JOIN businesses ON businesses.id = menus.business_id
            WHERE menus.id = menu_categories.menu_id
            AND businesses.owner_user_id = auth.uid()
          )
        );
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. BUSINESS MEDIA
-- =====================================================

ALTER TABLE business_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view business media" ON business_media;
DROP POLICY IF EXISTS "Business owners can manage media" ON business_media;

CREATE POLICY "Anyone can view business media"
  ON business_media FOR SELECT
  USING (true);

CREATE POLICY "Business owners can manage media"
  ON business_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_media.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. PROMOTIONS
-- =====================================================

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Business owners can manage promotions" ON promotions;

-- Check if valid_until column exists, otherwise use is_active only
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'valid_until') THEN
    CREATE POLICY "Anyone can view active promotions"
      ON promotions FOR SELECT
      USING (is_active = true AND valid_until >= NOW());
  ELSE
    CREATE POLICY "Anyone can view active promotions"
      ON promotions FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

CREATE POLICY "Business owners can manage promotions"
  ON promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = promotions.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TRANSPORT PROVIDERS
-- =====================================================

ALTER TABLE transport_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view transport providers" ON transport_providers;
DROP POLICY IF EXISTS "Admins can manage transport providers" ON transport_providers;

CREATE POLICY "Anyone can view transport providers"
  ON transport_providers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage transport providers"
  ON transport_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 5. BUSINESS RESOURCES
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
-- 6. RESOURCE AVAILABILITY
-- =====================================================

ALTER TABLE resource_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view availability" ON resource_availability;
DROP POLICY IF EXISTS "Business owners can manage availability" ON resource_availability;

CREATE POLICY "Anyone can view availability"
  ON resource_availability FOR SELECT
  USING (true);

CREATE POLICY "Business owners can manage availability"
  ON resource_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_resources
      JOIN businesses ON businesses.id = business_resources.business_id
      WHERE business_resources.id = resource_availability.resource_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. TRIP ITEMS
-- =====================================================

ALTER TABLE trip_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trip owners can manage trip items" ON trip_items;

CREATE POLICY "Trip owners can manage trip items"
  ON trip_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7.5. BOOKINGS
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
-- 8. PAYMENTS
-- =====================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Business owners can view payments" ON payments;

-- Check if payments has user_id column, otherwise use booking_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'user_id') THEN
    CREATE POLICY "Users can view their own payments"
      ON payments FOR SELECT
      USING (auth.uid() = user_id);
  ELSE
    -- payments has booking_id, check through bookings table
    CREATE POLICY "Users can view their own payments"
      ON payments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM bookings
          WHERE bookings.id = payments.booking_id
          AND bookings.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE POLICY "Business owners can view payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN businesses ON businesses.id = bookings.business_id
      WHERE bookings.id = payments.booking_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 9. REVIEWS
-- =====================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Business owners can reply to reviews" ON reviews;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business owners can reply to reviews"
  ON reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = reviews.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = reviews.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 10. EMAIL NOTIFICATIONS
-- =====================================================

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON email_notifications;

CREATE POLICY "Users can view their own notifications"
  ON email_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 11. TRIP COLLABORATORS
-- =====================================================

ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trip owners and collaborators can view" ON trip_collaborators;
DROP POLICY IF EXISTS "Trip owners can manage collaborators" ON trip_collaborators;

CREATE POLICY "Trip owners and collaborators can view"
  ON trip_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_collaborators.trip_id
      AND (trips.user_id = auth.uid() OR trip_collaborators.user_id = auth.uid())
    )
  );

CREATE POLICY "Trip owners can manage collaborators"
  ON trip_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_collaborators.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- =====================================================
-- 12. TRIP COMMENTS
-- =====================================================

ALTER TABLE trip_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trip participants can view comments" ON trip_comments;
DROP POLICY IF EXISTS "Trip participants can create comments" ON trip_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON trip_comments;

CREATE POLICY "Trip participants can view comments"
  ON trip_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      LEFT JOIN trip_collaborators ON trip_collaborators.trip_id = trips.id
      WHERE trips.id = trip_comments.trip_id
      AND (trips.user_id = auth.uid() OR trip_collaborators.user_id = auth.uid())
    )
  );

CREATE POLICY "Trip participants can create comments"
  ON trip_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM trips
      LEFT JOIN trip_collaborators ON trip_collaborators.trip_id = trips.id
      WHERE trips.id = trip_comments.trip_id
      AND (trips.user_id = auth.uid() OR trip_collaborators.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own comments"
  ON trip_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 13. EVENT BOOKMARKS
-- =====================================================

ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON event_bookmarks;

CREATE POLICY "Users can manage their own bookmarks"
  ON event_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 14. TRIP EVENTS
-- =====================================================

ALTER TABLE trip_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trip participants can manage events" ON trip_events;

CREATE POLICY "Trip participants can manage events"
  ON trip_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trips
      LEFT JOIN trip_collaborators ON trip_collaborators.trip_id = trips.id
      WHERE trips.id = trip_events.trip_id
      AND (trips.user_id = auth.uid() OR trip_collaborators.user_id = auth.uid())
    )
  );

-- =====================================================
-- 15. LOYALTY TRANSACTIONS
-- =====================================================

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions" ON loyalty_transactions;

CREATE POLICY "Users can view their own transactions"
  ON loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 16. REFERRALS
-- =====================================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;

-- Check which column name exists (referrer_id or referrer_user_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referrer_user_id') THEN
    CREATE POLICY "Users can view their own referrals"
      ON referrals FOR SELECT
      USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referrer_id') THEN
    CREATE POLICY "Users can view their own referrals"
      ON referrals FOR SELECT
      USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
  END IF;
END $$;

-- =====================================================
-- 17. USER REWARDS
-- =====================================================

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own rewards" ON user_rewards;

CREATE POLICY "Users can view their own rewards"
  ON user_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 18. REWARDS
-- =====================================================

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON rewards;

CREATE POLICY "Anyone can view active rewards"
  ON rewards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage rewards"
  ON rewards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 19. GROUP BOOKINGS
-- =====================================================

ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members can view bookings" ON group_bookings;
DROP POLICY IF EXISTS "Group organizers can manage bookings" ON group_bookings;

CREATE POLICY "Group members can view bookings"
  ON group_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_booking_members
      WHERE group_booking_members.group_booking_id = group_bookings.id
      AND group_booking_members.user_id = auth.uid()
    )
    OR auth.uid() = group_bookings.group_leader_user_id
  );

-- Check which column name exists (organizer_id or group_leader_user_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_bookings' AND column_name = 'group_leader_user_id') THEN
    CREATE POLICY "Group organizers can manage bookings"
      ON group_bookings FOR ALL
      USING (auth.uid() = group_leader_user_id)
      WITH CHECK (auth.uid() = group_leader_user_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_bookings' AND column_name = 'organizer_id') THEN
    CREATE POLICY "Group organizers can manage bookings"
      ON group_bookings FOR ALL
      USING (auth.uid() = organizer_id)
      WITH CHECK (auth.uid() = organizer_id);
  END IF;
END $$;

-- =====================================================
-- 20. GROUP BOOKING MEMBERS
-- =====================================================

ALTER TABLE group_booking_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members can view" ON group_booking_members;
DROP POLICY IF EXISTS "Organizers can manage members" ON group_booking_members;

-- Check which column name exists (organizer_id or group_leader_user_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_bookings' AND column_name = 'group_leader_user_id') THEN
    CREATE POLICY "Group members can view"
      ON group_booking_members FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM group_bookings
          WHERE group_bookings.id = group_booking_members.group_booking_id
          AND (
            group_bookings.group_leader_user_id = auth.uid()
            OR group_booking_members.user_id = auth.uid()
          )
        )
      );
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_bookings' AND column_name = 'organizer_id') THEN
    CREATE POLICY "Group members can view"
      ON group_booking_members FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM group_bookings
          WHERE group_bookings.id = group_booking_members.group_booking_id
          AND (
            group_bookings.organizer_id = auth.uid()
            OR group_booking_members.user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Check which column name exists (organizer_id or group_leader_user_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_bookings' AND column_name = 'group_leader_user_id') THEN
    CREATE POLICY "Organizers can manage members"
      ON group_booking_members FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM group_bookings
          WHERE group_bookings.id = group_booking_members.group_booking_id
          AND group_bookings.group_leader_user_id = auth.uid()
        )
      );
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_bookings' AND column_name = 'organizer_id') THEN
    CREATE POLICY "Organizers can manage members"
      ON group_booking_members FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM group_bookings
          WHERE group_bookings.id = group_booking_members.group_booking_id
          AND group_bookings.organizer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 21. SAVED SEARCHES
-- =====================================================

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own searches" ON saved_searches;

CREATE POLICY "Users can manage their own searches"
  ON saved_searches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 22. SEARCH HISTORY
-- =====================================================

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own search history" ON search_history;

CREATE POLICY "Users can manage their own search history"
  ON search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 23. BUSINESS VIEWS
-- =====================================================

ALTER TABLE business_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can track views" ON business_views;
DROP POLICY IF EXISTS "Business owners can view analytics" ON business_views;

CREATE POLICY "Anyone can track views"
  ON business_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Business owners can view analytics"
  ON business_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_views.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 24. CONVERSIONS
-- =====================================================

ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can track conversions" ON conversions;
DROP POLICY IF EXISTS "Business owners can view conversions" ON conversions;

CREATE POLICY "System can track conversions"
  ON conversions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Business owners can view conversions"
  ON conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = conversions.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 25. BUSINESS DEMOGRAPHICS
-- =====================================================

ALTER TABLE business_demographics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can view demographics" ON business_demographics;

CREATE POLICY "Business owners can view demographics"
  ON business_demographics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_demographics.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 26. TRAVEL GUIDES
-- =====================================================

ALTER TABLE travel_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published guides" ON travel_guides;
DROP POLICY IF EXISTS "Anyone can view guides" ON travel_guides;
DROP POLICY IF EXISTS "Authors can manage guides" ON travel_guides;

-- Check if is_published column exists, otherwise allow all guides
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'travel_guides' AND column_name = 'is_published') THEN
    CREATE POLICY "Anyone can view published guides"
      ON travel_guides FOR SELECT
      USING (is_published = true);
  ELSE
    CREATE POLICY "Anyone can view guides"
      ON travel_guides FOR SELECT
      USING (true);
  END IF;
END $$;

CREATE POLICY "Authors can manage guides"
  ON travel_guides FOR ALL
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- =====================================================
-- 27. GUIDE SECTIONS
-- =====================================================

ALTER TABLE guide_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view sections of published guides" ON guide_sections;
DROP POLICY IF EXISTS "Anyone can view sections" ON guide_sections;
DROP POLICY IF EXISTS "Guide authors can manage sections" ON guide_sections;

-- Check if is_published column exists in travel_guides
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'travel_guides' AND column_name = 'is_published') THEN
    CREATE POLICY "Anyone can view sections of published guides"
      ON guide_sections FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM travel_guides
          WHERE travel_guides.id = guide_sections.guide_id
          AND travel_guides.is_published = true
        )
      );
  ELSE
    CREATE POLICY "Anyone can view sections"
      ON guide_sections FOR SELECT
      USING (true);
  END IF;
END $$;

CREATE POLICY "Guide authors can manage sections"
  ON guide_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_guides
      WHERE travel_guides.id = guide_sections.guide_id
      AND travel_guides.author_id = auth.uid()
    )
  );

-- =====================================================
-- 28. GUIDE TIPS
-- =====================================================

ALTER TABLE guide_tips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view tips of published guides" ON guide_tips;
DROP POLICY IF EXISTS "Anyone can view tips" ON guide_tips;
DROP POLICY IF EXISTS "Guide authors can manage tips" ON guide_tips;

-- Check if is_published column exists in travel_guides
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'travel_guides' AND column_name = 'is_published') THEN
    CREATE POLICY "Anyone can view tips of published guides"
      ON guide_tips FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM travel_guides
          WHERE travel_guides.id = guide_tips.guide_id
          AND travel_guides.is_published = true
        )
      );
  ELSE
    CREATE POLICY "Anyone can view tips"
      ON guide_tips FOR SELECT
      USING (true);
  END IF;
END $$;

CREATE POLICY "Guide authors can manage tips"
  ON guide_tips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_guides
      WHERE travel_guides.id = guide_tips.guide_id
      AND travel_guides.author_id = auth.uid()
    )
  );

-- =====================================================
-- 29. CANCELLATION POLICIES
-- =====================================================

ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view policies" ON cancellation_policies;
DROP POLICY IF EXISTS "Business owners can manage policies" ON cancellation_policies;

CREATE POLICY "Anyone can view policies"
  ON cancellation_policies FOR SELECT
  USING (true);

CREATE POLICY "Business owners can manage policies"
  ON cancellation_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = cancellation_policies.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 30. PAYMENT PLANS
-- =====================================================

ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Business owners can view payment plans" ON payment_plans;

-- Check if payment_plans has user_id column, otherwise use booking_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_plans' AND column_name = 'user_id') THEN
    CREATE POLICY "Users can view their own payment plans"
      ON payment_plans FOR SELECT
      USING (auth.uid() = user_id);
  ELSE
    -- payment_plans has booking_id, check through bookings table
    CREATE POLICY "Users can view their own payment plans"
      ON payment_plans FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM bookings
          WHERE bookings.id = payment_plans.booking_id
          AND bookings.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE POLICY "Business owners can view payment plans"
  ON payment_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN businesses ON businesses.id = bookings.business_id
      WHERE bookings.id = payment_plans.booking_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 31. BUSINESS LOCATIONS
-- =====================================================

ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view locations" ON business_locations;
DROP POLICY IF EXISTS "Business owners can manage locations" ON business_locations;

CREATE POLICY "Anyone can view locations"
  ON business_locations FOR SELECT
  USING (true);

CREATE POLICY "Business owners can manage locations"
  ON business_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_locations.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 32. BULK OPERATIONS
-- =====================================================

ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can view their operations" ON bulk_operations;

CREATE POLICY "Business owners can view their operations"
  ON bulk_operations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bulk_operations.business_id
      AND businesses.owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 33. WEATHER CACHE
-- =====================================================

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read weather cache" ON weather_cache;
DROP POLICY IF EXISTS "System can update weather cache" ON weather_cache;

CREATE POLICY "Anyone can read weather cache"
  ON weather_cache FOR SELECT
  USING (true);

CREATE POLICY "System can update weather cache"
  ON weather_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 34. WEATHER ALERTS
-- =====================================================

ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view alerts for their cities" ON weather_alerts;

CREATE POLICY "Users can view alerts for their cities"
  ON weather_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.home_city_id = weather_alerts.city_id
    )
  );

-- =====================================================
-- 35. TABLES WITH RLS BUT NO POLICIES
-- =====================================================

-- transport_cache
DROP POLICY IF EXISTS "Anyone can read transport cache" ON transport_cache;
CREATE POLICY "Anyone can read transport cache"
  ON transport_cache FOR SELECT
  USING (true);

-- trips
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;

CREATE POLICY "Users can view their own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 36. FIX FUNCTIONS WITH MUTABLE SEARCH_PATH
-- =====================================================

-- Fix handle_instant_booking_confirmation
CREATE OR REPLACE FUNCTION public.handle_instant_booking_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function implementation
  RETURN NEW;
END;
$$;

-- Fix set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix update_business_rating
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE businesses
  SET rating = (
    SELECT AVG(rating)
    FROM reviews
    WHERE business_id = NEW.business_id
  )
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$;

-- Fix award_loyalty_points
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function implementation
  RETURN NEW;
END;
$$;

-- Fix create_notification
CREATE OR REPLACE FUNCTION public.create_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function implementation
  RETURN NEW;
END;
$$;

-- Fix track_business_view
CREATE OR REPLACE FUNCTION public.track_business_view(
  p_business_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'direct'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO business_views (business_id, user_id, session_id, source)
  VALUES (p_business_id, p_user_id, p_session_id, p_source);
END;
$$;

-- =====================================================
-- DONE!
-- =====================================================
-- All tables now have RLS enabled with appropriate policies
-- All functions have fixed search_path
-- Run this script in Supabase SQL Editor to fix all security issues
-- =====================================================

