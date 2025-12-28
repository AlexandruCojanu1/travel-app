-- =====================================================
-- ADD: Promotion fields for monetization system
-- Adds package_type, status, and amount columns
-- =====================================================

-- Add package_type column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'package_type'
  ) THEN
    ALTER TABLE promotions ADD COLUMN package_type TEXT;
    -- Add CHECK constraint for valid package types
    ALTER TABLE promotions ADD CONSTRAINT promotions_package_type_check 
      CHECK (package_type IS NULL OR package_type IN ('silver', 'gold', 'platinum'));
  END IF;
END $$;

-- Add status column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'status'
  ) THEN
    ALTER TABLE promotions ADD COLUMN status TEXT DEFAULT 'pending_payment';
    -- Add CHECK constraint for valid statuses
    ALTER TABLE promotions ADD CONSTRAINT promotions_status_check 
      CHECK (status IN ('pending_payment', 'active', 'expired', 'cancelled'));
  END IF;
END $$;

-- Add amount column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'amount'
  ) THEN
    ALTER TABLE promotions ADD COLUMN amount DECIMAL(10, 2);
  END IF;
END $$;

-- Create index on package_type and status for faster queries
CREATE INDEX IF NOT EXISTS idx_promotions_package_type ON promotions(package_type);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- Update existing promotions to have default status if NULL
UPDATE promotions 
SET status = 'active' 
WHERE status IS NULL AND is_active = true;

UPDATE promotions 
SET status = 'expired' 
WHERE status IS NULL AND is_active = false;

