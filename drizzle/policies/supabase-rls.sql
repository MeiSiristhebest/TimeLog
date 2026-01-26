-- Supabase RLS baseline for TimeLog
-- Run in Supabase SQL Editor or deploy via migrations (do not commit secrets).

-- 0) Create profiles table if missing (auth-backed)
create table if not exists public.profiles
(
    id
    uuid
    primary
    key
    references
    auth
    .
    users
(
    id
) on delete cascade,
    full_name text,
    avatar_url text,
    created_at timestamp
  with time zone default now()
    );

-- 1) Enable RLS on profiles
alter table public.profiles enable row level security;

-- 2) Default deny-all (fallback) - ensures no implicit access
drop
policy if exists "profiles_deny_all" on public.profiles;
create
policy "profiles_deny_all"
  on public.profiles
  for all
  to public
  using (false)
  with check (false);

-- 3) Allow authenticated users to read their own profile
drop
policy if exists "profiles_select_own" on public.profiles;
create
policy "profiles_select_own"
  on public.profiles
  for
select
    to authenticated
    using (id = auth.uid());

-- 4) (Optional) Allow owners to update their own profile
-- drop policy if exists "profiles_update_own" on public.profiles;
-- create policy "profiles_update_own"
--   on public.profiles
--   for update
--   to authenticated
--   using (id = auth.uid())
--   with check (id = auth.uid());
