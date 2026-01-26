-- Gamification Rules Engine Migration
-- Allows dynamic configuration of gamification rules and quests from admin panel

-- 1. gamification_rules Table
-- Stores configurable rules that trigger rewards/achievements/badges
CREATE TABLE IF NOT EXISTS public.gamification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('achievement', 'badge', 'reward', 'quest_step')),
  trigger_event TEXT NOT NULL, -- 'trip_completed', 'check_in', 'booking_made', 'review_posted', etc.
  
  -- Conditions (JSONB pentru flexibilitate)
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Exemplu:
  -- {
  --   "type": "location",
  --   "city_name": "Brașov",
  --   "operator": "equals"
  -- }
  -- {
  --   "type": "count",
  --   "field": "trips_completed",
  --   "operator": "gte",
  --   "value": 5
  -- }
  -- {
  --   "type": "category",
  --   "business_category": "hotel",
  --   "operator": "equals"
  -- }
  
  -- Rewards
  xp_reward INTEGER DEFAULT 0,
  coins_reward INTEGER DEFAULT 0,
  badge_id UUID REFERENCES public.gamification_badges(id) ON DELETE SET NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  
  -- Priority & Activation
  priority INTEGER DEFAULT 0, -- Higher = checked first
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gamification_rules_trigger ON public.gamification_rules(trigger_event, is_active, priority DESC);
CREATE INDEX idx_gamification_rules_type ON public.gamification_rules(rule_type, is_active);

-- 2. gamification_quests Table
-- Stores multi-step quests/challenges
CREATE TABLE IF NOT EXISTS public.gamification_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_name TEXT NOT NULL,
  quest_description TEXT,
  quest_slug TEXT UNIQUE NOT NULL,
  
  -- Quest Steps (pași configurabili!)
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Exemplu:
  -- [
  --   {
  --     "step_number": 1,
  --     "title": "Visit Brașov",
  --     "description": "Check in to Brașov city",
  --     "trigger_event": "check_in",
  --     "conditions": {"city_name": "Brașov"},
  --     "reward": {"xp": 50, "coins": 5}
  --   },
  --   {
  --     "step_number": 2,
  --     "title": "Book a hotel",
  --     "description": "Make a hotel booking",
  --     "trigger_event": "booking_made",
  --     "conditions": {"business_type": "hotel"},
  --     "reward": {"xp": 100, "coins": 10}
  --   }
  -- ]
  
  -- Quest Metadata
  quest_type TEXT DEFAULT 'linear' CHECK (quest_type IN ('linear', 'parallel', 'choice')),
  -- linear: steps must be completed in order
  -- parallel: steps can be completed in any order
  -- choice: user chooses which path to take
  
  time_limit_days INTEGER, -- NULL = no limit
  is_repeatable BOOLEAN DEFAULT false,
  
  -- Rewards for completing entire quest
  completion_xp INTEGER DEFAULT 0,
  completion_coins INTEGER DEFAULT 0,
  completion_badge_id UUID REFERENCES public.gamification_badges(id) ON DELETE SET NULL,
  completion_achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  
  -- Activation
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Visual
  icon_url TEXT,
  banner_image_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gamification_quests_active ON public.gamification_quests(is_active, start_date, end_date);
CREATE INDEX idx_gamification_quests_slug ON public.gamification_quests(quest_slug);

-- 3. user_quests Table
-- Tracks user progress through quests
CREATE TABLE IF NOT EXISTS public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.gamification_quests(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  progress JSONB DEFAULT '{}'::jsonb, -- Progress per step: {"1": true, "2": false, ...}
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Calculated from quest time_limit_days
  UNIQUE(user_id, quest_id)
);

CREATE INDEX idx_user_quests_user ON public.user_quests(user_id, status);
CREATE INDEX idx_user_quests_quest ON public.user_quests(quest_id, status);

-- RLS Policies
ALTER TABLE public.gamification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

-- Rules are viewable by everyone (for client-side evaluation)
CREATE POLICY "Gamification rules are viewable by everyone" 
  ON public.gamification_rules FOR SELECT 
  USING (true);

-- Quests are viewable by everyone
CREATE POLICY "Gamification quests are viewable by everyone" 
  ON public.gamification_quests FOR SELECT 
  USING (true);

-- Users can view their own quest progress
CREATE POLICY "Users can view own quest progress" 
  ON public.user_quests FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own quest progress
CREATE POLICY "Users can insert own quest progress" 
  ON public.user_quests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own quest progress
CREATE POLICY "Users can update own quest progress" 
  ON public.user_quests FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_gamification_rules_updated_at
  BEFORE UPDATE ON public.gamification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_quests_updated_at
  BEFORE UPDATE ON public.gamification_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed some example rules (optional - can be added via admin panel)
INSERT INTO public.gamification_rules (rule_name, rule_type, trigger_event, conditions, xp_reward, coins_reward, priority, is_active, description)
VALUES 
  (
    'First Trip Created',
    'achievement',
    'trip_created',
    '{"type": "count", "field": "trips_created", "operator": "gte", "value": 1}'::jsonb,
    50,
    10,
    10,
    true,
    'Award XP and coins when user creates their first trip'
  ),
  (
    'Brașov Check-in',
    'badge',
    'check_in',
    '{"type": "location", "city_name": "Brașov", "operator": "equals"}'::jsonb,
    25,
    5,
    5,
    true,
    'Award badge and rewards for checking in to Brașov'
  )
ON CONFLICT (rule_name) DO NOTHING;

-- Seed an example quest (optional)
INSERT INTO public.gamification_quests (quest_name, quest_slug, quest_description, steps, quest_type, completion_xp, completion_coins, is_active)
VALUES 
  (
    'Brașov Adventure',
    'brasov-adventure',
    'Complete your first adventure in Brașov',
    '[
      {
        "step_number": 1,
        "title": "Visit Brașov",
        "description": "Check in to Brașov city",
        "trigger_event": "check_in",
        "conditions": {"city_name": "Brașov"},
        "reward": {"xp": 50, "coins": 5}
      },
      {
        "step_number": 2,
        "title": "Book Accommodation",
        "description": "Make a hotel booking",
        "trigger_event": "booking_made",
        "conditions": {"business_type": "hotel"},
        "reward": {"xp": 100, "coins": 10}
      },
      {
        "step_number": 3,
        "title": "Share Experience",
        "description": "Write a review",
        "trigger_event": "review_posted",
        "conditions": {},
        "reward": {"xp": 50, "coins": 5}
      }
    ]'::jsonb,
    'linear',
    200,
    20,
    true
  )
ON CONFLICT (quest_slug) DO NOTHING;
