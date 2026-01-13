-- Supabase schema + RPC for family invitations (TimeLog)
-- Run in Supabase SQL Editor. No secrets here.

create extension if not exists "pgcrypto";

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null, -- admin's auth.uid()
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  role text not null default 'member',
  status text not null default 'pending', -- pending/accepted
  invite_token text,
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamp with time zone not null default now(),
  accepted_at timestamp with time zone
);

create unique index if not exists family_members_email_family_idx on public.family_members (family_id, email);
create index if not exists family_members_user_family_idx on public.family_members (family_id, user_id);

alter table public.family_members enable row level security;

drop policy if exists "family_members_select_own" on public.family_members;
create policy "family_members_select_own"
  on public.family_members
  for select
  to authenticated
  using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = family_members.family_id
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );

drop policy if exists "family_members_insert_admin" on public.family_members;
create policy "family_members_insert_admin"
  on public.family_members
  for insert
  to authenticated
  with check (role in ('admin', 'member'));

drop policy if exists "family_members_update_admin" on public.family_members;
create policy "family_members_update_admin"
  on public.family_members
  for update
  to authenticated
  using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = family_members.family_id
        and fm.user_id = auth.uid()
        and fm.role = 'admin'
        and fm.status = 'accepted'
    )
  )
  with check (status in ('pending', 'accepted'));

drop function if exists public.create_family_invite(text);
drop function if exists public.create_family_invite(uuid, text);
create or replace function public.create_family_invite(p_email text)
returns table(invite_token text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  token text;
  inviter_role text;
  admin_family_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  -- Ensure admin exists; first user becomes admin with family_id = auth.uid()
  select family_id, role
  into admin_family_id, inviter_role
  from public.family_members
  where user_id = auth.uid()
    and family_id = auth.uid()
    and status = 'accepted'
  limit 1;

  if admin_family_id is null then
    insert into public.family_members (family_id, email, user_id, role, status, invited_by, invited_at, accepted_at)
    values (auth.uid(), '', auth.uid(), 'admin', 'accepted', auth.uid(), now(), now())
    on conflict (family_id, email) do nothing;
    admin_family_id := auth.uid();
    inviter_role := 'admin';
  end if;

  if inviter_role is null or inviter_role <> 'admin' then
    raise exception 'not_authorized';
  end if;

  token := encode(extensions.gen_random_bytes(12), 'hex');

  insert into public.family_members (family_id, email, role, status, invite_token, invited_by, invited_at)
  values (admin_family_id, lower(trim(p_email)), 'member', 'pending', token, auth.uid(), now())
  on conflict (family_id, email) do update
    set invite_token = excluded.invite_token,
        status = 'pending',
        invited_by = auth.uid(),
        invited_at = now();

  return query select token;
end;
$$;

revoke all on function public.create_family_invite(text) from public;
grant execute on function public.create_family_invite(text) to authenticated;

-- RPC: accept invite
create or replace function public.accept_family_invite(p_token text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.family_members
  set status = 'accepted',
      accepted_at = now(),
      invite_token = null,
      user_id = auth.uid()
  where invite_token = p_token
    and status = 'pending';

  if not found then
    raise exception 'invalid_or_used_token';
  end if;
end;
$$;

revoke all on function public.accept_family_invite(text) from public;
grant execute on function public.accept_family_invite(text) to authenticated;
