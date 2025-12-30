-- =====================================================
-- EXTEND USER_PREFERENCES FOR NOTIFICATION SETTINGS
-- Adds detailed notification preferences
-- =====================================================

-- Add push notification preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_notifications_urgent BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_notifications_checkin BOOLEAN DEFAULT true;

-- Add email notification preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS email_notifications_newsletter BOOLEAN DEFAULT false;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS email_notifications_offers BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.push_notifications_urgent IS 'Enable push notifications for urgent flight updates';
COMMENT ON COLUMN user_preferences.push_notifications_checkin IS 'Enable push notifications for check-in reminders';
COMMENT ON COLUMN user_preferences.email_notifications_newsletter IS 'Enable email notifications for newsletter';
COMMENT ON COLUMN user_preferences.email_notifications_offers IS 'Enable email notifications for offers';

