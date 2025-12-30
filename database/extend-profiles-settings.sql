-- =====================================================
-- EXTEND PROFILES TABLE FOR SETTINGS PAGE
-- Adds missing columns for account settings functionality
-- =====================================================

-- Add phone number column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add birth date column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add gender column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('masculin', 'feminin', 'prefer-sa-nu-spun'));

-- Add theme preference column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system'));

-- Add two-factor authentication enabled flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON profiles(birth_date) WHERE birth_date IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.phone IS 'User phone number';
COMMENT ON COLUMN profiles.birth_date IS 'User birth date';
COMMENT ON COLUMN profiles.gender IS 'User gender preference';
COMMENT ON COLUMN profiles.theme IS 'User theme preference (light, dark, system)';
COMMENT ON COLUMN profiles.two_factor_enabled IS 'Whether two-factor authentication is enabled';

