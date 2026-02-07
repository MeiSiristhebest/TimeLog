# Compliance Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the six identified gaps: service boundary violations, notification IO placement, device-code rate
limiting, MMKV settings storage, React Query onlineManager wiring, and critical tests.

**Architecture:** Keep IO in feature services with offline queue integration; move settings to MMKV; add client-side
rate limiting; wire React Query to NetInfo; add tests covering offline/permissions/sync flows.

**Tech Stack:** Expo Router (RN 0.81/SDK 54), TypeScript strict, Zustand, React Query, NativeWind, MMKV, Supabase,
Jest/Vitest/Maestro.

---

### Task 1: Move cloud settings IO to service + MMKV

**Files:**

- Create: `src/features/settings/services/cloudSettingsService.ts`
- Modify: `src/features/settings/hooks/useCloudSettings.ts`
- Test: `src/features/settings/services/cloudSettingsService.test.ts`

**Steps:**

1. Write failing unit tests for cloudSettingsService: MMKV persistence, Supabase upsert called when session exists,
   error surfaces.
2. Implement service: read/write via MMKV; optional Supabase sync via injected client; graceful error handling.
3. Refactor hook to use service functions; remove direct supabase usage; keep API shape intact.
4. Run unit tests `npm test -- cloudSettingsService`.

### Task 2: Move unread comment subscription to service

**Files:**

- Create: `src/features/story-gallery/services/commentRealtimeService.ts`
- Modify: `src/features/story-gallery/hooks/useUnreadCommentCounts.ts`
- Test: `src/features/story-gallery/services/commentRealtimeService.test.ts`

**Steps:**

1. Write failing tests for subscribe/unsubscribe behavior and query invalidation callback.
2. Implement service to create/remove Supabase channel; accept callback to trigger refetch; no component-level supabase
   imports.
3. Update hook to consume service; keep query logic unchanged.
4. Run targeted tests `npm test -- commentRealtimeService`.

### Task 3: Relocate notification Supabase IO to feature services

**Files:**

- Create: `src/features/notifications/services/pushTokenService.ts`
- Create: `src/features/notifications/services/nudgeProfileService.ts`
- Modify: `src/lib/notifications.ts`, `src/lib/notifications/nudgeService.ts`
- Test: `src/features/notifications/services/pushTokenService.test.ts`,
  `src/features/notifications/services/nudgeProfileService.test.ts`

**Steps:**

1. Write failing tests for push token upsert/delete using mocked Supabase and device checks.
2. Write failing tests for nudge profile fetch/update logic.
3. Implement services handling Supabase IO; keep lib files pure for permission/UI orchestration and call into services.
4. Update lib files to use services; ensure offline-queue TODO hooks left intact.
5. Run unit tests for new services.

### Task 4: Add client-side device code rate limiting (5 per 10 minutes)

**Files:**

- Modify: `src/features/auth/services/deviceCodesService.ts`
- Create: `src/features/auth/services/deviceCodeRateLimiter.ts`
- Test: `src/features/auth/services/deviceCodeRateLimiter.test.ts`, adjust `deviceCodesService.test.ts`

**Steps:**

1. Write failing tests covering: under limit allows call; over limit throws friendly error with code; window reset after
   10 minutes.
2. Implement rate limiter using MMKV storage (rolling timestamps).
3. Integrate limiter into `generateDeviceCode` before RPC; map rate-limit errors to project error shape.
4. Run affected tests.

### Task 5: Wire React Query onlineManager to NetInfo

**Files:**

- Modify: `app/_layout.tsx` (or QueryClient setup file)
- Create: `src/lib/react-query/onlineManager.ts`
- Test: `src/lib/react-query/onlineManager.test.ts` (unit)

**Steps:**

1. Write failing test ensuring onlineManager listens to NetInfo and toggles callback on changes.
2. Implement adapter to register NetInfo listener and expose initializer.
3. Initialize adapter alongside QueryClient creation in root layout; ensure cleanup on unmount.
4. Run unit test.

### Task 6: Add critical flow tests

**Files:**

- Add: `tests/integration/offline-toggle.test.tsx`
- Add: `tests/integration/mic-permission-denial.test.tsx`
- Add: `tests/integration/recorder-sync-flow.test.tsx`

**Steps:**

1. Write integration tests covering offline banner + queue state, mic permission denial user path, recorder→DB→queue
   happy path (mock queue + db).
2. Ensure mocks reuse `tests/mocks` utilities; no real IO.
3. Run integration suite `npm test -- tests/integration`.

---

Plan complete and saved to `docs/plans/2026-01-25-remediation-plan.md`. Two execution options:

1. Subagent-Driven (this session) – fresh subagent per task with review between tasks.
2. Parallel Session – new session using superpowers:executing-plans.

Which approach? If staying here, I will start Task 1 now.\*\*\*
