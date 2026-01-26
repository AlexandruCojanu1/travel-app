-- Create algorithm_settings table for MOVA Smart Budget configuration
CREATE TABLE IF NOT EXISTS algorithm_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  split_ratio_hotel NUMERIC NOT NULL DEFAULT 0.4 CHECK (split_ratio_hotel >= 0 AND split_ratio_hotel <= 1),
  split_ratio_food NUMERIC NOT NULL DEFAULT 0.3 CHECK (split_ratio_food >= 0 AND split_ratio_food <= 1),
  split_ratio_activity NUMERIC NOT NULL DEFAULT 0.3 CHECK (split_ratio_activity >= 0 AND split_ratio_activity <= 1),
  weight_price_fit NUMERIC NOT NULL DEFAULT 0.3 CHECK (weight_price_fit >= 0 AND weight_price_fit <= 1),
  weight_distance NUMERIC NOT NULL DEFAULT 0.2 CHECK (weight_distance >= 0 AND weight_distance <= 1),
  weight_affinity NUMERIC NOT NULL DEFAULT 0.3 CHECK (weight_affinity >= 0 AND weight_affinity <= 1),
  weight_rating NUMERIC NOT NULL DEFAULT 0.2 CHECK (weight_rating >= 0 AND weight_rating <= 1),
  penalty_per_km NUMERIC NOT NULL DEFAULT 10.0 CHECK (penalty_per_km >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT check_split_ratios_sum CHECK (
    ABS((split_ratio_hotel + split_ratio_food + split_ratio_activity) - 1.0) < 0.001
  ),
  CONSTRAINT check_weights_sum CHECK (
    ABS((weight_price_fit + weight_distance + weight_affinity + weight_rating) - 1.0) < 0.001
  )
);

-- Insert default settings
INSERT INTO algorithm_settings (
  id,
  split_ratio_hotel,
  split_ratio_food,
  split_ratio_activity,
  weight_price_fit,
  weight_distance,
  weight_affinity,
  weight_rating,
  penalty_per_km
) VALUES (
  1,
  0.4,
  0.3,
  0.3,
  0.3,
  0.2,
  0.3,
  0.2,
  10.0
) ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_algorithm_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_algorithm_settings_timestamp
  BEFORE UPDATE ON algorithm_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_algorithm_settings_updated_at();
