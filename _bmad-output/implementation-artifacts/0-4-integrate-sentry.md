# Story 0.4: Integrate Observability (Sentry)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,  
I want to integrate Sentry and Expo Insights,  
so that I can track crashes and stability issues from day one.

## Acceptance Criteria

1. **Given** I have Sentry project DSNs  
   **When** I install `@sentry/react-native` and configure the initialization code  
   **Then** a test error triggered in the App appears in the Sentry dashboard.
2. **Given** source maps are needed for readable stack traces  
   **When** I run an Expo build  
   **Then** source maps are uploaded correctly and stack traces are symbolicated in Sentry.
3. **Given** privacy and accessibility requirements  
   **When** errors are captured  
   **Then** no PII/transcripts are logged and UI remains accessible (no blocking overlays).

## Tasks / Subtasks

- [x] Task 1: Add Sentry dependency and build config (AC: 1, 2)
  - [x] 1.1: Install `@sentry/react-native` via `npx expo install`.
  - [x] 1.2: Configure Expo plugin for Sentry source-map upload (no secrets hardcoded; rely on env).
  - [x] 1.3: Document required env vars (`EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) in story notes.

- [x] Task 2: Initialize Sentry logger (AC: 1, 3)
  - [x] 2.1: Create `src/lib/logger.ts` as the Sentry wrapper (no feature imports).
  - [x] 2.2: Initialize Sentry in the root layout using DSN from env; disable sending when DSN missing.
  - [x] 2.3: Add helpers to capture errors/messages with PII scrubbing hooks.

- [x] Task 3: Add a manual test trigger (AC: 1)
  - [x] 3.1: Add a small “Send test error” action in Settings placeholder to fire `captureException` (guarded to avoid PII).

- [x] Task 4: Manual verification (AC: 1, 2)
  - [x] 4.1: Run the app, trigger the test error, and confirm it reaches Sentry with readable stack traces.

## Dev Notes

### Architecture & Guardrails

- `src/lib/logger.ts` owns Sentry init and exports capture helpers; no features should import Sentry directly.
- App entry/root layout should initialize Sentry once; avoid multiple inits.
- No PII/transcripts in logs (per `project-context.md`). Use `beforeSend` to scrub payloads if needed.

### Implementation Notes

- Use `EXPO_PUBLIC_SENTRY_DSN` for runtime DSN; allow init to no-op if DSN is absent to keep local dev unblocked.
- For source maps on EAS, use `@sentry/react-native/expo` plugin and set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in build env (do not commit secrets).
- Keep UI responsive: avoid blocking overlays or prompts when sending test errors.
- Build-time/env checklist (set in EAS or `.env`): `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`. Plugin reads env; no secrets in repo.

### File Structure Requirements

- `src/lib/logger.ts`
- `app/_layout.tsx` (init hook)
- `app/(tabs)/settings.tsx` (test trigger only; keep placeholder content)
- `app.json` (Sentry plugin config)

### Testing Requirements

- Manual: Trigger “Send test error” in Settings and verify it arrives in Sentry with symbolicated stack trace (requires DSN + auth token set in env).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.4]
- [Source: project-context.md#Privacy & Security]
- [Source: architecture.md#Project Structure & Boundaries]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `npm run lint`
- `npx expo install @sentry/react-native`
- `npx prettier --write ...` (as needed)

### Completion Notes List

- Installed `@sentry/react-native` (npm) and added Expo plugin for source-map uploads (env-driven, no secrets committed).
- Created `src/lib/logger.ts` to init Sentry (env-based DSN, PII scrubbing, error/message helpers) and imported at root layout for single init.
- Added Settings tab test action to dispatch a sample exception to Sentry; guarded when DSN is missing.
- App-level lint/format passes (`npm run lint`).
- Manual verification completed: test error appears in Sentry with symbolicated stack.

### File List

- app.json
- app/\_layout.tsx
- app/(tabs)/settings.tsx
- src/lib/logger.ts
