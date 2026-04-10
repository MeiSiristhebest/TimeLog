-- Activity events become the authoritative cloud fact table for senior-facing
-- family interactions. This migration aligns structure, RLS, and triggers so
-- comment/reaction activity is written server-side instead of reconstructed by
-- the mobile client.

alter table if exists public.activity_events
  add column if not exists type text,
  add column if not exists story_id uuid,
  add column if not exists actor_user_id uuid,
  add column if not exists target_user_id uuid,
  add column if not exists read_at bigint,
  add column if not exists synced_at bigint;

alter table if exists public.activity_events
  alter column metadata type jsonb
  using case
    when metadata is null then '{}'::jsonb
    when btrim(metadata::text, '"') = '' then '{}'::jsonb
    else metadata::jsonb
  end;

alter table if exists public.activity_events
  alter column metadata set default '{}'::jsonb;

update public.activity_events
set metadata = '{}'::jsonb
where metadata is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activity_events'
      and column_name = 'activity_type'
  ) then
    update public.activity_events
    set type = activity_type
    where type is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activity_events'
      and column_name = 'related_record_id'
  ) then
    update public.activity_events
    set story_id = related_record_id
    where story_id is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activity_events'
      and column_name = 'senior_user_id'
  ) then
    update public.activity_events
    set target_user_id = senior_user_id
    where target_user_id is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activity_events'
      and column_name = 'user_id'
  ) then
    update public.activity_events
    set actor_user_id = user_id
    where actor_user_id is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activity_events'
      and column_name = 'is_read'
  ) then
    update public.activity_events
    set read_at = coalesce(read_at, extract(epoch from created_at)::bigint * 1000)
    where is_read = true;
  end if;
end $$;

alter table public.activity_events
  alter column type set not null,
  alter column story_id set not null,
  alter column actor_user_id set not null,
  alter column target_user_id set not null,
  alter column metadata set not null;

alter table public.activity_events
  drop constraint if exists activity_events_story_id_fkey,
  add constraint activity_events_story_id_fkey
    foreign key (story_id) references public.audio_recordings(id) on delete cascade,
  drop constraint if exists activity_events_actor_user_id_fkey,
  add constraint activity_events_actor_user_id_fkey
    foreign key (actor_user_id) references auth.users(id) on delete cascade,
  drop constraint if exists activity_events_target_user_id_fkey,
  add constraint activity_events_target_user_id_fkey
    foreign key (target_user_id) references auth.users(id) on delete cascade;

alter table public.activity_events enable row level security;

drop policy if exists "Seniors view their activities" on public.activity_events;
drop policy if exists "Users can view their own activity" on public.activity_events;
drop policy if exists "Family can view senior's activities" on public.activity_events;
drop policy if exists "Users can view activities for their stories" on public.activity_events;
drop policy if exists "activity_events_select_target" on public.activity_events;
drop policy if exists "activity_events_update_target" on public.activity_events;

create policy "activity_events_select_target"
  on public.activity_events
  for select
  to authenticated
  using (target_user_id = auth.uid());

create policy "activity_events_update_target"
  on public.activity_events
  for update
  to authenticated
  using (target_user_id = auth.uid())
  with check (target_user_id = auth.uid());

create index if not exists idx_activity_events_target_user
  on public.activity_events(target_user_id, read_at, created_at desc);

create index if not exists idx_activity_events_story
  on public.activity_events(story_id, created_at desc);

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

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'activity_events'
  ) then
    execute 'alter publication supabase_realtime add table public.activity_events';
  end if;
end $$;
