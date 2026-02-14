# Hardcoded Remediation Wave 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove high-risk hardcoded values (theme colors, routes, permission flow, env fallbacks, and copy hotspots) and establish automated guardrails so regressions are blocked in CI.

**Architecture:** Keep UI behavior unchanged while moving literals into centralized domain modules (`theme`, `copy`, `routes`, `permissions`, `config`). Apply codemods/refactors feature-by-feature, then enforce via lint/check scripts. Prioritize runtime-risk items first (permissions, env/config, dark-mode colors), then consistency items (copy and numeric tokens).

**Tech Stack:** Expo Router v6, React Native 0.81 / Expo SDK 54, TypeScript strict, NativeWind v4, Jest, ESLint.

---

### Task 1: Build Hardcoded Baseline + CI Gate

**Files:**
- Create: `scripts/hardcode-audit.mjs`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/delivery/hardcode-baseline-2026-02-14.md`

**Step 1: Write failing audit expectations**

- Define thresholds for production code only (exclude tests, theme source-of-truth files):
  - Color literals outside theme/constants: must trend down from current baseline (`202` matches).
  - Route literal calls (`router.push('/`, `router.replace('/`): baseline `31`.
  - Permission requests outside approved services: baseline from audit.

**Step 2: Run baseline audit**

Run:
```bash
node scripts/hardcode-audit.mjs --baseline
```

Expected:
- Produces JSON/markdown report with counts by category and top files.

**Step 3: Wire CI check**

- Add non-blocking warning mode first (`warn`), then blocking mode after Task 5 (`error`).

**Step 4: Verify pipeline behavior**

Run:
```bash
npm run lint
npx tsc --noEmit
node scripts/hardcode-audit.mjs
```

Expected:
- CI-ready output; no script/runtime errors.

**Step 5: Commit**

```bash
git add scripts/hardcode-audit.mjs .github/workflows/ci.yml docs/delivery/hardcode-baseline-2026-02-14.md
git commit -m "chore: add hardcode audit baseline and ci guard"
```

### Task 2: Eliminate High-Risk Hardcoded Colors in Runtime Screens

**Files:**
- Modify: `src/features/settings/screens/FontSizeScreen.tsx`
- Modify: `src/features/discovery/screens/TopicsDiscoveryScreen.tsx`
- Modify: `src/features/family/screens/FamilyMembersScreen.tsx`
- Modify: `src/features/auth/screens/AuthHelpScreen.tsx`
- Modify: `src/features/auth/screens/ConsentReviewScreen.tsx`
- Modify: `src/features/auth/screens/RecoveryCodeScreen.tsx`
- Modify: `src/components/ui/feedback/ToastProvider.tsx`
- Modify: `src/features/story-gallery/components/EmptyGallery.tsx`

**Step 1: Add token mapping before replacement**

- Use `useHeritageTheme()` and/or `src/theme/designSystem.ts` token aliases.
- Define semantic aliases per context (`success`, `warning`, `surfaceCard`, `onSurface`), avoid raw hex.

**Step 2: Replace runtime hex/rgba literals**

- Replace only production code first (tests can be migrated later).
- Keep visual parity by mapping old literals to nearest semantic tokens.

**Step 3: Add visual regression sanity checks**

- Extend or add focused snapshot/render tests for touched components where available.

**Step 4: Verify**

Run:
```bash
npx eslint --max-warnings=0 src/features/settings/screens/FontSizeScreen.tsx src/features/discovery/screens/TopicsDiscoveryScreen.tsx src/components/ui/feedback/ToastProvider.tsx
npx tsc --noEmit
```

Expected:
- No new lint/type errors.
- Dark mode no bright flash or mismatched bright blocks on touched screens.

**Step 5: Commit**

```bash
git add src/features/settings/screens/FontSizeScreen.tsx src/features/discovery/screens/TopicsDiscoveryScreen.tsx src/features/family/screens/FamilyMembersScreen.tsx src/features/auth/screens/AuthHelpScreen.tsx src/features/auth/screens/ConsentReviewScreen.tsx src/features/auth/screens/RecoveryCodeScreen.tsx src/components/ui/feedback/ToastProvider.tsx src/features/story-gallery/components/EmptyGallery.tsx
git commit -m "refactor: replace runtime hardcoded colors with heritage tokens"
```

### Task 3: Centralize Route Literals

**Files:**
- Create: `src/features/app/navigation/routes.ts`
- Modify: `src/features/app/screens/AppEntryScreen.tsx`
- Modify: `src/features/app/screens/SplashScreen.tsx`
- Modify: `src/features/auth/hooks/useAuthLogic.ts`
- Modify: `src/features/settings/hooks/useSettingsLogic.ts`
- Modify: `src/features/home/hooks/useHomeLogic.ts`
- Modify: `src/features/auth/screens/WelcomeScreen.tsx`

**Step 1: Define route constants**

- Export typed route constants for top-level transitions and tab deep paths.
- Keep names semantic (`APP_ROUTES.TABS`, `APP_ROUTES.WELCOME`, etc.).

**Step 2: Replace literal push/replace calls**

- Replace all current literal route strings (`31` baseline) in production modules.

**Step 3: Add compile-time safety**

- Ensure constants satisfy Expo Router typed route constraints where possible.

**Step 4: Verify**

Run:
```bash
npx eslint --max-warnings=0 src/features/app/screens/AppEntryScreen.tsx src/features/app/screens/SplashScreen.tsx src/features/auth/hooks/useAuthLogic.ts src/features/settings/hooks/useSettingsLogic.ts src/features/home/hooks/useHomeLogic.ts
npx tsc --noEmit
```

Expected:
- No direct route literals in touched files.

**Step 5: Commit**

```bash
git add src/features/app/navigation/routes.ts src/features/app/screens/AppEntryScreen.tsx src/features/app/screens/SplashScreen.tsx src/features/auth/hooks/useAuthLogic.ts src/features/settings/hooks/useSettingsLogic.ts src/features/home/hooks/useHomeLogic.ts src/features/auth/screens/WelcomeScreen.tsx
git commit -m "refactor: centralize navigation route constants"
```

### Task 4: Permissions Hardcoding + Minimal Permission Boundary

**Files:**
- Modify: `app.json`
- Modify: `src/lib/notifications.ts`
- Modify: `src/utils/permissions.ts`
- Modify: `src/features/settings/screens/EditProfileScreen.tsx`
- Create: `src/features/permissions/permissionPolicy.ts`
- Create: `tests/integration/permission-request-boundary.test.tsx`

**Step 1: Define permission policy map**

- Enumerate each permission and approved request entrypoints:
  - Microphone: recorder flow only.
  - Notifications: explicit user action points only.
  - Media library: profile photo update only.

**Step 2: Remove unnecessary static Android permissions**

- Keep only required manifest permissions for current features.
- Verify `MODIFY_AUDIO_SETTINGS` and `VIBRATE` necessity; drop if unused.

**Step 3: Remove placeholder permission success paths**

- `requestNotificationWithRationale()` must perform real request flow or be removed.
- Ensure no "resolve(true)" stubs.

**Step 4: Verify**

Run:
```bash
npx jest tests/integration/permission-request-boundary.test.tsx --runInBand
npx tsc --noEmit
```

Expected:
- Permission prompts occur only at policy-defined moments.
- No accidental eager permission requests on startup.

**Step 5: Commit**

```bash
git add app.json src/lib/notifications.ts src/utils/permissions.ts src/features/settings/screens/EditProfileScreen.tsx src/features/permissions/permissionPolicy.ts tests/integration/permission-request-boundary.test.tsx
git commit -m "fix: enforce minimal permission request policy"
```

### Task 5: Copy Hardcoding and English-Only Governance

**Files:**
- Create: `src/features/app/copy/en.ts`
- Modify: `src/components/ui/HeritageTimePicker.tsx`
- Modify: `src/components/ui/HeritageDatePicker.tsx`
- Modify: `src/features/story-gallery/screens/StoryDetailScreen.tsx`
- Modify: `src/features/story-gallery/screens/StoryCommentsScreen.tsx`
- Modify: `src/features/recorder/components/StorySavedView.tsx`
- Modify: `src/features/family-listener/components/CommentList.tsx`

**Step 1: Create centralized copy dictionary**

- Move repeated CTA/status strings (`Cancel`, `Confirm`, `No comments yet`, etc.) into a single English copy module.

**Step 2: Replace ad-hoc literals in high-traffic screens/components**

- Start with flows user already reported (Listen/Comments/Story detail/Recorder).

**Step 3: Add lint/guard for forbidden locale regressions**

- Add simple check that blocks non-English literals in UI layer (allow list for proper nouns).

**Step 4: Verify**

Run:
```bash
npx eslint --max-warnings=0 src/components/ui/HeritageTimePicker.tsx src/components/ui/HeritageDatePicker.tsx src/features/story-gallery/screens/StoryDetailScreen.tsx src/features/story-gallery/screens/StoryCommentsScreen.tsx src/features/recorder/components/StorySavedView.tsx src/features/family-listener/components/CommentList.tsx
npx tsc --noEmit
```

Expected:
- Touched components read display copy from centralized module.

**Step 5: Commit**

```bash
git add src/features/app/copy/en.ts src/components/ui/HeritageTimePicker.tsx src/components/ui/HeritageDatePicker.tsx src/features/story-gallery/screens/StoryDetailScreen.tsx src/features/story-gallery/screens/StoryCommentsScreen.tsx src/features/recorder/components/StorySavedView.tsx src/features/family-listener/components/CommentList.tsx
git commit -m "refactor: centralize high-traffic ui copy strings"
```

### Task 6: Config/URL Hardcoding Cleanup

**Files:**
- Modify: `src/features/home/services/weatherService.ts`
- Modify: `src/lib/supabase.ts`
- Modify: `src/lib/sync-engine/transport.ts`
- Create: `src/features/app/config/runtimeConfig.ts`
- Modify: `supabase/functions/send-push-notification/index.ts`

**Step 1: Consolidate runtime config access**

- Read env values from one module with strict validation and typed errors.

**Step 2: Remove hidden network fallbacks in production paths**

- Replace direct fallback URLs (e.g. weather endpoint fallback) with explicit opt-in dev defaults or fail-fast logic.

**Step 3: Verify edge/supabase function constants**

- Keep protocol/library import URLs as required by Deno ecosystem.
- Centralize only business URLs (`EXPO_PUSH_URL`) if reused.

**Step 4: Verify**

Run:
```bash
npx eslint --max-warnings=0 src/features/home/services/weatherService.ts src/lib/supabase.ts src/lib/sync-engine/transport.ts src/features/app/config/runtimeConfig.ts
npx tsc --noEmit
```

Expected:
- Production runtime has no silent hardcoded API fallback URL path.

**Step 5: Commit**

```bash
git add src/features/home/services/weatherService.ts src/lib/supabase.ts src/lib/sync-engine/transport.ts src/features/app/config/runtimeConfig.ts supabase/functions/send-push-notification/index.ts
git commit -m "refactor: centralize runtime config and remove implicit url fallbacks"
```

### Task 7: Final Verification + Exit Criteria

**Files:**
- Modify: `docs/delivery/hardcode-baseline-2026-02-14.md`
- Modify: `scripts/hardcode-audit.mjs` (threshold update)

**Step 1: Re-run full checks**

Run:
```bash
npm run lint
npx tsc --noEmit
npm test
node scripts/hardcode-audit.mjs
```

**Step 2: Confirm measurable reduction**

- Target for Wave 1:
  - Color literals in non-theme/non-test production files: `202 -> <= 120`
  - Route literal calls: `31 -> <= 5`
  - Permission request callsites outside policy module: `0`
  - Non-tokenized high-traffic copy strings: reduced in listed modules

**Step 3: Document delta**

- Update before/after table in delivery doc.

**Step 4: Commit**

```bash
git add docs/delivery/hardcode-baseline-2026-02-14.md scripts/hardcode-audit.mjs
git commit -m "chore: finalize hardcode remediation wave 1 metrics"
```

## Scope Notes (Evidence Snapshot, 2026-02-14)

- Non-theme/non-test color literal matches: `202`
- Route literal navigation calls: `31` (`push=6`, `replace=25`)
- Style/timing/magic-number pattern hits: `528` (to be narrowed by policy, not blanket replaced)
- Role string literal repeats: `storyteller=48`, `family=62`, `listener=4`
- i18n library references: none found in `src/` and `app/`

## Non-Goals for Wave 1

- No global i18n framework rollout yet.
- No broad redesign of all spacing/animation constants.
- No migration of test-only literals unless needed for refactor compatibility.

