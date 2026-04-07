# Family Web + Cross-Platform Integration Design

**Goal**
Turn the family side into a dedicated Web application without breaking the existing mobile storyteller flow, and make `mobile`, `web`, and `supabase` operate as one system with shared auth, shared permissions, and shared story data.

**Decision Summary**
The recommended shape is:

1. Keep the current repository focused on the storyteller mobile app.
2. Create a sibling repository `../TimeLog-Web` for the family-facing and admin-facing Next.js app.
3. Treat Supabase schema, RLS policies, RPCs, and generated database types as the only source of truth across both clients.

This keeps the UI stacks independent while still enforcing a single contract. It also avoids mixing Expo-native concerns with Web-only concerns such as SSR auth, browser audio UX, and admin workflows.

## Alternatives Considered

**Option A: Full monorepo with Expo + Next.js**
This gives maximal code sharing, but it is the wrong trade-off here. The mobile app is native-heavy, local-first, and SQLite-centric. The Web app is cloud-first, SSR-oriented, and admin-heavy. Forced co-location would increase build friction and dilute boundaries.

**Option B: Separate apps with a shared backend contract**
This is the recommended option. Mobile and Web evolve independently, while Supabase schema, policies, storage conventions, and generated types provide interoperability.

**Option C: Keep family flows inside the mobile app**
This is no longer aligned with product direction. It constrains the family experience to mobile interaction patterns and makes management workflows unnecessarily weak.

## Product Shape

The system will have two distinct clients:

- `TimeLog-Mobile`: storyteller-first, local-first, voice-first.
- `TimeLog-Web`: family listening, interaction, and management console.

The family Web app is not just a playback shell. It must cover:

- Story feed and story detail.
- Audio playback and transcript view.
- Comments and reactions.
- Family member management.
- Device linking and revocation oversight.
- Story moderation and metadata management.
- Sync and audit visibility for support and trust.

## Architecture

### Client Responsibilities

**Mobile**
- Owns recording, offline queueing, local SQLite state, and sync initiation.
- Writes new recordings locally first, then syncs metadata and files to Supabase.
- Shows family activity back to the storyteller after cloud sync or realtime updates.

**Web**
- Uses Next.js App Router with SSR auth via cookie-based Supabase sessions.
- Reads cloud data directly from Supabase.
- Performs family-side management actions against Supabase tables and RPCs.
- Uses realtime selectively for comments, reactions, and new story availability.

### Backend Responsibilities

**Supabase**
- Auth source for storyteller and family users.
- Postgres source of truth for cloud-visible story metadata and relationships.
- Storage source of truth for synced audio assets and generated derivatives.
- RLS enforcement point for every cross-user read/write.
- Realtime source for incremental updates.

## Contract Model

There is already evidence of a split data model:

- Local mobile SQLite schema exists for `audio_recordings`, `story_reactions`, `activity_events`, and related tables.
- Cloud-facing SQL already exists for `family_members`, `device_codes`, `devices`, and related RPCs.

The design should formalize the contract as follows:

- `audio_recordings` remains the canonical story record.
- Web creates a `Story` view model from `audio_recordings` plus derived fields.
- `story_comments` becomes the canonical discussion entity.
- `story_reactions` remains the lightweight reaction entity.
- `activity_events` is the canonical storyteller-facing activity log.
- `family_members` is the canonical family graph and role table.
- `devices` and `device_codes` remain the linking and revocation primitives.
- `audit_logs` should be added for admin-sensitive actions if not already present.

## Permission Model

Roles must be explicit and enforced at the backend:

- `storyteller`
- `family_admin`
- `family_member`
- `support_admin` only if an operational backoffice is introduced later

The critical rule is that client code never decides final access. The client may hide or disable UI, but only RLS and secure RPCs authorize access.

Required access guarantees:

- A storyteller can read and manage their own stories.
- Linked family members can read only stories shared into their family scope.
- Family admins can invite, revoke, and manage family membership.
- Unlinked users cannot fetch story metadata, transcripts, or signed audio URLs.

## Storage Model

Audio objects should use a stable owner-scoped storage path convention:

- `{storyteller_user_id}/{recording_id}.{ext}`

This aligns upload, deletion, and RLS reasoning across clients. Web must never assume public audio URLs. It should request signed URLs or go through controlled media access helpers.

## Web Information Architecture

The Web app should launch with six top-level areas:

1. `Overview`
   Health cards, new stories, unread comments, recent reactions, recent sync failures.
2. `Stories`
   Search, filter, sort, list, timeline, bulk actions, playback, transcript, metadata.
3. `Interactions`
   Comments inbox, reaction stream, unresolved items, mention or reply support if added.
4. `Family`
   Members, invites, roles, accepted vs pending state, permission changes.
5. `Devices`
   Active devices, recent link events, revoke device, suspicious access visibility.
6. `Settings`
   Account, notification preferences, family profile, storage policy, data export, deletion.

## Mobile Changes

The mobile app should not immediately delete all family-related code. Phase 1 is containment:

- Remove or hide family-login-first entry points from user-facing flows.
- Keep device-code generation for storyteller linking.
- Keep storyteller-facing family activity surfaces.
- Remove family-only screens only after equivalent Web workflows are live.
- Refactor role handling so mobile no longer behaves like a family primary client.

## Realtime Strategy

Realtime is useful, but it is not the system backbone.

- Use realtime for comments, reactions, new synced story visibility, and device status refresh.
- Do not use realtime to replace initial SSR or canonical query loading.
- Use filtered subscriptions sparingly because change throughput and authorization overhead scale with subscriber count.

## Error Handling

The system must distinguish failure classes:

- Mobile local write failure: block recording or local update, never fake success.
- Mobile cloud sync failure: keep optimistic local state, surface retryable sync state.
- Web read authorization failure: redirect or render explicit access-denied state.
- Web management mutation failure: fail closed, log audit event where appropriate.
- Storage access failure: signed URL or access policy issue, never expose bucket internals.

## Acceptance Standard

The migration is only accepted when all of the following are true:

1. A storyteller can create and sync a story on mobile, and that story appears on the correct family Web account.
2. A family user can comment or react on Web, and the storyteller sees the resulting activity on mobile.
3. Family membership and device-link changes on Web immediately affect accessible data.
4. An unlinked user cannot read story metadata, transcript data, or audio content.
5. Story deletion, restore, and metadata edits remain consistent across mobile, web, and Supabase.
6. RLS evidence exists for storyteller access, linked family access, and unlinked denial.

## Delivery Recommendation

Build this in three tracks that converge on one acceptance gate:

- Track 1: Supabase contract hardening.
- Track 2: Mobile storyteller cleanup and contract alignment.
- Track 3: Web console implementation.

The wrong sequence is to polish Web UI before contract hardening. The right sequence is to lock the backend contract first, then align mobile behavior, then build the Web experience on top of stable rules.
