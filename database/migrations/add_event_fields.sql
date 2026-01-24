-- Add business_id, facebook_event_url, is_active to events table
-- Also ensure title and description are present if not already

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS facebook_event_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ticket_url TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_business_id ON public.events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_city_id ON public.events(city_id);

-- Add RLS policies if not present
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Events are viewable by everyone" 
ON public.events FOR SELECT 
USING (true);

-- Allow business owners to insert/update their own events
CREATE POLICY "Business owners can insert events" 
ON public.events FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM public.businesses WHERE id = business_id
  )
);

CREATE POLICY "Business owners can update their own events" 
ON public.events FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.businesses WHERE id = business_id
  )
);

CREATE POLICY "Business owners can delete their own events" 
ON public.events FOR DELETE 
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.businesses WHERE id = business_id
  )
);
