-- Supabase contract for authoritative story activity events.
-- This turns activity_events into the cloud fact table for senior-facing
-- comment/reaction activity so mobile no longer has to reconstruct the feed
-- from story_comments and story_reactions on every sync.

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('comment', 'reaction', 'story_share')),
  story_id uuid not null references public.audio_recordings(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  read_at bigint,
  synced_at bigint
);

create index if not exists activity_events_target_user_read_idx
  on public.activity_events (target_user_id, read_at, created_at desc);

create index if not exists activity_events_story_created_idx
  on public.activity_events (story_id, created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists "activity_events_select_target" on public.activity_events;
create policy "activity_events_select_target"
  on public.activity_events
  for select
  to authenticated
  using (target_user_id = auth.uid());

drop policy if exists "activity_events_update_target" on public.activity_events;
create policy "activity_events_update_target"
  on public.activity_events
  for update
  to authenticated
  using (target_user_id = auth.uid())
  with check (target_user_id = auth.uid());

create or replace function public.resolve_activity_actor_name(p_user_id uuid)
returns text
language sql
stable
as $$
  select coalesce(
    nullif(trim(p.display_name), ''),
    nullif(trim(p.full_name), ''),
    'Family Member'
  )
  from public.profiles p
  where p.id = p_user_id
  limit 1;
$$;

create or replace function public.upsert_comment_activity_event()
returns trigger
language plpgsql
security definer
as $$
declare
  story_owner_id uuid;
  story_title text;
begin
  select
    ar.user_id,
    coalesce(nullif(trim(ar.title), ''), 'Story')
  into story_owner_id, story_title
  from public.audio_recordings ar
  where ar.id = new.story_id;

  if story_owner_id is null or story_owner_id = new.user_id then
    return new;
  end if;

  insert into public.activity_events (
    id,
    type,
    story_id,
    actor_user_id,
    target_user_id,
    metadata,
    created_at,
    synced_at
  )
  values (
    new.id,
    'comment',
    new.story_id,
    new.user_id,
    story_owner_id,
    jsonb_build_object(
      'actorName', coalesce(public.resolve_activity_actor_name(new.user_id), 'Family Member'),
      'storyTitle', story_title,
      'commentId', new.id,
      'commentText', new.content
    ),
    new.created_at,
    extract(epoch from now())::bigint * 1000
  )
  on conflict (id) do update
  set
    metadata = excluded.metadata,
    created_at = excluded.created_at,
    synced_at = excluded.synced_at;

  return new;
end;
$$;

create or replace function public.delete_comment_activity_event()
returns trigger
language plpgsql
security definer
as $$
begin
  delete from public.activity_events
  where id = old.id
    and type = 'comment';

  return old;
end;
$$;

create or replace function public.upsert_reaction_activity_event()
returns trigger
language plpgsql
security definer
as $$
declare
  story_owner_id uuid;
  story_title text;
begin
  select
    ar.user_id,
    coalesce(nullif(trim(ar.title), ''), 'Story')
  into story_owner_id, story_title
  from public.audio_recordings ar
  where ar.id = new.story_id;

  if story_owner_id is null or story_owner_id = new.user_id then
    return new;
  end if;

  insert into public.activity_events (
    id,
    type,
    story_id,
    actor_user_id,
    target_user_id,
    metadata,
    created_at,
    synced_at
  )
  values (
    new.id,
    'reaction',
    new.story_id,
    new.user_id,
    story_owner_id,
    jsonb_build_object(
      'actorName', coalesce(public.resolve_activity_actor_name(new.user_id), 'Family Member'),
      'storyTitle', story_title,
      'reactionType', new.reaction_type
    ),
    new.created_at,
    extract(epoch from now())::bigint * 1000
  )
  on conflict (id) do update
  set
    metadata = excluded.metadata,
    created_at = excluded.created_at,
    synced_at = excluded.synced_at;

  return new;
end;
$$;

create or replace function public.delete_reaction_activity_event()
returns trigger
language plpgsql
security definer
as $$
begin
  delete from public.activity_events
  where id = old.id
    and type = 'reaction';

  return old;
end;
$$;

drop trigger if exists story_comments_activity_events_upsert on public.story_comments;
create trigger story_comments_activity_events_upsert
  after insert or update on public.story_comments
  for each row
  execute function public.upsert_comment_activity_event();

drop trigger if exists story_comments_activity_events_delete on public.story_comments;
create trigger story_comments_activity_events_delete
  after delete on public.story_comments
  for each row
  execute function public.delete_comment_activity_event();

drop trigger if exists story_reactions_activity_events_upsert on public.story_reactions;
create trigger story_reactions_activity_events_upsert
  after insert or update on public.story_reactions
  for each row
  execute function public.upsert_reaction_activity_event();

drop trigger if exists story_reactions_activity_events_delete on public.story_reactions;
create trigger story_reactions_activity_events_delete
  after delete on public.story_reactions
  for each row
  execute function public.delete_reaction_activity_event();

-- Realtime should include this table when deployed:
--   alter publication supabase_realtime add table public.activity_events;
