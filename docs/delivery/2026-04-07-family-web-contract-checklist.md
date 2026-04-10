# Family Web Contract Checklist

This checklist defines the backend contract that both `TimeLog-Mobile` and `TimeLog-Web` must share. If any item here differs from the live Supabase project, the system is not ready for cross-platform delivery.

## Canonical Tables

- `public.audio_recordings`
  Required fields: `id`, `user_id`, `title`, `duration_ms`, `started_at`, `deleted_at`, `sync_status`, `upload_path`, `upload_format`, `transcription`, `is_favorite`
- `public.story_comments`
  Required fields: `id`, `story_id`, `user_id`, `content`, `created_at`, `updated_at`
- `public.story_reactions`
  Required fields: `id`, `story_id`, `user_id`, `reaction_type`, `created_at`
- `public.activity_events`
  Required fields: `id`, `type`, `story_id`, `actor_user_id`, `target_user_id`, `metadata`, `created_at`, `read_at`, `synced_at`
- `public.family_members`
  Required fields: `id`, `family_id`, `email`, `user_id`, `role`, `status`, `invite_token`, `invited_by`, `invited_at`, `accepted_at`
- `public.devices`
  Required fields: `id`, `family_user_id`, `device_name`, `created_at`, `last_seen_at`, `revoked_at`
- `public.device_codes`
  Required fields: `id`, `family_user_id`, `code`, `created_at`, `expires_at`, `used_at`, `revoked_at`

## Canonical RPCs

- `public.generate_device_code()`
- `public.list_family_devices()`
- `public.revoke_device(uuid)`
- `public.create_family_invite(text)`
- `public.accept_family_invite(text)`

## Storage Contract

- Bucket: `audio-recordings`
- Bucket visibility: private
- Object path convention: `{storyteller_user_id}/{recording_id}.{ext}`
- Allowed access:
  storytellers manage their own objects
- Allowed access:
  accepted family members may read only linked storyteller objects
- Web playback rule:
  never rely on public URLs; use signed URLs or equivalent protected access helpers

## RLS Contract

- `audio_recordings`
  Owner can `select`, `insert`, `update`, `delete`
- `audio_recordings`
  Accepted family members can `select` only rows where `sync_status = 'synced'` and `deleted_at is null`
- `story_comments`
  Accepted family members can `select` and `insert` comments for accessible stories
- `story_comments`
  Comment authors can `update` and `delete` only their own rows
- `story_reactions`
  Accepted family members can `select` and `insert` reactions for accessible stories
- `story_reactions`
  Reaction authors can `delete` only their own rows
- `activity_events`
  Target storyteller can `select` and `update` read state only on their own activity rows
- `activity_events`
  Comment and reaction rows are created by server-side triggers, not by mobile-side reconstruction
- `family_members`
  Accepted members can read their own family graph according to `drizzle/policies/supabase-family-invites.sql`
- `devices` and `device_codes`
  Access is restricted to the authenticated owner according to `drizzle/policies/supabase-device-codes.sql`

## Generated Type Contract

- Source of truth: Supabase CLI generated TypeScript types
- Mobile target: `src/types/supabase.generated.ts`
- Web target: `../TimeLog-Web/src/types/supabase.generated.ts`
- Rule:
  do not hand-edit generated database types

## Verification Checklist

- `npm run security:rls:e2e` passes for storyteller, linked family member, and intruder denial
- A synced mobile story appears in the correct family Web account
- A Web comment produces visible storyteller activity on mobile
- A revoked member or device loses access without client-side cache bypass
- A deleted story no longer appears to family accounts
- `public.activity_events` is in the `supabase_realtime` publication
- Web detail playback is served only through a signed URL refresh path, never a public bucket URL
