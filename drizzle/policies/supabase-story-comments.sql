-- Supabase contract for story comments and comment access.
-- This file keeps the cloud discussion model aligned across mobile and web.
--
-- Canonical table shape:
--   id uuid primary key
--   story_id uuid references public.audio_recordings(id) on delete cascade
--   user_id uuid references auth.users(id) on delete cascade
--   content text not null
--   created_at timestamptz not null default now()
--   updated_at timestamptz not null default now()
--
-- Access rule:
--   - storytellers can read comments on their own stories
--   - accepted family members can read and create comments on accessible stories
--   - comment authors can update/delete only their own comments

create table if not exists public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.audio_recordings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 1000),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists story_comments_story_id_idx on public.story_comments (story_id);
create index if not exists story_comments_user_id_idx on public.story_comments (user_id);
create index if not exists story_comments_created_at_idx on public.story_comments (created_at);

create or replace function public.update_story_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists update_story_comments_updated_at on public.story_comments;
create trigger update_story_comments_updated_at
  before update on public.story_comments
  for each row
  execute function public.update_story_comments_updated_at();

alter table public.story_comments enable row level security;

drop policy if exists "story_comments_select_accessible" on public.story_comments;
create policy "story_comments_select_accessible"
  on public.story_comments
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.audio_recordings ar
      where ar.id = public.story_comments.story_id
        and ar.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.audio_recordings ar
      join public.family_members fm on fm.family_id = ar.user_id
      where ar.id = public.story_comments.story_id
        and ar.sync_status = 'synced'
        and ar.deleted_at is null
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );

drop policy if exists "story_comments_insert_linked_family" on public.story_comments;
create policy "story_comments_insert_linked_family"
  on public.story_comments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.audio_recordings ar
      join public.family_members fm on fm.family_id = ar.user_id
      where ar.id = public.story_comments.story_id
        and ar.sync_status = 'synced'
        and ar.deleted_at is null
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );

drop policy if exists "story_comments_update_own" on public.story_comments;
create policy "story_comments_update_own"
  on public.story_comments
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "story_comments_delete_own" on public.story_comments;
create policy "story_comments_delete_own"
  on public.story_comments
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Realtime should include this table when deployed:
--   alter publication supabase_realtime add table public.story_comments;
