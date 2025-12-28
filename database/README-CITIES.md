# Setup Cities Database

## Problem
If you see "No cities found" when trying to select a city, it means the `cities` table in Supabase is empty or the Row Level Security (RLS) policies are blocking access.

## Solution

### Step 1: Run the Romanian Cities SQL Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `database/romanian-cities.sql`
4. Click **Run** to execute the script

This will:
- Insert 35+ Romanian cities (including Brașov, Bucharest, Cluj-Napoca, etc.)
- Set up proper RLS policies to allow public read access to active cities
- Ensure all cities have `is_active = true`

### Step 2: Verify the Data

After running the script, verify that cities were inserted:

```sql
SELECT COUNT(*) FROM cities WHERE is_active = true;
```

You should see at least 35 cities.

### Step 3: Check RLS Policies

Verify that the RLS policies are correct:

```sql
SELECT * FROM pg_policies WHERE tablename = 'cities';
```

You should see:
- "Public can view active cities" - allows anyone to view cities where `is_active = true`
- "Authenticated users can view all cities" - allows logged-in users to view all cities

### Step 4: Test the Application

1. Refresh your application
2. Try to select a city (e.g., search for "Brașov" or "Bucharest")
3. You should now see cities in the dropdown

## Troubleshooting

### Still seeing "No cities found"?

1. **Check browser console** for errors:
   - Open Developer Tools (F12)
   - Look for errors in the Console tab
   - Check Network tab for failed requests

2. **Verify Supabase connection**:
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

3. **Check RLS policies**:
   - Make sure RLS is enabled: `ALTER TABLE cities ENABLE ROW LEVEL SECURITY;`
   - Make sure the public policy exists and allows SELECT

4. **Verify cities exist**:
   ```sql
   SELECT id, name, country, is_active FROM cities LIMIT 10;
   ```

5. **Check if cities are active**:
   ```sql
   SELECT COUNT(*) FROM cities WHERE is_active = true;
   ```

## Adding More Cities

To add more cities, you can either:

1. **Use the SQL script format**:
   ```sql
   INSERT INTO cities (name, country, state_province, latitude, longitude, is_active)
   VALUES ('City Name', 'Country', 'State', 45.0000, 25.0000, true);
   ```

2. **Use Supabase Dashboard**:
   - Go to Table Editor
   - Select `cities` table
   - Click "Insert row"
   - Fill in the required fields

## Notes

- All cities in the seed script have `is_active = true` by default
- The script uses `ON CONFLICT DO NOTHING` to avoid duplicates if run multiple times
- Coordinates are in decimal degrees (latitude, longitude)
- The RLS policy allows public read access to active cities, which is necessary for the city selector to work


