-- Add payment attributes to active bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('prepay_full', 'split')),
ADD COLUMN IF NOT EXISTS split_status TEXT CHECK (split_status IN ('collecting', 'completed', 'voided')) DEFAULT NULL;

-- Create payment_splits table
CREATE TABLE IF NOT EXISTS public.payment_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    bill_id UUID, -- For restaurant bills (nullable)
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
    stripe_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create restaurant_bills table
CREATE TABLE IF NOT EXISTS public.restaurant_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    restaurant_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{id, name, price, assigned_to: [user_ids]}]
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK (status IN ('active', 'paid')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_bills ENABLE ROW LEVEL SECURITY;

-- Policies for payment_splits
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_splits' AND policyname = 'Users can view their own and related splits') THEN
        CREATE POLICY "Users can view their own and related splits" ON public.payment_splits
        FOR SELECT USING (
            auth.uid() = user_id OR 
            EXISTS (
                SELECT 1 FROM public.bookings b 
                WHERE b.id = payment_splits.booking_id AND b.user_id = auth.uid()
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_splits' AND policyname = 'Users can update their own splits') THEN
        CREATE POLICY "Users can update their own splits" ON public.payment_splits
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Policies for restaurant_bills
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurant_bills' AND policyname = 'Restaurant bills viewable by trip members') THEN
        CREATE POLICY "Restaurant bills viewable by trip members" ON public.restaurant_bills
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.trip_collaborators tc
                WHERE tc.trip_id = restaurant_bills.trip_id AND tc.user_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.trips t
                WHERE t.id = restaurant_bills.trip_id AND t.user_id = auth.uid()
            )
        );
    END IF;
END $$;
