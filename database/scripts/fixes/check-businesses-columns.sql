-- =====================================================
-- CHECK: What columns exist in businesses table?
-- Run this first to see what columns are available
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

