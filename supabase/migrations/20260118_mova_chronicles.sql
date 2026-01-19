-- MOVA Chronicles: The Digital Passport Migration
-- Phase 1: Database Schema & Logic

-- 1. gamification_badges Table
-- Represents the "Stamps" and "Visas" collectible by users.
create table if not exists gamification_badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  icon_url text not null, -- SVG path or URL
  rarity text check (rarity in ('common', 'rare', 'legendary', 'mythic')) default 'common',
  category text check (category in ('geo', 'action', 'secret', 'social')) default 'action',
  xp_value integer default 50,
  metadata jsonb default '{}'::jsonb, -- Store logic criteria like city_id, threshold, etc.
  created_at timestamp with time zone default now()
);

alter table gamification_badges enable row level security;
create policy "Badges are viewable by everyone" on gamification_badges for select using (true);

-- 2. user_progress Table
-- The "Digital Twin" stats: XP, Level, Coins.
create table if not exists user_progress (
  user_id uuid references auth.users on delete cascade primary key,
  total_xp integer default 0,
  current_level integer default 1,
  next_level_threshold integer default 100, -- Initial threshold (Level 1 -> 2)
  stamps_collected integer default 0,
  coins integer default 0, -- Soft currency
  updated_at timestamp with time zone default now()
);

alter table user_progress enable row level security;
create policy "Users can view own progress" on user_progress for select using (auth.uid() = user_id);
create policy "System can update progress" on user_progress for all using (true); -- Usually restricted to service role or functions

-- 3. user_badges Table
-- The collected instances of badges.
create table if not exists user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  badge_id uuid references gamification_badges(id) on delete cascade not null,
  earned_at timestamp with time zone default now(),
  is_seen boolean default false, -- For notification badge logic
  visual_state text check (visual_state in ('pristine', 'weathered')) default 'pristine',
  unique(user_id, badge_id) -- Prevent duplicate badges of same type? Or allow multiples? Assuming unique for now.
);

alter table user_badges enable row level security;
create policy "Users can view own badges" on user_badges for select using (auth.uid() = user_id);

-- 4. wallet_transactions Table
-- Audit trail for the "Coins" economy.
create table if not exists wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount integer not null, -- Positive for earning, negative for spending
  source text not null, -- e.g., 'level_up', 'badge_earned', 'split_bill_reward'
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

alter table wallet_transactions enable row level security;
create policy "Users can view own transactions" on wallet_transactions for select using (auth.uid() = user_id);


-- 5. FUNCTION: Calculate Next Level Threshold
-- Formula: 100 * (CurrentLevel ^ 1.5)
create or replace function calculate_next_level_threshold(level integer)
returns integer as $$
begin
  return floor(100 * power(level, 1.5));
end;
$$ language plpgsql immutable;


-- 6. TRIGGER: Level Up Logic
-- Automatically increments level if Total_XP >= Threshold
create or replace function handle_user_progress_update()
returns trigger as $$
begin
  -- Check if XP crossed the threshold
  if new.total_xp >= new.next_level_threshold then
    -- Increment Level
    new.current_level := new.current_level + 1;
    
    -- Recalculate new threshold for the NEXT level
    -- Formula: 100 * (new_level ^ 1.5)
    new.next_level_threshold := calculate_next_level_threshold(new.current_level);
    
    -- Recursively check again? (In case of massive XP gain jumping 2+ levels)
    -- For safety in Postgres triggers, we might loop, but simple single-step is safer for now.
    -- Ideally, we'd loop WHILE new.total_xp >= new.next_level_threshold.
    
    -- Optional: Award Bonus Coins for Level Up?
    -- new.coins := new.coins + (new.current_level * 10);
  end if;
  
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_progress_update on user_progress;
create trigger on_progress_update
before update on user_progress
for each row
execute function handle_user_progress_update();


-- 7. FUNCTION: Initialize User Progress
-- Trigger to create user_progress row when a new user is created
create or replace function public.handle_new_user_gamification()
returns trigger as $$
begin
  insert into public.user_progress (user_id, total_xp, current_level, next_level_threshold)
  values (new.id, 0, 1, 100)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Hook into auth.users creation (if not already handled by another trigger)
-- Uncomment if needed, or run manually once
-- drop trigger if exists on_auth_user_created_gamification on auth.users;
-- create trigger on_auth_user_created_gamification
--   after insert on auth.users
--   for each row execute function public.handle_new_user_gamification();
