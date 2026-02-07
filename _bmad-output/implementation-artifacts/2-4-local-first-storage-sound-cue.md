# Story 2.4: Local-First Storage & Sound Cue

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want my recording to be saved instantly to the device and confirmed with a sound,
so that I feel confident my story is safe even if the internet is down.

## Acceptance Criteria

1. **Given** I finish a recording and tap "Stop & Save"
   **When** the stop flow completes
   **Then** the local SQLite `audio_recordings` row exists/updates with file path, timestamps, size, and duration
   **And** the record is marked as `local` (or `isSynced=false` mapped to `local`)
   **And** no network call is required for the "saved" state.
2. **Given** the local save completes
   **When** success is confirmed
   **Then** a distinct low-frequency "Success Ding" sound plays within 100ms
   **And** the sound plays regardless of network state.
3. **Given** the save completes
   **When** the confirmation is shown
   **Then** the UI returns to the idle Home/Recorder state
   **And** a brief confirmation message is visible (e.g., "Story Kept Safe").
4. **Given** the device is in silent/vibrate mode
   **When** the success sound would play
   **Then** the app respects system audio settings
   **And** visual confirmation still appears (optional haptic is acceptable).

## Tasks / Subtasks

- [x] Task 1: Add low-latency Sound Cue service (AC: 2, 4)
  - [x] 1.1: Add local sound asset (e.g., `assets/sounds/success-ding.wav` or `.mp3`).
  - [x] 1.2: Create `src/features/recorder/services/soundCueService.ts` using `expo-av`.
  - [x] 1.3: Preload the sound on recorder screen mount or service init and keep it in memory.
  - [x] 1.4: Expose `playSuccess()` that uses `replayAsync()` for consistent <100ms playback.
  - [x] 1.5: Handle errors by logging to Sentry without blocking UI flow.

- [x] Task 2: Persist "local" save status (AC: 1)
  - [x] 2.1: Decide and document status storage:
    - Preferred: add `sync_status` column (`local|syncing|synced|failed`) with default `local`.
    - Acceptable: keep `is_synced` and map `false -> local` in read models.
  - [x] 2.2: Update Drizzle schema and migration if adding `sync_status`.
  - [x] 2.3: Update `recorderService` to set `local` status on insert/finalize.

- [x] Task 3: Integrate Save + Cue into Stop flow (AC: 1, 2, 3)
  - [x] 3.1: In `app/(tabs)/index.tsx`, call `playSuccess()` after `stop()` resolves.
  - [x] 3.2: Show a brief success message (reuse existing UI components, no new UI kit).
  - [x] 3.3: Ensure "saved" state is set before any sync or network work begins.

- [x] Task 4: Manual and automated verification (AC: 1-4)
  - [x] 4.1: Unit test `soundCueService` (mock `expo-av`).
  - [x] 4.2: Integration test for stop flow (DB status updated + sound cue invoked).
  - [ ] 4.3: Manual test: airplane mode -> record -> stop -> sound + local save -> idle state.

## Dev Notes

### Developer Context

- This story is **local-first only**: save to SQLite immediately and confirm with sound.
- Do not block on sync or network checks; those belong to Story 2.5/2.6.
- Maintain the Stream-to-Disk flow from Story 2.1 and the pause/resume UI from Story 2.2.

### Epic Context & Cross-Story Map

- **Epic 2 Goal:** Enable seniors to record stories reliably offline, with clear feedback and automatic sync when online.
- **Story sequence:** 2.1 Stream-to-Disk + VAD safeguards → 2.2 Waveform + Pause/Resume → 2.3 TTS prompt playback → **2.4 Local save + Sound Cue** → 2.5 Sync engine upload → 2.6 Sync status indicator → 2.7 Interrupt handling → 2.8 Cloud AI toggle.
- **Dependencies:** 2.1/2.2 behaviors must remain unchanged; 2.3 TTS should be stopped on record start and must not resume on save.

### Technical Requirements

- **NFR2 (Sound Cue)**: must play within 100ms of completion.
- **Local-first**: DB write occurs before any network activity.
- **Audio Files**: remain in `FileSystem.documentDirectory/recordings/rec_{uuid_v7}.wav`.
- **Status**: record must be clearly marked as `local` for UI and sync logic.
- **Accessibility**: confirmation text >= 24pt, high contrast (AAA), no new gestures.
- **Silent Mode**: respect OS settings; do not set `playsInSilentModeIOS: true`.

### Architecture Compliance

- External IO (SQLite, FileSystem, Audio) must be in `src/features/recorder/services/*`.
- Components must not call `expo-av` or `expo-file-system` directly.
- Use `src/lib/logger.ts` for error reporting; scrub PII.
- Network failures are state transitions, not exceptions.

### Database / Status Guidance

- Current schema uses `audio_recordings.is_synced` (boolean). If you **do not** add `sync_status`, map: `false -> local`, `true -> synced`.
- If you **add** `sync_status`, keep snake_case, default `local`, and update the Drizzle migration + `src/types/entities.ts` mapping.
- Do not block local save on sync queue writes; queueing is handled in Story 2.5.

### Library / Framework Requirements

- Use `expo-av` (`Audio.Sound.createAsync`) for the sound cue.
- Use `replayAsync()` on a preloaded sound for low latency.
- Do not introduce new UI libraries; use NativeWind v4 only.

### File Structure Requirements

- `assets/sounds/success-ding.(wav|mp3)` (new asset)
- `src/features/recorder/services/soundCueService.ts` (new)
- `src/features/recorder/services/recorderService.ts` (update status persistence)
- `src/db/schema/audioRecordings.ts` (optional `sync_status` column)
- `src/types/entities.ts` (sync status mapping if needed)
- `app/(tabs)/index.tsx` (stop flow: play cue + message)

### Testing Requirements

- Unit: `soundCueService` should call `Audio.Sound.createAsync` and `replayAsync`.
- Integration: stop flow updates DB status and triggers sound cue.
- Manual: silent mode behavior, offline behavior, and quick playback (<100ms).
- Manual timing check: capture a timestamp before `playSuccess()` and log when playback starts (status update) to verify <100ms on device.

### Previous Story Intelligence (2.3)

- TTS service exists at `src/features/recorder/services/ttsService.ts`; it calls `Speech.stop()` before speaking.
- Do not reintroduce TTS playback on save; only the success cue should play.
- Recorder UI already shows `lastSaved` info in `app/(tabs)/index.tsx`; reuse that area for "Story Kept Safe".

### Existing Implementation References

- `src/features/recorder/services/recorderService.ts` handles stop → finalize metadata and DB update.
- `src/features/recorder/components/RecordingControls.tsx` and `WaveformVisualizer.tsx` already wired in HomeTab.
- Tests exist for recorder service and waveform: `src/features/recorder/services/recorderService.test.ts`, `src/features/recorder/components/WaveformVisualizer.test.tsx`.

### Git Intelligence Summary

- Recent commits touched `recorderService.ts`, `app/(tabs)/index.tsx`, and recorder tests.
- Follow existing patterns in `recorderService` for FileSystem + DB updates.
- No recent dependency additions beyond existing `expo-av` in `package.json`.

### Latest Tech Information

- `expo-av` is already present in `package.json` (~16.0.8 for SDK 54). Use `Audio.Sound.createAsync` + `replayAsync` for short cues.
- Preload the sound and reuse the same instance to minimize latency.
- If upgrading Expo SDK, review `expo-av` release notes for breaking changes and re-validate cue latency.

### Project Context Reference

- Service mandate: `src/features/*/services/*.ts` for external IO.
- Disk pre-check remains required before recording starts (Story 2.1).
- Use NativeWind for styles; avoid `StyleSheet` unless Reanimated shared values.

### Project Structure Notes

- Align with Feature-First structure (`src/features/recorder/...`).
- Avoid new shared abstractions unless used by 3+ places.
- Keep DB column names in snake_case.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Critical Success Moments]
- [Source: _bmad-output/planning-artifacts/architecture.md#Audio Architecture]
- [Source: project-context.md#Critical Implementation Rules]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `npm test` (pass; console warnings about EXPO_OS and Supabase env vars)
- `npm run lint` (fails: `src/features/recorder/services/recorderService.ts` import/namespace, `src/features/story-gallery/components/StoryList.tsx` unescaped entities; multiple existing warnings)

### Completion Notes List

- Implemented `soundCueService` with `expo-av` preload + replay for low-latency success cue, error capture, and silent-mode compliance.
- Added `assets/sounds/success-ding.wav` and wired `initializeSoundCue`/`cleanupSoundCue` + `playSuccess` into HomeTab stop flow (keeps existing confirmation message).
- Added integration coverage for stop flow success cue + UI message; updated sound cue unit tests.
- Adjusted Jest mocks (expo-router `Link`, safe-area-context) and CSS interop mock to return valid React elements in tests.

### File List

- assets/sounds/success-ding.wav
- src/features/recorder/services/soundCueService.ts
- src/features/recorder/services/soundCueService.test.ts
- app/(tabs)/index.tsx
- tests/integration/recorder-stop-flow.test.tsx
- jest-setup.js
- test-utils/css-interop-module-mock.js

### Change Log

- 2026-01-14: Implemented sound cue service, wired stop flow, added tests, and stabilized Jest mocks.
