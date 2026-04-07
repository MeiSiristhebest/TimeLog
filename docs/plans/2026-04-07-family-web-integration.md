# Family Web + Cross-Platform Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a dedicated family Web app and backend contract changes so mobile, web, and Supabase interoperate as one product.

**Architecture:** Keep the current repository as the storyteller mobile client, add a sibling `../TimeLog-Web` Next.js app for the family/admin surface, and make Supabase schema, RLS, storage conventions, and generated types the shared contract. Mobile remains local-first; Web remains cloud-first.

**Tech Stack:** Expo SDK 54, Expo Router v6, TypeScript strict, Drizzle + expo-sqlite, Supabase Auth/Storage/Realtime/Postgres, Next.js App Router, `@supabase/ssr`, Tailwind CSS, shadcn/ui.

---

## Task 1: Freeze the cross-platform contract

**Files:**
- Modify: `drizzle/policies/supabase-family-invites.sql`
- Modify: `drizzle/policies/supabase-device-codes.sql`
- Create: `drizzle/policies/supabase-story-comments.sql`
- Create: `drizzle/policies/supabase-audio-recordings-rls.sql`
- Create: `docs/delivery/2026-04-07-family-web-contract-checklist.md`

**Step 1: Audit existing cloud entities**

Document the current contract around:
- `audio_recordings`
- `family_members`
- `devices`
- `device_codes`
- `story_reactions`
- `story_comments`
- `activity_events`

**Step 2: Normalize storage ownership**

Define and enforce one object path convention:

```text
{storyteller_user_id}/{recording_id}.{ext}
```

**Step 3: Formalize RLS matrix**

Write or refine policies for:
- storyteller self-access
- linked family read access
- family admin membership management
- unlinked user denial

**Step 4: Add contract checklist**

Record the final expected tables, RPCs, policies, and storage rules in `docs/delivery/2026-04-07-family-web-contract-checklist.md`.

**Step 5: Verify**

Run the existing security evidence flow and update coverage if needed:

```bash
npm run security:rls:e2e
```

Expected: storyteller pass, linked family pass, intruder denial pass.

## Task 2: Add or align missing cloud discussion entities

**Files:**
- Create: `drizzle/policies/supabase-story-comments.sql`
- Modify: `src/features/story-gallery/services/commentReadService.ts`
- Modify: `src/features/story-gallery/services/commentRealtimeService.ts`
- Modify: `src/db/schema/storyReactions.ts`
- Test: `src/features/story-gallery/services/commentReadService.test.ts`
- Test: `src/features/story-gallery/services/commentRealtimeService.test.ts`

**Step 1: Define `story_comments` cloud contract**

Include:
- `id`
- `story_id`
- `author_user_id`
- `family_member_id`
- `body`
- `created_at`
- `updated_at`
- `deleted_at`

**Step 2: Align reactions contract**

Ensure `story_reactions` is consistent across local and cloud shape, including actor identity and timestamps.

**Step 3: Align mobile readers**

Make current mobile comment readers tolerant of the final cloud contract.

**Step 4: Verify**

Run focused tests:

```bash
npx jest src/features/story-gallery/services/commentReadService.test.ts
npx jest src/features/story-gallery/services/commentRealtimeService.test.ts
```

Expected: pass.

## Task 3: Add shared generated Supabase types workflow

**Files:**
- Create: `scripts/generate-supabase-types.ps1`
- Create: `src/types/supabase.generated.ts`
- Create: `docs/delivery/2026-04-07-supabase-type-sync.md`
- Create in sibling repo later: `../TimeLog-Web/src/types/supabase.generated.ts`

**Step 1: Add a repeatable generation script**

Use Supabase CLI to generate TypeScript database types from the project schema.

**Step 2: Define copy targets**

The script should write or copy the generated output into:
- `src/types/supabase.generated.ts`
- `../TimeLog-Web/src/types/supabase.generated.ts`

**Step 3: Document the rule**

Only generated types may describe cloud tables. Manual drift is not allowed.

**Step 4: Verify**

Run:

```bash
./scripts/generate-supabase-types.ps1
```

Expected: both projects receive matching generated types.

## Task 4: Align mobile routing so storyteller is the primary client

**Files:**
- Modify: `src/features/app/screens/AppEntryScreen.tsx`
- Modify: `src/features/app/screens/SplashScreen.tsx`
- Modify: `src/features/auth/hooks/useAuthLogic.ts`
- Modify: `src/features/auth/screens/WelcomeScreen.tsx`
- Modify: `src/features/app/navigation/routes.ts`
- Modify: `src/features/settings/screens/SettingsHomeScreen.tsx`

**Step 1: Remove family-first messaging**

Adjust entry and welcome copy so the mobile product clearly centers on the storyteller.

**Step 2: Keep storyteller linking primitives**

Preserve device-code generation and storyteller-visible family activity.

**Step 3: Hide family-only destination flows**

Do not expose mobile screens that imply the family app should live in Expo.

**Step 4: Verify**

Manual smoke:
- fresh app launch goes to storyteller-first flow
- existing storyteller session remains intact
- device-code generation still works

## Task 5: Align mobile sync payloads with the cloud contract

**Files:**
- Modify: `src/lib/sync-engine/queue.ts`
- Modify: `src/lib/sync-engine/store.ts`
- Modify: `src/features/recorder/services/TranscriptSyncService.ts`
- Modify: `src/features/story-gallery/services/storyService.ts`
- Test: `src/lib/sync-engine/queue.test.ts`
- Test: `src/lib/sync-engine/store.test.ts`

**Step 1: Normalize metadata payloads**

Ensure uploads, metadata updates, deletes, and transcript sync all use the same story identifiers and storage paths expected by Supabase.

**Step 2: Align delete and restore behavior**

Cloud and local operations must map to the same story record lifecycle.

**Step 3: Verify**

Run:

```bash
npx jest src/lib/sync-engine/queue.test.ts
npx jest src/lib/sync-engine/store.test.ts
```

Manual expected result:
- create story on mobile
- sync reaches Supabase
- story is visible to linked family accounts

## Task 6: Stand up the Web app shell

**Files:**
- Create sibling repo: `../TimeLog-Web`
- Create: `../TimeLog-Web/app/(auth)/login/page.tsx`
- Create: `../TimeLog-Web/app/(dashboard)/layout.tsx`
- Create: `../TimeLog-Web/app/(dashboard)/page.tsx`
- Create: `../TimeLog-Web/src/lib/supabase/server.ts`
- Create: `../TimeLog-Web/src/lib/supabase/client.ts`
- Create: `../TimeLog-Web/src/middleware.ts`
- Create: `../TimeLog-Web/components/ui/*`

**Step 1: Scaffold Next.js App Router app**

Use a dedicated repo and keep it independent from Expo tooling.

**Step 2: Add SSR auth**

Use `@supabase/ssr` with cookies for server and client Supabase instances.

**Step 3: Add base design system**

Use Tailwind and shadcn/ui, but theme it for a premium archive-management feel rather than a default dashboard look.

**Step 4: Verify**

Run in the sibling repo:

```bash
npm install
npm run dev
```

Expected: unauthenticated users are redirected to login and authenticated users reach the dashboard shell.

## Task 7: Build the Web story center

**Files:**
- Create: `../TimeLog-Web/app/(dashboard)/stories/page.tsx`
- Create: `../TimeLog-Web/app/(dashboard)/stories/[id]/page.tsx`
- Create: `../TimeLog-Web/src/features/stories/queries.ts`
- Create: `../TimeLog-Web/src/features/stories/components/story-feed.tsx`
- Create: `../TimeLog-Web/src/features/stories/components/story-player.tsx`
- Create: `../TimeLog-Web/src/features/stories/components/story-transcript.tsx`

**Step 1: Build story list**

Support:
- search
- filter
- sort
- sync state visibility
- member visibility scope

**Step 2: Build story detail**

Show:
- title
- speaker identity
- recording date
- duration
- transcript
- reactions
- comments
- playback

**Step 3: Verify**

Expected:
- synced story appears in Web
- detail page loads with protected access
- audio plays only for authorized family users

## Task 8: Build the Web interactions center

**Files:**
- Create: `../TimeLog-Web/app/(dashboard)/interactions/page.tsx`
- Create: `../TimeLog-Web/src/features/interactions/queries.ts`
- Create: `../TimeLog-Web/src/features/interactions/components/comment-thread.tsx`
- Create: `../TimeLog-Web/src/features/interactions/components/reaction-stream.tsx`
- Modify: `src/features/home/services/activityService.ts`

**Step 1: Add comment creation and moderation**

Family users must be able to create, edit, and soft-delete their own comments as permitted.

**Step 2: Add reaction workflows**

At minimum, support heart reactions with clear idempotent behavior.

**Step 3: Feed storyteller activity**

Ensure Web mutations produce activity records visible to mobile.

**Step 4: Verify**

Manual expected result:
- Web comment appears in the story thread
- mobile storyteller sees new activity
- unread state updates correctly

## Task 9: Build family and device administration

**Files:**
- Create: `../TimeLog-Web/app/(dashboard)/family/page.tsx`
- Create: `../TimeLog-Web/app/(dashboard)/devices/page.tsx`
- Create: `../TimeLog-Web/src/features/family/actions.ts`
- Create: `../TimeLog-Web/src/features/devices/actions.ts`
- Reuse contract: `drizzle/policies/supabase-family-invites.sql`
- Reuse contract: `drizzle/policies/supabase-device-codes.sql`

**Step 1: Family management**

Support:
- invite member
- accept state visibility
- role change if policy allows
- revoke or remove member

**Step 2: Device oversight**

Support:
- list devices
- last seen
- revoke access
- show active vs revoked state

**Step 3: Verify**

Manual expected result:
- invite is created
- accepted family member gains access
- revoked device can no longer act as valid linked access

## Task 10: Add Web settings and audit visibility

**Files:**
- Create: `../TimeLog-Web/app/(dashboard)/settings/page.tsx`
- Create: `../TimeLog-Web/app/(dashboard)/audit/page.tsx`
- Create: `../TimeLog-Web/src/features/settings/actions.ts`
- Create: `../TimeLog-Web/src/features/audit/queries.ts`
- Create if needed: `drizzle/policies/supabase-audit-logs.sql`

**Step 1: Account and notification settings**

Include family profile and notification preferences.

**Step 2: Audit visibility**

Capture and render sensitive actions:
- invite created
- invite accepted
- device revoked
- story deleted
- membership removed

**Step 3: Verify**

Expected:
- admin actions leave visible audit traces
- non-admin users do not see restricted audit data

## Task 11: Add realtime where it helps

**Files:**
- Create: `../TimeLog-Web/src/features/realtime/subscriptions.ts`
- Modify: `../TimeLog-Web/src/features/stories/components/story-feed.tsx`
- Modify: `../TimeLog-Web/src/features/interactions/components/comment-thread.tsx`
- Modify: `src/features/home/services/activityService.ts`

**Step 1: Subscribe to comments and reactions**

Use filtered realtime subscriptions only for low-volume, user-scoped streams.

**Step 2: Keep SSR as source for initial load**

Do not replace initial queries with realtime-first behavior.

**Step 3: Verify**

Expected:
- new comment appears without full refresh
- new reaction count refreshes
- mobile storyteller sees resulting activity after sync or realtime propagation

## Task 12: Prove the acceptance standard end-to-end

**Files:**
- Modify: `docs/delivery/2026-02-10-rls-e2e-runbook.md`
- Create: `docs/delivery/2026-04-07-family-web-e2e-evidence.md`
- Create: `tests/integration/family-web-interoperability.test.ts` if current test harness allows
- Create later in sibling repo: `../TimeLog-Web/tests/e2e/*.spec.ts`

**Step 1: Define end-to-end scenarios**

Required scenarios:
- mobile create and sync -> web visibility
- web comment -> mobile activity visibility
- web reaction -> mobile activity visibility
- membership revoke -> access removal
- intruder denial

**Step 2: Run evidence collection**

At minimum collect:
- RLS results
- screenshots
- storage object proof
- database row proof
- UI proof from both clients

**Step 3: Verify**

The feature is not complete until all acceptance criteria from the design document pass.

---

## Delivery Order

1. Contract hardening: Tasks 1-3
2. Mobile alignment: Tasks 4-5
3. Web foundation: Tasks 6-7
4. Management workflows: Tasks 8-10
5. Realtime polish and acceptance evidence: Tasks 11-12

## Required Verification Before Merge

Run in the current repo:

```bash
npm run lint
npm test
npm run security:rls:e2e
```

Run in `../TimeLog-Web` once scaffolded:

```bash
npm run lint
npm test
npm run build
```

Manual checks:
- mobile story creation and sync
- web protected story playback
- web comment and reaction
- mobile activity receipt
- invite acceptance and revocation
- intruder denial
