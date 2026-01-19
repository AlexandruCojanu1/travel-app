-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    icon_url TEXT,
    tier TEXT DEFAULT 'bronze',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements (Read only for authenticated)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'Achievements are viewable by everyone') THEN
        CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);
    END IF;
END $$;

-- Policies for user_achievements
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can view their own achievements') THEN
        CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can insert their own achievements') THEN
        CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can update their own achievements') THEN
        CREATE POLICY "Users can update their own achievements" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Initial Seed Data
INSERT INTO public.achievements (slug, name, description, criteria, icon_url, tier)
VALUES 
    ('novice-explorer', 'Novice Explorer', 'Create your first account and log in.', '{"type": "login"}', NULL, 'bronze'),
    ('first-trip', 'Ready for Adventure', 'Create your first trip plan.', '{"type": "trip_creation", "count": 1}', NULL, 'bronze'),
    ('visit-brasov', 'Brașov Explorer', 'Visit Brașov city.', '{"type": "location", "city_name": "Brașov"}', NULL, 'silver'),
    ('coffee-snob', 'Coffee Snob', 'Check-in at 3 specialty coffee shops.', '{"type": "category_visit", "category": "coffee", "count": 3}', NULL, 'gold')
ON CONFLICT (slug) DO NOTHING;
