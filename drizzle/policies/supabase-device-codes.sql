-- Supabase RPC + RLS for device codes and devices (TimeLog)
-- Run in Supabase SQL Editor. No secrets in this file.

create extension if not exists "pgcrypto";

-- Devices linked to a family account
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  family_user_id uuid not null references auth.users (id) on delete cascade,
  device_name text,
  created_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone,
  revoked_at timestamp with time zone
);

-- Temporary device codes (6-digit, 15 min TTL)
create table if not exists public.device_codes (
  id uuid primary key default gen_random_uuid(),
  family_user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  revoked_at timestamp with time zone
);

create index if not exists device_codes_family_user_id_idx on public.device_codes (family_user_id);
create index if not exists device_codes_expires_at_idx on public.device_codes (expires_at);
create unique index if not exists device_codes_code_unique_idx on public.device_codes (code);

-- RLS
alter table public.devices enable row level security;
alter table public.device_codes enable row level security;

drop policy if exists "devices_select_own" on public.devices;
create policy "devices_select_own"
  on public.devices
  for select
  to authenticated
  using (family_user_id = auth.uid());

drop policy if exists "device_codes_select_own" on public.device_codes;
create policy "device_codes_select_own"
  on public.device_codes
  for select
  to authenticated
  using (family_user_id = auth.uid());

-- RPC: generate device code (rate limit 5/hour, TTL 15 mins)
drop function if exists public.generate_device_code();
create function public.generate_device_code()
returns table(code text, expires_at timestamp with time zone)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  recent_count int;
  new_code text;
  expires_at_ts timestamp with time zone;
  attempt int;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select count(*)
  into recent_count
  from public.device_codes
  where family_user_id = auth.uid()
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'rate_limit_exceeded';
  end if;

  for attempt in 1..5 loop
    new_code := lpad((floor(random() * 1000000))::text, 6, '0');
    exit when not exists (
      select 1
      from public.device_codes dc
      where dc.code = new_code
        and dc.expires_at > now()
        and dc.revoked_at is null
        and dc.used_at is null
    );
  end loop;

  if new_code is null then
    raise exception 'code_generation_failed';
  end if;

  expires_at_ts := now() + interval '15 minutes';

  insert into public.device_codes (family_user_id, code, expires_at)
  values (auth.uid(), new_code, expires_at_ts);

  code := new_code;
  expires_at := expires_at_ts;
  return next;
end;
$$;

revoke all on function public.generate_device_code() from public;
grant execute on function public.generate_device_code() to authenticated;

-- RPC: list devices for current family user
create or replace function public.list_family_devices()
returns table(
  id uuid,
  device_name text,
  created_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  revoked_at timestamp with time zone
)
language sql
security definer
set search_path = public, auth
as $$
  select d.id, d.device_name, d.created_at, d.last_seen_at, d.revoked_at
  from public.devices d
  where d.family_user_id = auth.uid()
  order by d.created_at desc;
$$;

revoke all on function public.list_family_devices() from public;
grant execute on function public.list_family_devices() to authenticated;

-- RPC: revoke a device for current family user
create or replace function public.revoke_device(p_device_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.devices
  set revoked_at = now()
  where id = p_device_id
    and family_user_id = auth.uid()
    and revoked_at is null;

  if not found then
    raise exception 'device_not_found';
  end if;
end;
$$;

revoke all on function public.revoke_device(uuid) from public;
grant execute on function public.revoke_device(uuid) to authenticated;
