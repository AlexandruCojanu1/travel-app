-- Fix RLS infinite recursion for trip_collaborators
-- This table needs policies BEFORE other tables can reference it

-- Enable RLS if not already enabled
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for trip_collaborators (using dynamic SQL to catch all)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'trip_collaborators' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.trip_collaborators', r.policyname);
    END LOOP;
END $$;

-- Policy: Users can view collaborators for trips they own or are part of
-- This avoids recursion by checking trips table directly, not trip_collaborators
CREATE POLICY "Trip members can view collaborators" 
ON public.trip_collaborators
FOR SELECT 
USING (
  -- User is the trip owner
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = trip_collaborators.trip_id 
    AND t.user_id = auth.uid()
  )
  OR
  -- User is a collaborator (check directly, not recursively)
  trip_collaborators.user_id = auth.uid()
);

-- Policy: Trip owners can add collaborators
CREATE POLICY "Trip owners can add collaborators"
ON public.trip_collaborators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = trip_collaborators.trip_id
    AND t.user_id = auth.uid()
  )
);

-- Policy: Trip owners can update/delete collaborators
CREATE POLICY "Trip owners can manage collaborators"
ON public.trip_collaborators
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = trip_collaborators.trip_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Trip owners can delete collaborators"
ON public.trip_collaborators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = trip_collaborators.trip_id
    AND t.user_id = auth.uid()
  )
);
