-- Supabase RLS contract for cloud-visible story records.
-- This file is the authoritative policy reference for cross-platform access.
-- It reflects the current family membership model in `public.family_members`:
--   - `family_id` identifies the storyteller-owned family space
--   - `user_id` identifies an accepted authenticated member of that family
--   - `role` is `admin` or `member`
--   - `status` is `pending` or `accepted`
--
-- Story access rule:
--   - storytellers manage their own rows
--   - accepted family members can read synced, non-deleted rows owned by that storyteller

alter table public.audio_recordings enable row level security;

drop policy if exists "audio_recordings_select_owner" on public.audio_recordings;
create policy "audio_recordings_select_owner"
  on public.audio_recordings
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "audio_recordings_insert_owner" on public.audio_recordings;
create policy "audio_recordings_insert_owner"
  on public.audio_recordings
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "audio_recordings_update_owner" on public.audio_recordings;
create policy "audio_recordings_update_owner"
  on public.audio_recordings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "audio_recordings_delete_owner" on public.audio_recordings;
create policy "audio_recordings_delete_owner"
  on public.audio_recordings
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "audio_recordings_select_linked_family" on public.audio_recordings;
create policy "audio_recordings_select_linked_family"
  on public.audio_recordings
  for select
  to authenticated
  using (
    sync_status = 'synced'
    and deleted_at is null
    and exists (
      select 1
      from public.family_members fm
      where fm.family_id = public.audio_recordings.user_id
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );

-- Verification guide:
-- 1. storyteller can select all own rows, including queued/failed/deleted variants
-- 2. accepted family member can select only synced + non-deleted storyteller rows
-- 3. unlinked user receives zero rows for the storyteller's recording ids
