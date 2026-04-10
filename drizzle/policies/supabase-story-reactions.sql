-- Supabase contract for story reactions.
-- Reaction access follows the same linked-family rules as story comments:
--   - storytellers can read reactions on their own stories
--   - accepted family members can create and read reactions on linked synced stories
--   - reaction authors can delete their own reactions

create table if not exists public.story_reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.audio_recordings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null default 'heart',
  created_at timestamp with time zone not null default now(),
  unique (story_id, user_id, reaction_type)
);

create index if not exists story_reactions_story_id_idx on public.story_reactions (story_id);
create index if not exists story_reactions_user_id_idx on public.story_reactions (user_id);

alter table public.story_reactions enable row level security;

drop policy if exists "story_reactions_select_accessible" on public.story_reactions;
create policy "story_reactions_select_accessible"
  on public.story_reactions
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.audio_recordings ar
      where ar.id = public.story_reactions.story_id
        and ar.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.audio_recordings ar
      join public.family_members fm on fm.family_id = ar.user_id
      where ar.id = public.story_reactions.story_id
        and ar.sync_status = 'synced'
        and ar.deleted_at is null
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );

drop policy if exists "story_reactions_insert_linked_family" on public.story_reactions;
create policy "story_reactions_insert_linked_family"
  on public.story_reactions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.audio_recordings ar
      join public.family_members fm on fm.family_id = ar.user_id
      where ar.id = public.story_reactions.story_id
        and ar.sync_status = 'synced'
        and ar.deleted_at is null
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );

drop policy if exists "story_reactions_delete_own" on public.story_reactions;
create policy "story_reactions_delete_own"
  on public.story_reactions
  for delete
  to authenticated
  using (user_id = auth.uid());
