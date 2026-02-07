# Code Simplifier Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor `app/`, `src/`, and `tests/` to match project standards (function declarations for top-level exports,
explicit return types, no nested ternary chains, ESM imports over non-asset require, kebab-case utilities) without
changing behavior.

**Architecture:** Preserve Expo Router boundaries (routes in `app/`, logic in `src/` services/hooks). External I/O stays
inside `src/features/*/services/*.ts`. Asset `require(...)` remains for React Native static assets; non-asset requires
are converted to ESM/dynamic import where appropriate. Try/catch blocks are narrowed to true I/O boundaries.

**Tech Stack:** Expo Router v6, React Native 0.81 (SDK 54), TypeScript 5.x (strict), NativeWind v5, Jest, Zustand, React
Query.

---

### Task 1: Refactor `app/` screens and helpers

**Files:**

- Modify: `app/(tabs)/gallery.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/topics.tsx`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(tabs)/family/_layout.tsx`
- Modify: `app/(tabs)/family/index.tsx`
- Modify: `app/(tabs)/family/ask-question.tsx`
- Modify: `app/(tabs)/settings/_layout.tsx`
- Modify: `app/(tabs)/settings/index.tsx`
- Modify: `app/(tabs)/settings/notifications.tsx`
- Modify: `app/(tabs)/settings/deleted-items.tsx`
- Modify: `app/_layout.tsx`
- Modify: `app/+not-found.tsx`
- Modify: `app/+html.tsx`
- Modify: `app/index.tsx`
- Modify: `app/welcome.tsx`
- Modify: `app/splash.tsx`
- Modify: `app/help.tsx`
- Modify: `app/ask-question.tsx`
- Modify: `app/accept-invite.tsx`
- Modify: `app/details.tsx`
- Modify: `app/consent-review.tsx`
- Modify: `app/device-code.tsx`
- Modify: `app/device-management.tsx`
- Modify: `app/family-members.tsx`
- Modify: `app/role.tsx`
- Modify: `app/login.tsx`
- Modify: `app/invite.tsx`
- Modify: `app/recovery-code.tsx`
- Modify: `app/family-story/[id].tsx`
- Modify: `app/story/[id].tsx`
- Modify: `app/story-comments/[id].tsx`

**Step 1: Write the failing check (rg patterns)**

```bash
rg -n "export const .*=>" app
rg -n "\?.*\?.*:" app
rg -n "^function [A-Z]" app
```

**Step 2: Run check to verify it fails**

Run the commands above.
Expected: non-empty matches for arrow exports and nested ternaries.

**Step 3: Apply minimal refactor**

- Convert top-level arrow components to `function` declarations with explicit return types.
- Add `: JSX.Element` return types to all exported screen components and helper components.
- Replace nested ternaries (e.g., weather icon, status labels) with helper functions or `switch`.

Example transformation:

```tsx
// Before
export const ScreenContent = ({ title }: Props) => { ... };

// After
export function ScreenContent({ title }: Props): JSX.Element { ... }
```

**Step 4: Run check to verify it passes**

```bash
rg -n "export const .*=>" app
rg -n "\?.*\?.*:" app
```

Expected: no remaining nested ternary chains and no exported arrow declarations in `app/`.

**Step 5: Commit**

```bash
git add app
 git commit -m "refactor: align app screens with code style"
```

---

### Task 2: Refactor `src/` exports, helpers, and utilities

**Files:**

- Modify: `src/hooks/useNetworkStatus.ts`
- Modify: `src/db/useMigrations.ts`
- Modify: `src/utils/id.ts`
- Modify: `src/components/ui/Container.tsx`
- Modify: `src/components/ui/EditScreenInfo.tsx`
- Modify: `src/components/ui/ScreenContent.tsx`
- Modify: `src/components/ui/feedback/ToastProvider.tsx`
- Modify: `src/components/ui/feedback/OfflineScreen.tsx`
- Modify: `src/components/ui/feedback/OfflineBanner.tsx`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/heritage/HeritageInput.tsx`
- Modify: `src/components/ui/HeritageAlert.tsx`
- Modify: `src/lib/logger.ts`
- Modify: `src/lib/mmkv.ts`
- Modify: `src/lib/sync-engine/soundCues.ts`
- Modify: `src/lib/rateLimiter.ts`
- Modify: `src/lib/lazyComponents.tsx`
- Modify: `src/lib/lazyLoading.tsx`
- Modify: `src/features/auth/hooks/useDeepLinkHandler.ts`
- Modify: `src/features/auth/store/authStore.ts`
- Modify: `src/features/auth/services/authService.ts`
- Modify: `src/features/auth/services/deviceCodesService.ts`
- Modify: `src/features/auth/services/roleStorage.ts`
- Modify: `src/features/auth/services/supabaseTest.ts`
- Modify: `src/features/family/services/inviteService.ts`
- Modify: `src/features/family-listener/hooks/useComments.ts`
- Modify: `src/features/family-listener/hooks/useFamilyPlayer.ts`
- Modify: `src/features/family-listener/hooks/useNotifications.ts`
- Modify: `src/features/family-listener/hooks/useReaction.ts`
- Modify: `src/features/family-listener/services/storyService.ts`
- Modify: `src/features/family-listener/services/secureAudioService.ts`
- Modify: `src/features/recorder/hooks/useAudioAmplitude.ts`
- Modify: `src/features/recorder/hooks/useRecorderInterruption.ts`
- Modify: `src/features/recorder/hooks/useResumeRecording.ts`
- Modify: `src/features/recorder/hooks/useTopicDiscovery.ts`
- Modify: `src/features/recorder/hooks/useTTS.ts`
- Modify: `src/features/recorder/data/topicQuestions.ts`
- Modify: `src/features/recorder/services/audioConfig.ts`
- Modify: `src/features/recorder/services/recorderService.ts`
- Modify: `src/features/recorder/services/ttsService.ts`
- Modify: `src/features/recorder/services/vadConfig.ts`
- Modify: `src/features/story-gallery/store/usePlayerStore.ts`
- Modify: `src/features/story-gallery/hooks/useStory.ts`
- Modify: `src/features/story-gallery/hooks/useStories.ts`
- Modify: `src/features/story-gallery/hooks/useStoryAvailability.ts`
- Modify: `src/features/story-gallery/hooks/useUnreadCommentCounts.ts`
- Modify: `src/features/story-gallery/hooks/useStoryComments.ts`
- Modify: `src/features/story-gallery/components/AudioPlayer.tsx`
- Modify: `src/features/story-gallery/components/EmptyGallery.tsx`
- Modify: `src/features/story-gallery/components/FilterBar.tsx`
- Modify: `src/features/story-gallery/components/SkeletonCard.tsx`
- Modify: `src/features/story-gallery/components/SwipeableStoryCard.tsx`
- Modify: `src/features/story-gallery/components/TimelineLayout.tsx`
- Modify: `src/features/story-gallery/components/TimelineStoryCard.tsx`
- Modify: `src/features/story-gallery/utils/dateUtils.ts`

**Step 1: Write the failing check (rg patterns)**

```bash
rg -n "export const .*=>" src
rg -n "\?.*\?.*:" src
rg -n "require\(" src
```

**Step 2: Run check to verify it fails**

Run the commands above.
Expected: non-empty matches for exported arrow functions, nested ternaries, and non-asset requires.

**Step 3: Apply minimal refactor**

- Convert `export const` functions to `export function` with explicit return types.
- Replace `React.FC` exports with `function` declarations returning `JSX.Element`.
- Refactor nested ternary chains in UI components to helper functions.
- Convert non-asset `require(...)` to ESM imports or dynamic `import()` where lazy loading is needed.
- Rename `src/features/story-gallery/utils/dateUtils.ts` -> `src/features/story-gallery/utils/date-utils.ts` and update
  imports.

Example transformation:

```ts
// Before
export const isSilence = (ms: number) => ms >= threshold;

// After
export function isSilence(ms: number): boolean {
  return ms >= threshold;
}
```

**Step 4: Run check to verify it passes**

```bash
rg -n "export const .*=>" src
rg -n "\?.*\?.*:" src
rg -n "require\(" src
```

Expected: no exported arrow declarations, no nested ternary chains, and non-asset requires removed.

**Step 5: Commit**

```bash
git add src
 git commit -m "refactor: align src exports with code style"
```

---

### Task 3: Refactor `tests/` and update affected test imports

**Files:**

- Modify: `tests/integration/recorder-stop-flow.test.tsx`
- Modify: `src/features/story-gallery/components/SyncStatusBadge.integration.test.tsx`
- Modify: `src/features/story-gallery/components/SyncStatusBadge.test.tsx`
- Modify: `src/features/family-listener/components/HeartIcon.test.tsx`
- Modify: `src/features/family-listener/components/PlaybackControls.test.tsx`
- Modify: `src/features/recorder/components/WaveformVisualizer.test.tsx`
- Modify: `src/features/recorder/hooks/useAudioAmplitude.test.ts`

**Step 1: Write the failing check (rg patterns)**

```bash
rg -n "require\(" tests src
rg -n "\?.*\?.*:" tests src
```

**Step 2: Run check to verify it fails**

Run the commands above.
Expected: matches for test-only `require` usage and nested ternary chains.

**Step 3: Apply minimal refactor**

- Convert simple `require` imports in tests to top-level ESM imports where possible.
- Keep `require` only where Jest mock factories require it.
- Replace nested ternary chains in test renderers with helper functions.

Example transformation:

```ts
// Before
const Reanimated = require('react-native-reanimated/mock');

// After
import Reanimated from 'react-native-reanimated/mock';
```

**Step 4: Run check to verify it passes**

```bash
rg -n "require\(" tests src
rg -n "\?.*\?.*:" tests src
```

Expected: remaining `require` usage only for assets or required mock factories.

**Step 5: Commit**

```bash
git add tests src
 git commit -m "refactor: align tests with code style"
```

---

### Task 4: Run full verification

**Files:**

- Modify: none
- Test: project-wide

**Step 1: Run lint (baseline)**

Run: `npm run lint`
Expected: PASS (0 errors)

**Step 2: Run tests**

Run: `npm test`
Expected: PASS

**Step 3: Commit (if clean)**

```bash
git add -A
 git commit -m "refactor: codebase style alignment"
```
