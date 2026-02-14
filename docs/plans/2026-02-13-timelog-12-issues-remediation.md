# TimeLog 12 Issues Remediation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 12 user-reported production issues across sync, transcript, playback, profile, settings, notifications, deleted-items UX, and tab navigation consistency.

**Architecture:** Keep Local-First behavior as source of truth, but make cloud-sync eligibility explicit and truthful in UI. Remove mock/placeholder paths on critical screens, wire existing services end-to-end, and standardize interaction patterns (alerts, navigation reset, settings actions) across Me/Listen/Record.

**Tech Stack:** Expo SDK 54, Expo Router v6, Zustand v5, React Query v5, Drizzle + expo-sqlite, Supabase (Auth/Storage/Realtime), expo-audio, NativeWind.

---

## 1) Codebase Diagnosis Summary (mapped to your 12 issues)

1. **Upload always failing / fake syncing state**
   - `src/lib/sync-engine/store.ts` uploads to storage path `${recordingId}.ext`.
   - `supabase/migrations/20260115_secure_audio_storage.sql` storage policy expects foldered path with owner id (`storage.foldername(name))[1] == auth.uid()`).
   - Sync queue moves states to `queued/syncing` before eligibility check; anonymous/no-cloud conditions are not surfaced as `local only`.

2. **Story detail transcript still mock**
   - `src/features/story-gallery/screens/StoryDetailScreen.tsx` renders hard-coded paragraph text instead of DB transcript/transcript segments.

3. **Playback route/speaker + exit-stop + comment/edit experience**
   - `src/features/story-gallery/components/AudioPlayer.tsx` does not reset player on unmount.
   - `src/features/story-gallery/services/playerService.ts` does not configure explicit speaker-first audio mode.
   - `src/features/story-gallery/screens/StoryEditScreen.tsx` initializes empty title/transcript when values are null, no fallback from prompt/segments.
   - `src/features/story-gallery/screens/StoryCommentsScreen.tsx` hard-depends on cloud fetch (`seniorStoryService`), so local-only story comments view is brittle.

4. **Listen card cloud status missing in expected position**
   - `CompactStoryCard.tsx` and `FeaturedStoryCard.tsx` use custom partial status text (synced/syncing only), no unified right-bottom cloud state model for all statuses.

5. **Birthday picker UX poor**
   - `EditProfileScreen.tsx` uses custom increment/decrement date selector instead of installed native picker (`@react-native-community/datetimepicker` already in `package.json`).

6. **Profile edits not reflected / language mismatch / avatar change unreliable**
   - `useProfile` instances are local-state hooks; no shared invalidation event, so Settings header can stay stale.
   - `useHomeLogic.ts` sends `Intl.DateTimeFormat().resolvedOptions().locale` to AI dialog instead of user-selected profile language.
   - `EditProfileScreen.tsx` uses lazy import fallback path for image picker and can silently degrade.

7. **Account & Security actions style inconsistent**
   - `AccountSecurityScreen.tsx` uses destructive `SettingsRow`.
   - `AppSettingsScreen.tsx` uses `HeritageButton` action style.

8. **Notifications “not really implemented”**
   - Settings notifications page writes quiet-hours/settings, but does not fully bridge user toggle with OS permission + push token registration/removal flow.

9. **Deleted items cannot preview**
   - `DeletedItemsList.tsx` row has restore/delete buttons only; no row preview navigation.

10. **About TimeLog route equals Help route**
   - `AppSettingsScreen.tsx` links both “Help & Feedback” and “About TimeLog” to `/(tabs)/settings/about-help`.

11. **Native alert dialogs still present**
   - `AppSettingsScreen.tsx`, `useDeepLinkHandler.ts`, `EditProfileModal.tsx` still call `Alert.alert(...)`.

12. **Tab return keeps stale subpage**
   - `app/(tabs)/_layout.tsx` and custom `HeritageTabBar.tsx` keep nested state; no tab-level reset/pop-to-top behavior for Settings flow.

---

## 2) Implementation Plan (execution order)

### Task 1: Fix cloud sync pipeline and truthful sync state

**Files:**
- Modify: `src/lib/sync-engine/store.ts`
- Modify: `src/lib/sync-engine/queue.ts`
- Modify: `src/features/home/hooks/useHomeLogic.ts`
- Modify: `src/features/story-gallery/components/SyncStatusBadge.tsx`
- Modify: `supabase/functions/hard-delete-account/index.ts` (path compatibility)
- Test: `src/lib/sync-engine/store.test.ts`
- Test: `src/lib/sync-engine/queue.test.ts`

**Steps:**
1. Change storage object path to owner-scoped convention (`${userId}/${recordingId}.${ext}`) compatible with secure storage RLS.
2. Add remote row upsert path for `audio_recordings` before/after upload (avoid “update non-existent row”).
3. Add sync-eligibility guard (`canCloudSync`) so unsupported users/states stay `local` and never show fake `syncing`.
4. Normalize badge copy/states (`local`, `queued`, `syncing`, `synced`, `failed`) and map “ineligible” to explicit local-only message.
5. Update account-deletion storage cleanup logic to handle both legacy and new storage paths.

**Verification:**
- Unit tests for queued->syncing->synced and failed retry.
- Manual: record while online, verify Supabase storage object created and `audio_recordings.sync_status='synced'`.
- Manual: in ineligible mode verify UI remains local-only, no queued item.

### Task 2: Replace detail transcript mock with real data

**Files:**
- Modify: `src/features/story-gallery/screens/StoryDetailScreen.tsx`
- Modify: `src/features/recorder/services/TranscriptSyncService.ts` (read helpers reuse)
- Modify: `src/features/story-gallery/hooks/useStory.ts` or add dedicated `useStoryTranscript` hook
- Test: new `src/features/story-gallery/hooks/useStoryTranscript.test.ts`

**Steps:**
1. Read transcript from `audio_recordings.transcription` first.
2. If absent, merge final segments from `transcript_segments` ordered by `segment_index`.
3. Render empty-state copy when transcript truly unavailable; remove hard-coded mock paragraphs.

**Verification:**
- Story with segments shows actual text.
- Story with edited transcription uses edited value.
- Story with no transcript shows non-mock placeholder.

### Task 3: Playback behavior (speaker route + auto-stop on exit)

**Files:**
- Modify: `src/features/story-gallery/services/playerService.ts`
- Modify: `src/features/story-gallery/components/AudioPlayer.tsx`
- Test: `src/features/story-gallery/services/playerService.test.ts`
- Test: `src/features/story-gallery/store/usePlayerStore.test.ts`

**Steps:**
1. Configure audio mode in player service using `expo-audio` `setAudioModeAsync` with speaker-first route (`shouldRouteThroughEarpiece: false` on Android and silent-mode-safe behavior).
2. Ensure `AudioPlayer` cleanup calls `reset()` on unmount/route leave.
3. Ensure screen blur/unmount always stops playback.

**Verification:**
- Enter/leave story detail while playing: audio stops immediately.
- Playback uses loudspeaker by default on Android/iOS.

### Task 4: Story edit UX/data completeness

**Files:**
- Modify: `src/features/story-gallery/screens/StoryEditScreen.tsx`
- Modify: `src/features/story-gallery/services/storyService.ts`
- Modify: `src/features/story-gallery/screens/StoryDetailScreen.tsx` (entry params consistency)
- Optional cleanup: `src/features/story-gallery/components/EditStorySheet.tsx` (deprecate or align)
- Test: `src/features/story-gallery/services/storyService.test.ts`

**Steps:**
1. Pre-fill title with fallback prompt text when title null.
2. Pre-fill transcript from edited transcription or merged segments.
3. Include full editable fields required by product intent (title, transcript, cover, category/topic).
4. Remove empty-default behavior that causes blank editor.

**Verification:**
- Opening edit always shows existing content, never blank for existing story.
- Save updates reflected in detail and gallery immediately.

### Task 5: Listen card cloud indicator UX

**Files:**
- Modify: `src/features/story-gallery/components/CompactStoryCard.tsx`
- Modify: `src/features/story-gallery/components/FeaturedStoryCard.tsx`
- Reuse: `src/features/story-gallery/components/SyncStatusBadge.tsx`
- Test: `src/features/story-gallery/components/StoryCard.test.tsx` or new card tests

**Steps:**
1. Replace custom per-card status snippets with unified badge component.
2. Place badge at bottom-right for both featured and compact variants.
3. Show all states including failed/local, not just synced/syncing.

**Verification:**
- UI consistent across list variants.
- Status changes reactively after sync transitions.

### Task 6: Edit profile birthday picker with native control

**Files:**
- Modify: `src/features/settings/screens/EditProfileScreen.tsx`
- Optional new: `src/components/ui/heritage/HeritageDatePicker.tsx`
- Test: `src/features/settings/screens/EditProfileScreen.test.tsx` (if exists, otherwise add)

**Steps:**
1. Replace custom month/day/year stepper with `@react-native-community/datetimepicker`.
2. Keep visual style through custom wrapper/modal shell.
3. Preserve min/max date constraints and accessibility touch target.

**Verification:**
- Birthday selection supports fast scroll/spin.
- Date save and display remain stable on both iOS/Android.

### Task 7: Profile consistency (name/language/avatar)

**Files:**
- Modify: `src/features/settings/hooks/useProfile.ts`
- Modify: `src/features/settings/screens/SettingsHomeScreen.tsx`
- Modify: `src/features/home/hooks/useHomeLogic.ts`
- Modify: `src/features/settings/screens/EditProfileScreen.tsx`
- Modify: `app.json` (ensure image picker plugin/permissions if needed)
- Test: `src/features/settings/hooks/useProfile.integration.test.tsx`

**Steps:**
1. Add shared profile invalidation (event/query invalidation) so header updates instantly after edit.
2. Feed AI dialog language from profile language, not system locale.
3. Use robust image picker flow for avatar update and keep local-first avatar persistence.
4. Ensure fallback name display rules do not regress to stale `Storyteller` unexpectedly.

**Verification:**
- Rename immediately reflects on Me home.
- Language switch changes AI opening language behavior.
- Avatar change visible after save and app restart (local at minimum).

### Task 8: Account action style unification

**Files:**
- Modify: `src/features/settings/screens/AccountSecurityScreen.tsx`
- Modify: `src/features/settings/screens/AppSettingsScreen.tsx`
- Optional new shared component: `src/features/settings/components/SettingsAccountActions.tsx`
- Test: `src/features/settings/screens/AccountSecurityScreen.test.tsx`

**Steps:**
1. Use one shared action UI style for `Sign Out`, `Delete Account`, `Switch Account`, `Log Out`.
2. Keep semantics/destructive color while matching hierarchy and spacing.

**Verification:**
- Visual consistency across both pages.

### Task 9: Notifications end-to-end wiring

**Files:**
- Modify: `src/features/settings/hooks/useSettingsLogic.ts`
- Modify: `src/features/settings/screens/NotificationsScreen.tsx`
- Reuse: `src/lib/notifications.ts`
- Reuse: `src/features/notifications/services/pushTokenService.ts`
- Test: `src/features/settings/hooks/useSettingsLogic.test.ts` (new)

**Steps:**
1. Bind “Enable Notifications” toggle to OS permission request path.
2. On enable, register/refresh push token; on disable, unregister token.
3. Keep quiet-hours persistence as existing behavior.

**Verification:**
- Toggle changes permission/token behavior, not only local settings text.

### Task 10: Deleted items preview support

**Files:**
- Modify: `src/features/story-gallery/components/DeletedItemsList.tsx`
- Modify: `src/features/settings/screens/DeletedItemsScreen.tsx`
- Optional: `src/features/story-gallery/screens/StoryDetailScreen.tsx` (read-only mode for deleted)

**Steps:**
1. Make deleted row tappable to preview story detail.
2. Keep restore/delete controls without accidental conflict.
3. If needed, provide deleted-mode detail view (preview + restore CTA).

**Verification:**
- User can open deleted story to preview before restore/delete.

### Task 11: About route split and native alert replacement

**Files:**
- Modify: `src/features/settings/screens/AppSettingsScreen.tsx`
- Modify: `src/features/settings/screens/AboutHelpScreen.tsx`
- Add: `src/features/settings/screens/AboutTimeLogScreen.tsx`
- Add route: `app/(tabs)/settings/about-timelog.tsx`
- Modify: `app/(tabs)/settings/_layout.tsx`
- Modify: `src/features/auth/hooks/useDeepLinkHandler.ts`
- Modify: `src/features/settings/components/EditProfileModal.tsx`

**Steps:**
1. Split “Help & Feedback” and “About TimeLog” into different routes.
2. Replace remaining `Alert.alert` usage with `HeritageAlert`.

**Verification:**
- About and Help navigate to different pages.
- No remaining user-facing native alert dialogs in target flows.

### Task 12: Tab navigation reset behavior

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `src/components/ui/heritage/HeritageTabBar.tsx`
- Optional: add tab screen options (`popToTopOnBlur` / reset on tab press)

**Steps:**
1. Ensure leaving a tab resets nested stack to its root.
2. Specifically enforce Me tab returns to Me home when reselected/switched back.

**Verification:**
- Enter `Me > Settings > subpage`, switch to Listen, return to Me => lands on Me home.
- Same behavior for other tab subpages per expected UX.

---

## 3) Test Strategy (must-pass before merge)

1. `npm run lint`
2. `npm test`
3. Focused tests:
   - `npx jest src/lib/sync-engine/store.test.ts`
   - `npx jest src/features/settings/hooks/useProfile.integration.test.tsx`
   - `npx jest src/features/story-gallery/services/playerService.test.ts`
4. Manual smoke on device/dev-client:
   - Record -> stop -> sync badge transition
   - Story detail transcript render
   - Playback leave-screen stop
   - Edit profile name/language/avatar
   - Notifications toggle
   - Deleted items preview
   - About/Help routes
   - Tab reset behavior

---

## 4) Delivery Order & Risk Control

1. **P0 (Blockers):** Task 1, Task 2, Task 3, Task 7, Task 12.
2. **P1 (High UX):** Task 4, Task 5, Task 10, Task 11.
3. **P2 (Consistency):** Task 6, Task 8, Task 9.
4. Land in small PR slices per task group, each with lint/tests + manual check evidence.

