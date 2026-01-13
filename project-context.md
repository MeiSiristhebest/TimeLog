---
project_name: 'TimeLog'
user_name: 'Mei'
date: '2026-01-09'
sections_completed: ['technology_stack', 'critical_rules', 'party_mode_refinements']
existing_patterns_found: 0
workflow_status: 'complete'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions (Finalized Jan 2026)

- **Runtime**: React Native `0.81` (via Expo SDK `54`) - *New Architecture Enabled*
- **Language**: TypeScript `5.x` (Strict Mode)
- **Core Framework**: Expo Router `v6` (File-based routing)
- **State Management**:
  - Client: `zustand` (v5)
  - Server: `@tanstack/react-query` (v5)
- **Styling**: NativeWind `v4` (Tailwind CSS) - *Performance Optimized*
- **UI Rendering**: `@shopify/react-native-skia` (WaveformVisualizer; Phase 2)
- **Database & Storage**:
  - Business Data: `expo-sqlite` + `drizzle-orm` (Local-First)
  - Auth Token: `expo-secure-store` (Encrypted)
  - App Settings: `react-native-mmkv` (Zero Latency)
  - Cloud: Supabase (via `src/lib/supabase.ts`)
- **Audio Intelligence**:
  - Transport: LiveKit (Python Agent SDK)
  - STT: Deepgram Nova-3 (Optimized for Elderly Speech)
  - VAD: Silero (On-device via `@siteed/expo-audio-stream`)
- **AI Model**: Gemini 3.0 Flash (Multimodal Native, Nov 2025 Release)

## Critical Implementation Rules

### 1. Language & Framework Rules

- **Strict Typing**: No `any`. All API responses must be typed via `src/types/start.ts`.
- **Async Handlers**: Event handlers (e.g., `onPress`) calling async functions MUST handle errors.
    - *Best Practice*: Use a `useAsyncHandler` wrapper to auto-catch to Sentry.
- **Styling**: Use **NativeWind v4** (`className`) exclusively. 
    - *Exception*: Use `StyleSheet` ONLY for `react-native-reanimated` shared values.

### 2. Architecture & Boundaries (CRITICAL)

- **Service Mandate**: All External IO (Supabase, Fetch, FileSystem) **MUST** be encapsulated in `src/features/*/services/*.ts`.
- **Sync Engine**: The "Manual Sync" logic (Proposal Section 5.2) corresponds to `src/lib/sync-engine/queue.ts`. It MUST handle the "Upload File -> Update DB" transaction.
- **Supabase Adapter**: Initializing Supabase Client **MUST** provide a custom `storage` adapter using `expo-secure-store`.
- **Database Mapping**: Use snake_case column names in schema definitions (e.g., `text('created_at')`) to map to camelCase fields; use `.name()` only if supported by the current Drizzle driver/version.

### 3. Audio & Hardware Safeguards

- **Disk Pre-check**: Before `startRecording()`, **MUST** check `FileSystem.getFreeDiskStorageAsync()`. If < 500MB, Block & Alert.
- **Eldery VAD Profile**: VAD sensitivity must use a **3-5s pause tolerance**. Default is too aggressive.
- **File Naming**: `rec_{uuid_v7}.wav`.

### 4. Testing & Quality Strategy

- **Unit Tests**: Co-located (`Button.test.tsx`) using `jest`.
- **Integration Tests**: `tests/integration` for core flows (Recorder -> DB).
- **E2E Testing**: **Maestro** (`.yaml` flows). PREFERRED over Detox for Expo.
    - *Critical Scenarios*: Offline Mode toggle, Audio Permission denial.
- **Fixtures**: Shared Mocks/Factories in `tests/mocks`.

### 5. Privacy & Security

- **Log Scrubbing**: Never log PII or Transcripts to Sentry.
- **Zero Retention**: `deleteAccount()` implies physical file deletion (Overwrite with 0s if possible, or FS delete).

## Development Workflow

- **Migrations**: `drizzle-kit generate` for schema changes. Never edit generated SQL manually.
- **Expo SQLite Migrations**: `drizzle.config.ts` must set `driver: "expo"` and SQL bundling must include `babel-plugin-inline-import` + Metro `.sql` resolver.
- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `chore:`).

## Compatibility & Integration Notes (SDK 54)

- **Expo dependency alignment**: Use `npx expo install` for Expo packages; rerun after SDK upgrades to realign versions.
- **expo-sqlite**: Keep stable `expo-sqlite` (current `16.0.10`) unless Expo docs require `@next` for a future SDK.
- **Supabase URL polyfill**: Add `react-native-url-polyfill/auto` only if URL/crypto globals are missing at runtime.
- **React Query onlineManager**: Must be configured via `@react-native-community/netinfo` or `expo-network`.
- **Drizzle Live Queries**: Require `openDatabaseSync(..., { enableChangeListener: true })` when enabling live queries.
- **Audio stack**: `@siteed/expo-audio-studio` requires `expo prebuild`/dev build; managed-only flows are not supported.
- **LiveKit RN on Expo**: Requires dev builds + `@livekit/react-native-expo-plugin`; pin versions and verify release notes before upgrades.

