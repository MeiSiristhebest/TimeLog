# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TimeLog** is a voice-first mobile application for elderly users (65+) to record life stories through AI-guided
interviews. The app uses an **offline-first architecture** with dual-track authentication (elderly device code + family
email/password).

**Tech Stack:**

- Expo SDK 54 (React Native 0.81.5)
- NativeWind v5 (Tailwind CSS v4)
- Drizzle ORM + expo-sqlite (local storage)
- Supabase (auth, storage, backend)
- Zustand v5 (state management)
- React Query (server state)
- TypeScript 5.9 (strict mode)

## Essential Commands

### Development

```bash
# Start development server (requires dev build for native modules)
npx expo start

# Run on specific platforms
npx expo run:android
npx expo run:ios

# Create development build
eas build --profile development
```

### Database Management

```bash
# Generate migration files (production workflow)
npx drizzle-kit generate

# Push schema directly to DB (prototyping only)
npx drizzle-kit push

# Migrations run automatically on app startup via useMigrations hook
```

### Code Quality

```bash
# Lint and format check
npm run lint

# Auto-fix linting and formatting
npm run format

# Run tests
npm test

# Run specific test file
npx jest path/to/test.test.ts
```

### Building

```bash
# Prebuild native directories (required after adding native modules)
npx expo prebuild

# Build for production
eas build --platform android
eas build --platform ios
```

## Architecture Fundamentals

### Offline-First Design

- **Write Path:** All data writes go to SQLite first (via Drizzle), then sync to Supabase in background
- **Audio Files:** Stored in `FileSystem.documentDirectory/recordings/` with metadata in SQLite
- **Zero Data Loss:** Recording uses stream-to-disk approach - audio chunks saved immediately to survive crashes/power
  loss
- **Network as State:** Network failures are state transitions, not exceptions. Use `SyncClient` wrapper, never direct
  fetch in components

### Feature-First Structure

```
src/
├── features/           # Domain-specific modules
│   ├── auth/          # Authentication (device code + email/password)
│   ├── recorder/      # Voice recording with VAD
│   ├── story-gallery/ # Story playback and management
│   ├── family/        # Family invite system
│   ├── family-listener/ # Family listener features & comments
│   ├── home/          # Home screen & contextual insights
│   └── settings/      # User preferences & notifications
├── components/ui/     # Shared design system (dumb components)
├── lib/               # Infrastructure wrappers (Supabase, Sync Engine)
├── db/                # Database schema and client
└── types/             # Shared domain models (prevents circular deps)
```

**Dependency Rule:** `src/lib` CANNOT import from `src/features`. Use `src/types` for shared interfaces.

### Dual-Track Authentication

1. **Elderly Users:** Device code (QR scan) → implicit session, no password
2. **Family Users:** Email/Password login with password reset flow
3. Token storage: `expo-secure-store` (iOS Keychain / Android Keystore)

### Voice Recording Pipeline

- **Format:** 16kHz WAV (for transcription quality)
- **VAD:** Elderly-tuned profile with 4s silence threshold (slower speech patterns)
- **Service:** `recorderService.ts` uses `@siteed/expo-audio-studio` for advanced audio capture
- **Safety:** Pre-flight disk space check (500MB minimum), MD5 checksums on upload
- **Fallback:** `expo-av` Recording API available as backup

## Critical Patterns & Rules

### Naming Conventions

- **Database:** `snake_case` for all tables/columns (e.g., `audio_recordings`, `created_at`)
- **TypeScript:** `camelCase` for variables/functions, `PascalCase` for components/types
- **Files:** `kebab-case` for utilities, `PascalCase` for components (e.g., `RecordingButton.tsx`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RECORDING_DURATION`)

### Database Patterns

- **Primary Keys:** Use UUID-like IDs (fallback to time-based if crypto.randomUUID unavailable)
- **Migrations:** Serial only - one pending migration at a time, forward-only
- **Schema Location:** `src/db/schema/` with barrel export in `index.ts`
- **Drizzle Config:** Uses `driver: 'expo'` and `dialect: 'sqlite'`

### Error Handling

- **Format:** Envelope pattern with custom error codes
  ```json
  {
    "error": {
      "code": "AUTH_DEVICE_CODE_EXPIRED",
      "message": "User-friendly message",
      "httpStatus": 401
    }
  }
  ```
- **UI:** Toast for transient errors, full screen for blocking errors
- **Global:** ErrorBoundary for React crashes
- **Network:** Never throw on network failure - enqueue to sync queue instead

### State Management (Zustand)

- **Organization:** Feature-scoped stores (e.g., `useAuthStore`, `useRecorderStore`)
- **Actions:** `camelCase` verbs (e.g., `setRecordingState`, `uploadRecording`)
- **Selectors:** Use specific selectors: `useAuthStore(s => s.isAuthenticated)`

### Testing Patterns

- **Unit Tests:** Co-located with components (`Button.test.tsx` next to `Button.tsx`)
- **Integration Tests:** `tests/integration/` for multi-component flows
- **Mocking:** Network/audio mocks in `tests/mocks/`

### API Integration

- **Abstraction:** ALL external calls (Supabase, LiveKit, Deepgram) MUST go through `src/lib/*` wrappers
- **Direct Fetch:** FORBIDDEN in components - always use service layer
- **Sync Engine:** Located in `src/lib/sync-engine/` - handles offline queue and retry logic

## TypeScript Configuration

- **Strict Mode:** Enabled
- **Path Alias:** `@/*` maps to `src/*` (configured in tsconfig.json and jest.config.js)
- **Example:** `import { supabase } from '@/lib/supabase'`

## Performance Requirements

Critical non-functional requirements from PRD:

- **VAD Latency:** <200ms silence detection after speech stops
- **Cold Start:** <2s from launch to ready state
- **AI Timeout:** 2000ms threshold for cloud AI fallback
- **Offline Switch:** Within 2s after 3 failed network probes

## Accessibility (Elderly-Focused)

- **Text Size:** Support >24pt for body text (WCAG 200% resize)
- **Touch Targets:** Core buttons ≥48x48dp (exceeds WCAG 2.2 AA)
- **Contrast:** Core text 7:1 (WCAG AAA), decorative text 4.5:1 (AA)
- **Auth Flow:** No cognitive tests (WCAG 2.2 Criterion 3.3.8 compliant)

## Privacy & Compliance

- **Zero Retention:** Third-party APIs configured for no data retention (enterprise tier)
- **Local Encryption:** SQLite uses AES-256
- **Right to Erasure:** Account deletion triggers 24h physical deletion (GDPR)
- **Logging:** Sentry `beforeSend` hook MUST scrub transcripts/PII

## SDK 54 Specific Guidance

- **Package Installation:** Always use `npx expo install <package>` to ensure version alignment
- **SQLite:** Use stable `expo-sqlite@16.0.10` unless Expo docs require `@next`
- **Drizzle Live Queries:** Requires `openDatabaseSync(..., { enableChangeListener: true })`
- **Audio Recording:** Use `@siteed/expo-audio-studio` for primary recording, `expo-av` as fallback
- **Native Modules:** Any new native dependency requires `npx expo prebuild` and dev build
- **Lists:** Use `@shopify/flash-list` for performant large lists (not FlatList)
- **Animations:** Use `lottie-react-native` for complex animations, `react-native-reanimated` for transitions

## Common Pitfalls

1. **Rule of Three:** Do NOT extract shared code until used in 3 distinct places (avoid premature abstraction)
2. **Barrel Files:** Avoid `index.ts` exports unless needed for public API (prevents circular deps)
3. **Backwards Compatibility:** Don't create compatibility hacks - if unused, delete it completely
4. **Network Errors:** Network failures are state, not exceptions - use sync queue pattern
5. **File System API:** Use `expo-file-system/legacy` for SDK 54 compatibility

## Project Documentation

Key planning artifacts in `_bmad-output/planning-artifacts/`:

- `prd.md` - Product Requirements Document
- `architecture.md` - Architecture decisions and patterns
- `ux-design-specification.md` - UX/UI guidelines
- `epics.md` - Feature epics and user stories

Implementation stories in `_bmad-output/implementation-artifacts/` track completed work.
