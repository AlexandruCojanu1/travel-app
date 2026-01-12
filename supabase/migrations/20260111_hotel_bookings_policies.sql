-- Allow users to view their own bookings
CREATE POLICY "Users can view their own bookings"
ON hotel_bookings FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own bookings (if not already strictly handled by service role, but usually good for client-side inserts if used, though service uses service role mostly. actually service uses createClient() which is user context usually)
-- The booking service uses `createClient` which inherits user context. So we need insert policy too.
CREATE POLICY "Users can create their own bookings"
ON hotel_bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);
