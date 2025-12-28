# Database Scripts

This directory contains SQL scripts for setting up and maintaining the database schema.

## 📋 Schema Scripts

### Core Schema
- `booking-schema.sql` - Booking system tables
- `feed-schema.sql` - Feed system tables (city_posts, promotions)
- `profile-schema.sql` - User profile tables
- `trip-items-schema.sql` - Trip planning tables

### Extensions & Updates
- `romanian-cities.sql` - Populate cities table with Romanian cities
- `extend-business-schema.sql` - Extended business schema with all categories
- `add-business-attributes-column.sql` - Add attributes JSONB column
- `add-promotion-fields.sql` - Add promotion package fields

## 🔧 Utility Scripts

Test and debug scripts have been moved to `database/scripts/test/` to keep the main directory clean.

### When to Use Test Scripts
- Creating test data for development
- Debugging schema issues
- Verifying database state
- Assigning business ownership for testing

## 🚀 Setup Order

1. **Initial Setup** (if starting fresh):
   ```sql
   -- Run in Supabase SQL Editor:
   -- 1. Core schemas (if tables don't exist)
   -- 2. romanian-cities.sql
   -- 3. extend-business-schema.sql
   -- 4. add-promotion-fields.sql
   ```

2. **For Existing Databases**:
   - Run `extend-business-schema.sql` to add new columns
   - Run `add-promotion-fields.sql` for promotion features
   - Use test scripts from `scripts/test/` as needed

## 📝 Notes

- All scripts use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` where appropriate
- RLS policies are included in schema scripts
- Scripts are idempotent (safe to run multiple times)

