-- ==============================================================================
-- Sahaj Birthday Countdown & R4 914 GPL Protocol
-- Supabase Production Schema & Realtime Configuration
-- ==============================================================================

-- 1. PARTICIPANTS TABLE (R4 914 Deployment Squad)
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  assigned_gear text,
  eta text,
  notes text,
  confirmed boolean default true,
  created_at timestamptz default now()
);

-- 2. WISHES TABLE (Wishes & Roasts Wall)
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  message text not null,
  is_roast boolean default false,
  likes integer default 0,
  created_at timestamptz default now()
);

-- 3. GPL STATS TABLE (Global Hits Counter)
create table if not exists public.gpl_stats (
  id text primary key,
  global_hits bigint default 0,
  updated_at timestamptz default now()
);

-- Initialize global hits row if not exists
insert into public.gpl_stats (id, global_hits, updated_at)
values ('global', 0, now())
on conflict (id) do nothing;

-- 4. MATERIAL CLAIMS TABLE (Optional real-time hostel arsenal claims)
create table if not exists public.material_claims (
  id uuid primary key default gen_random_uuid(),
  material_id text not null,
  claimant_name text not null,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ATOMIC RPC FUNCTIONS
-- ==============================================================================

-- Increment Global GPL Hits atomically
create or replace function public.increment_gpl_hits(amount integer default 1)
returns bigint
language plpgsql
security definer
as $$
declare
  new_hits bigint;
begin
  update public.gpl_stats
  set global_hits = global_hits + coalesce(amount, 1),
      updated_at = now()
  where id = 'global'
  returning global_hits into new_hits;

  if not found then
    insert into public.gpl_stats (id, global_hits, updated_at)
    values ('global', coalesce(amount, 1), now())
    returning global_hits into new_hits;
  end if;

  return new_hits;
end;
$$;

-- Atomic like wish
create or replace function public.like_wish(target_wish_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_likes integer;
begin
  update public.wishes
  set likes = coalesce(likes, 0) + 1
  where id = target_wish_id
  returning likes into new_likes;

  return new_likes;
end;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.participants enable row level security;
alter table public.wishes enable row level security;
alter table public.gpl_stats enable row level security;
alter table public.material_claims enable row level security;

-- PARTICIPANTS POLICIES
-- Anyone can view the confirmed squad
create policy "Allow public read on participants"
  on public.participants for select
  using (true);

-- Anyone can submit RSVP
create policy "Allow public insert on participants"
  on public.participants for insert
  with check (true);

-- No public update or delete on participants

-- WISHES POLICIES
-- Anyone can view wishes
create policy "Allow public read on wishes"
  on public.wishes for select
  using (true);

-- Anyone can post a wish/roast
create policy "Allow public insert on wishes"
  on public.wishes for insert
  with check (true);

-- Likes must only be updated through the like_wish(target_wish_id) security definer RPC

-- GPL STATS POLICIES
-- Anyone can read global hits
create policy "Allow public read on gpl_stats"
  on public.gpl_stats for select
  using (true);

-- MATERIAL CLAIMS POLICIES
-- Anyone can read claims
create policy "Allow public read on material_claims"
  on public.material_claims for select
  using (true);

-- Anyone can claim material
create policy "Allow public insert on material_claims"
  on public.material_claims for insert
  with check (true);

-- Anonymous/public visitors cannot delete material claims

-- ==============================================================================
-- REALTIME PUBLICATION SETUP
-- ==============================================================================

begin;
  -- Add tables to realtime publication if not already added
  do $$
  begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      alter publication supabase_realtime add table public.participants;
      alter publication supabase_realtime add table public.wishes;
      alter publication supabase_realtime add table public.gpl_stats;
      alter publication supabase_realtime add table public.material_claims;
    end if;
  exception
    when duplicate_object then null;
  end $$;
commit;
