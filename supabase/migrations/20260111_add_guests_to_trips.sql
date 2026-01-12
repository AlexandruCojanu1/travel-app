-- Add guests column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS guests INTEGER NOT NULL DEFAULT 1;

-- Update existing trips to have at least 1 guest if needed
UPDATE trips SET guests = 1 WHERE guests IS NULL;
