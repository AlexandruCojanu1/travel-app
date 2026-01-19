-- Group Swipes & Voting Schema

create table if not exists trip_votes (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_id uuid references businesses(id) on delete cascade not null,
  vote text check (vote in ('like', 'pass', 'superlike')) not null,
  created_at timestamp with time zone default now(),
  unique(trip_id, user_id, business_id)
);

alter table trip_votes enable row level security;

-- Policies
create policy "Trip members can view votes" 
on trip_votes for select 
using (
  auth.uid() in (
    select user_id from trip_collaborators where trip_id = trip_votes.trip_id
    union
    select user_id from trips where id = trip_votes.trip_id
  )
);

create policy "Trip members can vote" 
on trip_votes for insert 
with check (
  auth.uid() in (
    select user_id from trip_collaborators where trip_id = trip_votes.trip_id
    union
    select user_id from trips where id = trip_votes.trip_id
  )
);

create policy "Users can update own votes" 
on trip_votes for update 
using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table trip_votes;
