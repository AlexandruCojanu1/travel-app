-- Fix Algorithm Settings Constraints
-- Ensure CHECK constraints are properly enforced

-- Drop existing constraints if they exist (to avoid conflicts)
ALTER TABLE algorithm_settings 
  DROP CONSTRAINT IF EXISTS check_split_ratios_sum,
  DROP CONSTRAINT IF EXISTS check_weights_sum;

-- Recreate constraints with proper tolerance for floating point arithmetic
ALTER TABLE algorithm_settings 
  ADD CONSTRAINT check_split_ratios_sum CHECK (
    ABS((COALESCE(split_ratio_hotel, 0) + COALESCE(split_ratio_food, 0) + COALESCE(split_ratio_activity, 0)) - 1.0) < 0.01
  ),
  ADD CONSTRAINT check_weights_sum CHECK (
    ABS((COALESCE(weight_price_fit, 0) + COALESCE(weight_distance, 0) + COALESCE(weight_affinity, 0) + COALESCE(weight_rating, 0)) - 1.0) < 0.01
  );

-- Add comment explaining constraints
COMMENT ON CONSTRAINT check_split_ratios_sum ON algorithm_settings IS 
  'Ensures budget split ratios sum to 100% (within 1% tolerance for floating point precision)';

COMMENT ON CONSTRAINT check_weights_sum ON algorithm_settings IS 
  'Ensures scoring weights sum to 1.0 (within 1% tolerance for floating point precision)';
