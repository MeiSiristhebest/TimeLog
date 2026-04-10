# RLS End-to-End Verification Runbook

## Purpose
Generate reproducible, environment-backed RLS evidence for:
- senior self-access
- linked family access
- unlinked user denial
- senior activity feed access via `activity_events`

## Authoritative Policy References
- `drizzle/policies/supabase-audio-recordings-rls.sql`
- `drizzle/policies/supabase-story-comments.sql`
- `drizzle/policies/supabase-family-invites.sql`
- `drizzle/policies/supabase-device-codes.sql`
- `drizzle/policies/supabase-activity-events.sql`
- `docs/delivery/2026-04-07-family-web-contract-checklist.md`

## Required Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `RLS_SENIOR_EMAIL`
- `RLS_SENIOR_PASSWORD`
- `RLS_FAMILY_EMAIL`
- `RLS_FAMILY_PASSWORD`
- `RLS_INTRUDER_EMAIL`
- `RLS_INTRUDER_PASSWORD`
- `RLS_EXPECTED_SHARED_STORY_ID`

## Execute
`npm run security:rls:e2e`

## Output
- `docs/delivery/2026-02-10-rls-e2e-evidence.md`

## Pass Criteria
- `RLS-01` PASS
- `RLS-02` PASS
- `RLS-03` PASS
- `RLS-04` PASS

## Additional Cross-Platform Checks After RLS Run
- Confirm `public.activity_events` is readable only by the target storyteller account
- Confirm a linked family user can mutate `story_comments` / `story_reactions` but cannot query unrelated stories
- Confirm the Web player only receives signed URLs through the protected route:
  [route.ts](d:/developWorkPlaces/Senior%20Project/TimeLog-Web/src/app/api/stories/[id]/playback/route.ts)
