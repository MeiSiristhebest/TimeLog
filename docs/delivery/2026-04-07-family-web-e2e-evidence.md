# Family Web Interoperability Evidence

This document separates what has already been verified in code from the steps that still require a live Supabase project, real accounts, and manual cross-device execution.

## Automated Evidence Completed

### Current Repo
- `npx jest src/features/story-gallery/services/storyCommentsService.test.ts src/features/home/services/interactionSyncService.test.ts src/features/story-gallery/services/commentReadService.test.ts`
- `npx eslint src/features/home/services/activityService.ts src/features/home/services/interactionSyncService.ts src/features/home/hooks/useHomeLogic.ts src/features/home/screens/HomeTabScreen.tsx src/features/story-gallery/screens/StoryDetailScreen.tsx src/features/story-gallery/screens/StoryCommentsScreen.tsx src/features/story-gallery/hooks/useStoryComments.ts src/features/story-gallery/services/storyCommentsService.ts src/features/app/navigation/routes.ts src/features/app/navigation/rootStackConfig.ts app/story/comments.tsx`

### Web Repo
- `npm test -- src/features/stories/playback.test.ts src/features/stories/queries.test.ts src/features/realtime/subscriptions.test.ts`
- `npm run lint`
- `npm run build`

## Local Implementation Status

### Done in Code
- Cloud `activity_events` fact-table migration and trigger contract exist
- Mobile sync prefers `activity_events` and only falls back to legacy reconstruction if cloud contract is unavailable
- Mobile has a dedicated story comments detail route and unread/read closure
- Web player supports signed URL refresh and richer buffering/waveform state
- Web dashboard pages now support low-volume realtime refresh while keeping SSR as the initial source

### Still Requires Live Environment Execution
- Applying Supabase migrations to the real project
- Regenerating shared Supabase types from the real schema
- Running RLS evidence against real users
- Multi-account manual verification across mobile + web

## Manual Acceptance Matrix

### Scenario 1: Mobile Create And Sync To Web
- Storyteller signs into mobile
- Record and save a new story
- Confirm upload lands in `audio-recordings/{storyteller_user_id}/{recording_id}.{ext}`
- Confirm `audio_recordings` row exists in Supabase
- Confirm family Web account sees the story in `/stories`

Status: `Pending manual execution`

### Scenario 2: Web Comment To Mobile Activity
- Family Web user opens story detail
- Submit a comment
- Confirm `story_comments` row exists
- Confirm `activity_events` row exists with `type = comment`
- Confirm mobile home shows unread activity
- Confirm mobile comments detail shows the comment

Status: `Pending manual execution`

### Scenario 3: Web Reaction To Mobile Activity
- Family Web user hearts a story
- Confirm `story_reactions` row exists
- Confirm `activity_events` row exists with `type = reaction`
- Confirm mobile home unread indicator updates

Status: `Pending manual execution`

### Scenario 4: Membership Or Device Revoke
- Revoke a device or remove a family member from Web
- Confirm access is removed without client-side bypass
- Confirm revoked actor cannot fetch story detail or signed playback URL

Status: `Pending manual execution`

### Scenario 5: Intruder Denial
- Sign in with an unlinked account
- Attempt to read stories, comments, reactions, and playback route
- Confirm RLS denies access

Status: `Pending manual execution`

## Manual Work Remaining For User

1. Apply Supabase migrations, especially:
   [20260407_activity_events_fact_table.sql](d:/developWorkPlaces/Senior%20Project/TimeLog/supabase/migrations/20260407_activity_events_fact_table.sql)
2. Regenerate shared DB types with real project credentials:
   [generate-supabase-types.ps1](d:/developWorkPlaces/Senior%20Project/TimeLog/scripts/generate-supabase-types.ps1)
3. Run the live RLS evidence command from the runbook:
   [2026-02-10-rls-e2e-runbook.md](d:/developWorkPlaces/Senior%20Project/TimeLog/docs/delivery/2026-02-10-rls-e2e-runbook.md)
4. Execute the multi-account mobile/web acceptance matrix above and attach screenshots, row proofs, and storage proofs
