# Story 2.5: Resumable Upload Engine

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **System**,
I want **to upload large audio files reliably in the background**,
so that **they are safely backed up to the cloud without blocking the user**.

## Acceptance Criteria

1.  **Given** a new local recording exists and network is available
2.  **When** the Sync Engine processes the queue
3.  **Then** the **WAV file** is uploaded to Supabase Storage using TUS protocol
4.  **And** the upload uses a fresh Auth Token for every chunk (preventing mid-upload expiry)
5.  **And** if the upload is interrupted (network loss or app backgrounding), it pauses and auto-resumes when conditions return
6.  **And** an MD5 checksum is verified upon completion
7.  **And** the local database record is updated to `synced` status only after successful verification

## Tasks / Subtasks

- [x] **Task 1: Define Sync Queue Schema**
  - [x] Create `sync_queue` table in `src/db/schema.ts` (Columns: `id`, `recording_id`, `file_path` (wav), `status`, `retry_count`, `priority`, `created_at`)
  - [x] Generate migration

- [x] **Task 2: Implement TUS Client Wrapper**
  - [x] Install `tus-js-client`
  - [x] Create `src/lib/sync-engine/transport.ts`
  - [x] Configure `onBeforeRequest` hook to inject fresh `access_token` from `supabase.auth.getSession()` (Critical for long uploads)
  - [x] Set default chunk size to **1MB** (optimized for mobile latency)
  - [x] Ensure `endpoint` targets the project's TUS URL

- [x] **Task 3: Implement Queue Processor & Triggers**
  - [x] Create `src/lib/sync-engine/queue.ts`
  - [x] Implement `processQueue()` loop: Read `pending` items -> Upload -> Update DB
  - [x] Integrate `@react-native-community/netinfo` to trigger processing immediately when `isConnected` becomes `true`
  - [x] Integrate `AppState` to pause processing on `background` and resume on `active` (Expo Go limitation workaround)

- [x] **Task 4: Checksum & Cleanup**
  - [x] Calculate local MD5 of WAV file before upload
  - [x] Verify upload integrity (Trust TUS or metadata check)
  - [x] Update `audio_recordings` status to `synced` and remove from `sync_queue`

## Dev Notes

- **WAV Only**: Architecture requires uploading the WAV file (no transcoding). Ensure the path in `sync_queue` points to the `.wav` file.
- **Background Limitations**: In Expo Go/standard React Native, the JS thread halts in background. Do **not** attempt to force background execution via "hacks". Use a robust "Pause on Background / Resume on Active" pattern. The TUS client supports resuming exactly where it left off.
- **Token Safety**: Large uploads > 1 hour will fail if the initial token expires. Dynamic token injection in `onBeforeRequest` is mandatory.
- **Network as State**: Do not throw exceptions for network errors. Log them, increment `retry_count`, and wait for next NetInfo trigger or backoff timer.

### Project Structure Notes

- **Sync Engine**: `src/lib/sync-engine/` (queue.ts, transport.ts, store.ts)
- **Database**: `src/db/schema.ts`
- **Config**: `src/features/recorder/config/recorder-sync-config.ts` (Backoff settings)

### References

- [Architecture: Sync Engine](file:///d:/developWorkPlaces/Senior%20Project/TimeLog/_bmad-output/planning-artifacts/architecture.md#Section-Core-Architectural-Decisions)
- [Supabase Storage TUS Support](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)

## Dev Agent Record

### Agent Model Used

Google Antigravity (Agentic Mode)

### Debug Log References

- Verified TUS support for RN.
- Confirmed WAV-only requirement (no transcoding).
- Adjusted backgrounding strategy for RN/Expo limitations.

### Completion Notes List

- ✅ Sync queue schema already existed with required columns; added `priority` and `filePath` columns
- ✅ Generated migration `0004_swift_wiccan.sql` for schema changes
- ✅ TUS transport layer implemented with fresh token injection via `onBeforeRequest`
- ✅ 1MB chunk size configured for optimal mobile latency
- ✅ Queue processor integrates with NetInfo for automatic sync triggers when online
- ✅ AppState integration pauses processing when app backgrounds, resumes on foreground
- ✅ MD5 checksum calculation implemented using `expo-crypto`
- ✅ Recording status updated to `synced` after successful upload
- ✅ All 102 tests passing (20 sync-engine specific tests)

### Change Log

- 2026-01-15: Implemented TUS-based resumable upload transport
- 2026-01-15: Added NetInfo and AppState integration for automatic sync triggers
- 2026-01-15: Fixed store.test.ts mock configuration for full test coverage

### File List

- `src/lib/sync-engine/transport.ts` - TUS upload implementation with token refresh
- `src/lib/sync-engine/transport.test.ts` - Transport layer tests (8 tests)
- `src/lib/sync-engine/queue.ts` - Queue management with priority and filePath support
- `src/lib/sync-engine/store.ts` - Zustand store with NetInfo/AppState integration
- `src/lib/sync-engine/store.test.ts` - Store integration tests (12 tests)
- `src/db/schema/syncQueue.ts` - Sync queue schema with priority and filePath columns
- `drizzle/0004_swift_wiccan.sql` - Migration for new schema columns
