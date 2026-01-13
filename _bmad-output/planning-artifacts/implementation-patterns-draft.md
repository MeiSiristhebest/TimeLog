## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 areas where AI agents could make different choices: Naming, Structure, Format, Communication, Process.

### Naming Patterns

**Database Naming Conventions (SQLite/Supabase):**
- **Tables:** `snake_case`, plural. Example: `users`, `audio_recordings`.
- **Columns:** `snake_case`. Example: `created_at`, `is_synced`.
- **Foreign Keys:** `singular_table_id`. Example: `user_id`, `story_id`.
- **Primary Keys:** UUID v7 preferred for offline-safe conflict resolution.
- **Indexes:** `idx_{table}_{column}`. Example: `idx_audio_recordings_created_at`.
- **Mapping:** Use snake_case column names in schema definitions (e.g., `text('created_at')`) to map to camelCase fields; use `.name()` only if supported by the current Drizzle driver/version.

**API Naming Conventions:**
- **REST Endpoints:** kebab-case, plural resources. Example: `/api/v1/audio-recordings`.
- **File Uploads:** `audio-recordings/rec_{uuid_v7}.wav` (Use UUID v7 with meaningful prefix `rec_` or `story_`).
- **Route Parameters:** `:paramName` (Expo Router uses `[paramName]`). Example: `[id].tsx`.
- **Query Parameters:** `camelCase`. Example: `?limit=10&cursor=abc`.
- **Headers:** `Pascal-Kebab-Case`. Example: `X-Client-Version`.

**Code Naming Conventions (TypeScript):**
- **Components:** `PascalCase`. Example: `RecordingButton`.
- **Files:** `kebab-case` for utilities/configs (`date-utils.ts`), `PascalCase` for Components (`RecordingButton.tsx`).
- **Functions/Variables:** `camelCase`. Example: `startRecording`, `isOnline`.
- **Constants:** `UPPER_SNAKE_CASE`. Example: `MAX_RECORDING_DURATION`.
- **Interfaces/Types:** `PascalCase`, optionally prefixed with `I` or `T` (preferred: no prefix). Example: `AudioRecording`.

### Structure Patterns

**Project Organization (Feature-First with Shared Core):**
- **Features:** `src/features/{featureName}/` containing components, hooks, utils specific to feature.
- **Shared:** `src/components/ui` (Design System), `src/lib` (3rd party wrappers), `src/utils` (pure functions).
- **Rule of Three:** "Duplication is cheaper than wrong abstraction." Do not extract shared code until it is used in 3 distinct places.

**File Structure Patterns:**
- **Co-location:** Tests next to implementation (`Button.test.tsx` next to `Button.tsx`).
- **Barrel Files:** Avoid index.ts exports unless necessary for public API to prevent circular deps.
- **Assets:** `assets/images`, `assets/fonts`.
- **Migration Files:** Serial migrations only. One pending migration at a time.

### Format Patterns

**API Response Formats (Envelope Pattern):**
- **Success:** 
  ```json
  {
    "data": [...], 
    "meta": { "pagination": { "page": 1, "limit": 10 } }
  }
  ```
- **Error:** 
  ```json
  {
    "error": {
      "code": "AUTH_INVALID_TOKEN",
      "message": "User friendly message",
      "httpStatus": 401
    }
  }
  ```
- **Dates:** ISO 8601 Strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Safety:** Clients MUST check Content-Type. If not JSON, treat as Service Unavailable.

**Data Exchange Formats:**
- **JSON Fields:** `camelCase` for frontend consumption (transform from snake_case DB at data layer if needed, Drizzle often handles this).
- **Booleans:** `true`/`false` (not 0/1).
- **Nulls:** Nullable fields preferred over undefined in JSON.

### Communication Patterns

**Event System Patterns:**
- **Naming:** `ResourceAction` (Past Tense). Example: `RecordingCompleted`, `UploadFailed`.
- **Payload:** `{ entityId, timestamp, metadata }`.

**State Management Patterns (Zustand):**
- **Stores:** Feature-scoped stores (`useAudioStore`, `useAuthStore`).
- **Actions:** `camelCase` verbs. `setRecordingState`, `uploadRecording`.
- **Selectors:** Named specifically. `useAudioStore(s => s.isRecording)`.

### Process Patterns

**Error Handling Patterns:**
- **Global:** `ErrorBoundary` for UI crashes.
- **Async:** `try/catch` in services, return `Result` type or throw typed errors.
- **Network as State:** Network failures are NOT exceptions. They are state transitions.
  - **Abstraction:** MUST use a unified `SyncClient` wrapper (e.g., around fetch/axios) to handle this transparently.
  - `Offline` -> Enqueue action to Sync Queue. Promise Resolves (Optimistic UI).
  - `Online` -> Drain Sync Queue.
- **User Feedback:** Toast/Snackbar for transient errors, Full screen for blocking errors.

**Loading State Patterns:**
- **Naming:** `isLoading`, `isSubmitting`.
- **UI:** Skeleton screens for initial load, Spinners for actions.

### Privacy & Consent Patterns

- **Explicit Opt-in:** Cloud AI prompts/transcription and family sharing require explicit consent.
- **Default Mode:** Offline-first by default; local recording must work even when cloud features are disabled.
- **Settings Controls:** Provide a single "Cloud AI & Sharing" toggle plus a separate "Family Sharing" revoke action.
- **Audit Metadata:** Record provider, plan, and retention mode as audit metadata (no PII).

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `snake_case` for ALL database definitions.
- Use `camelCase` for ALL TypeScript variables/functions.
- Co-locate tests with components.
- Use the defined Error Response format.

**Pattern Enforcement:**
- CI checks via ESLint (naming conventions).
- PR Review by "Architect" agent.
