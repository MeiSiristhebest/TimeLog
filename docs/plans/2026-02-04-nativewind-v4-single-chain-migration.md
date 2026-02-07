# NativeWind v4 Single-Chain Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Roll back styling runtime to a single stable NativeWind v4 chain and recover visual parity for Welcome / Record / Listen / Me pages on Android without reverting product architecture work.

**Architecture:** Remove v5 preview + react-native-css wrapper runtime (`@/tw`) and standardize on NativeWind v4 (`className` on React Native core components + `cssInterop` only for 3rd-party gaps). Keep style fallback only for animated/computed/perf-sensitive branches. Preserve existing feature/domain architecture and data flow.

**Tech Stack:** Expo SDK 54, React Native 0.81, NativeWind v4, Tailwind config, Reanimated 4

---

## Scope & Non-Goals

- In scope: styling pipeline stabilization, import chain normalization, font mapping consistency, Android visual regression fixes.
- Out of scope: business logic refactor, navigation rewrite, DB/migration logic, auth flow redesign.
- Constraint: no destructive git reset/revert; keep ongoing architecture changes.

## Task 1: Dependency and Build Chain Reset to v4

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `babel.config.js`
- Modify: `metro.config.js`
- Modify: `global.css`
- Modify: `tailwind.config.js`
- Modify: `tsconfig.json`
- Modify: `app/_layout.tsx`
- Modify: `src/types/fonts.d.ts`

**Steps:**
1. Pin NativeWind to stable v4 and remove runtime packages that belong to v5 chain (`react-native-css`, extra interop runtime if unused).
2. Keep `babel.config.js` with NativeWind babel preset/plugin arrangement required by v4 + reanimated plugin order.
3. Keep `metro.config.js` with NativeWind integration but remove assumptions tied to v5 CSS pipeline behavior.
4. Simplify `global.css` to v4-compatible base directives; remove v5-specific `@source` patterns that caused invalid CSS token pollution.
5. Keep `tailwind.config.js` content globs minimal (`app/**`, `src/**`) and hard-exclude non-code dirs.
6. Validate compile-only via `npx expo export --platform android` (no runtime launch yet).

## Task 2: Remove `@/tw` Runtime Layer

**Files:**
- Modify/Delete: `src/tw/index.tsx`
- Modify/Delete: `src/tw/animated.tsx`
- Modify/Delete: `src/tw/image.tsx`
- Modify/Delete: `src/tw/README.md`
- Modify: `tsconfig.json` (remove `@/tw` path alias once migration complete)

**Steps:**
1. Freeze API surface of `@/tw` wrappers to avoid partial break during migration branch.
2. Replace all `@/tw` and `@/tw/animated` imports in app/src with canonical imports.
3. For animated components, use `react-native-reanimated` `Animated` directly + explicit style objects.
4. Delete `src/tw/*` only after zero references remain (`rg "@/tw" app src` returns empty).

## Task 3: Bulk Import Migration (All Affected Feature Files)

**Files to Modify (generated from current repo scan):**
- `app routes` (13 files)
  - `app/(auth)/accept-invite.tsx`
  - `app/(auth)/invite.tsx`
  - `app/(auth)/login.tsx`
  - `app/(auth)/welcome.tsx`
  - `app/(tabs)/family/index.tsx`
  - `app/(tabs)/gallery.tsx`
  - `app/(tabs)/index.tsx`
  - `app/(tabs)/topics.tsx`
  - `app/_layout.tsx`
  - `app/ask-question.tsx`
  - `app/family-members.tsx`
  - `app/index.tsx`
  - `app/role.tsx`
- `ui base components` (11 files)
  - `src/components/ui/AppText.tsx`
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Container.tsx`
  - `src/components/ui/EditScreenInfo.tsx`
  - `src/components/ui/GlassCard.tsx`
  - `src/components/ui/HeritageAlert.tsx`
  - `src/components/ui/HeritageModal.tsx`
  - `src/components/ui/HeritageTimePicker.tsx`
  - `src/components/ui/ScreenContent.tsx`
  - `src/components/ui/UndoToast.tsx`
  - `src/components/ui/heritage-time-picker.tsx`
- `ui feedback components` (3 files)
  - `src/components/ui/feedback/OfflineBanner.tsx`
  - `src/components/ui/feedback/OfflineScreen.tsx`
  - `src/components/ui/feedback/ToastProvider.tsx`
- `ui heritage components` (16 files)
  - `src/components/ui/heritage/BreathingGlow.tsx`
  - `src/components/ui/heritage/HeritageActionSheet.tsx`
  - `src/components/ui/heritage/HeritageBottomSheet.tsx`
  - `src/components/ui/heritage/HeritageButton.tsx`
  - `src/components/ui/heritage/HeritageEmptyState.tsx`
  - `src/components/ui/heritage/HeritageFAB.tsx`
  - `src/components/ui/heritage/HeritageHeader.tsx`
  - `src/components/ui/heritage/HeritageInput.tsx`
  - `src/components/ui/heritage/HeritageLoadingOverlay.tsx`
  - `src/components/ui/heritage/HeritageLottie.tsx`
  - `src/components/ui/heritage/HeritageProgressBar.tsx`
  - `src/components/ui/heritage/HeritageSelect.tsx`
  - `src/components/ui/heritage/HeritageSkeleton.tsx`
  - `src/components/ui/heritage/HeritageSwipeableRow.tsx`
  - `src/components/ui/heritage/HeritageSwitch.tsx`
  - `src/components/ui/heritage/HeritageTabBar.tsx`
- `discovery feature` (1 files)
  - `src/features/discovery/components/CategoryFilter.tsx`
- `family-listener feature` (12 files)
  - `src/features/family-listener/components/CommentInput.tsx`
  - `src/features/family-listener/components/CommentItem.tsx`
  - `src/features/family-listener/components/CommentList.tsx`
  - `src/features/family-listener/components/CommentSection.tsx`
  - `src/features/family-listener/components/EmptyFamilyGallery.tsx`
  - `src/features/family-listener/components/FamilyStoryCard.tsx`
  - `src/features/family-listener/components/FamilyStoryList.tsx`
  - `src/features/family-listener/components/HeartIcon.tsx`
  - `src/features/family-listener/components/NotificationBanner.tsx`
  - `src/features/family-listener/components/NotificationPrompt.tsx`
  - `src/features/family-listener/components/PlaybackControls.tsx`
  - `src/features/family-listener/components/SkeletonCard.tsx`
- `home feature` (2 files)
  - `src/features/home/components/ActivityCard.tsx`
  - `src/features/home/components/HomeNotification.tsx`
- `recorder feature` (8 files)
  - `src/features/recorder/components/ActiveRecordingView.tsx`
  - `src/features/recorder/components/ConnectivityBadge.tsx`
  - `src/features/recorder/components/LiveTranscriptPanel.tsx`
  - `src/features/recorder/components/QuestionCard.tsx`
  - `src/features/recorder/components/RecordingControls.tsx`
  - `src/features/recorder/components/ResumeRecordingPrompt.tsx`
  - `src/features/recorder/components/StorySavedView.tsx`
  - `src/features/recorder/components/WaveformVisualizer.tsx`
- `settings feature` (10 files)
  - `src/features/settings/components/EditProfileModal.tsx`
  - `src/features/settings/components/QRCodeModal.tsx`
  - `src/features/settings/components/SettingsCard.tsx`
  - `src/features/settings/components/SettingsRow.tsx`
  - `src/features/settings/components/SettingsSection.tsx`
  - `src/features/settings/components/UserProfileHeader.tsx`
  - `src/features/settings/screens/AppSettingsScreen.tsx`
  - `src/features/settings/screens/DisplayAccessibilityScreen.tsx`
  - `src/features/settings/screens/FontSizeScreen.tsx`
  - `src/features/settings/screens/SettingsHomeScreen.tsx`
- `story-gallery feature` (15 files)
  - `src/features/story-gallery/components/AudioPlayer.tsx`
  - `src/features/story-gallery/components/CommentBadge.tsx`
  - `src/features/story-gallery/components/CompactStoryCard.tsx`
  - `src/features/story-gallery/components/DeletedItemsList.tsx`
  - `src/features/story-gallery/components/EditStorySheet.tsx`
  - `src/features/story-gallery/components/EditTitleSheet.tsx`
  - `src/features/story-gallery/components/EmptyGallery.tsx`
  - `src/features/story-gallery/components/FeaturedStoryCard.tsx`
  - `src/features/story-gallery/components/FilterBar.tsx`
  - `src/features/story-gallery/components/SkeletonCard.tsx`
  - `src/features/story-gallery/components/StoryCard.tsx`
  - `src/features/story-gallery/components/StoryList.tsx`
  - `src/features/story-gallery/components/SyncStatusBadge.tsx`
  - `src/features/story-gallery/components/TimelineLayout.tsx`
  - `src/features/story-gallery/screens/StoryEditScreen.tsx`
- `lib` (1 files)
  - `src/lib/lazyLoading.tsx`
- `other` (1 files)
  - `src/tw/README.md`

**Steps:**
1. Run codemod pass A: `@/tw` imports -> `react-native`/`react-native-safe-area-context`/`expo-image` equivalents.
2. Run codemod pass B: `@/tw/animated` -> `import Animated from react-native-reanimated` (or named APIs) and adapt JSX tags.
3. Run codemod pass C: preserve behavior where custom wrappers added props mapping (e.g., `contentContainerClassName`), replacing with native equivalent styles.
4. Manual compile fix sweep for TypeScript errors after codemods.

## Task 4: Font & Typography Stabilization

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `tailwind.config.js`
- Modify: `global.css`
- Modify: `src/components/ui/AppText.tsx`
- Modify: `src/types/fonts.d.ts`

**Steps:**
1. Keep Fraunces loaded in root layout with exact weights used in design (300/400/600/700).
2. Ensure Tailwind font families point only to loaded names.
3. Keep Android fallback in `AppText` that maps serif/display + weight to concrete Fraunces family to prevent fallback-to-system.
4. Ban invalid utility aliases (e.g., `font-serif-semibold`); enforce `font-serif font-semibold`.

## Task 5: Critical Visual Regression Recovery (Page-Level)

**Files:**
- Modify: `app/(auth)/welcome.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/gallery.tsx`
- Modify: `src/components/ui/heritage/HeritageTabBar.tsx`
- Modify: `src/features/story-gallery/components/FilterBar.tsx`
- Modify: `src/features/story-gallery/components/EmptyGallery.tsx`
- Modify: `src/features/settings/components/UserProfileHeader.tsx`
- Modify: `src/features/settings/components/SettingsRow.tsx`
- Modify: `src/features/settings/screens/SettingsHomeScreen.tsx`
- Modify: `src/features/settings/screens/AppSettingsScreen.tsx`

**Steps:**
1. Restore tab active top indicator behavior and spacing parity.
2. Restore Listen card structure (question card spacing, controls row, mic zone, CTA placement).
3. Restore Me page hierarchy (header block, row density, separators, icon/text proportions).
4. Restore Welcome vertical rhythm and primary CTA shape/color/position.

## Task 6: Guardrails to Prevent Regression

**Files:**
- Create/Modify: `scripts/check-style-chain.cjs`
- Create/Modify: `package.json`
- Optional modify: eslint config (restricted imports rule)

**Steps:**
1. Add CI/local check that fails if `@/tw` or `react-native-css` imports reappear.
2. Add check for invalid utility classes known to break compile (e.g., malformed bracket classes).
3. Run checks in pre-commit or CI pipeline.

## Task 7: Verification Matrix

**Commands:**
1. `npm run lint`
1. `npm test`
1. `npx expo export --platform android`
1. `rg "@/tw" app src`
1. `rg "react-native-css" app src`

**Runtime acceptance (Android):**
- Welcome: CTA terracotta button visible, proper radius/shadow, typography stable.
- Record tab: question card, tape/clip decoration, mic zone, label spacing correct.
- Listen tab: category chips and empty state card layout not collapsed/overlapping.
- Me tab: profile header and settings rows match design hierarchy.
- Tab bar: active top indicator visible on selected tab.
- Logs: no CSS parse token warnings, no missing font warnings.

## Commit Plan (Frequent, Non-Destructive)

1. `chore(styling): reset nativewind chain to v4 stable`
1. `refactor(styling): remove tw runtime wrapper imports`
1. `fix(ui): recover record listen me visual layout parity`
1. `chore(ci): add styling chain guardrails`

## Risk Notes

- High-risk area: animated components where className/style precedence changed during wrapper migration.
- High-risk area: components currently relying on wrapper-only props mapping.
- Mitigation: batch by feature folder, compile after each batch, avoid wide blind codemod commits.