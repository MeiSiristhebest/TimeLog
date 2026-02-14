# AGENTS.md

> A simple, open format for guiding coding agents. This file follows the [agents.md](https://agents.md/) specification.

---
## Project Overview

**TimeLog** is a voice-first elderly storytelling app that helps seniors record life stories through AI-guided interviews. It uses a **Local-First** architecture with offline-first design, voice AI integration, and family sharing capabilities.

**Key Context Documents:**
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX Spec: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Project Context: `project-context.md`

---

## Technology Stack (Jan 2026)

| Layer | Technology | Version |
|:------|:-----------|:--------|
| Runtime | React Native (Expo SDK) | RN 0.81 / SDK 54 |
| Language | TypeScript (Strict Mode) | 5.x |
| Routing | Expo Router | v6 |
| State (Client) | Zustand | v5 |
| State (Server) | @tanstack/react-query | v5 |
| Styling | NativeWind (TailwindCSS) | v4 |
| UI Rendering | react-native-skia | Latest |
| Database (Local) | expo-sqlite + drizzle-orm | Latest |
| Auth Token | expo-secure-store | Latest |
| App Settings | react-native-mmkv | Latest |
| Backend | Supabase (Auth, Storage, Realtime) | Latest |
| Audio Transport | LiveKit (Python Agent SDK) | Latest |
| STT | Deepgram Nova-3 | Latest |
| VAD | Silero (via @siteed/expo-audio-stream) | Latest |
| AI Model | Gemini 3.0 Flash | Latest |

---

## Setup Commands

```bash
# Install dependencies
npm install

# Start development server (Dev Client required for native modules)
npx expo start --dev-client

# Generate database migrations
npx drizzle-kit generate

# Push schema changes (prototyping only)
npx drizzle-kit push

# Run tests
npm test

# Run linting
npm run lint

# Build for development
eas build --profile development
```

---

## Compatibility Notes (SDK 54)

- Use `npx expo install` for Expo packages; rerun after SDK upgrades to realign versions.
- Keep `expo-sqlite` on stable (current `16.0.10`) unless Expo docs require `@next`.
- Add `react-native-url-polyfill/auto` only if URL/crypto globals are missing at runtime.
- Configure React Query `onlineManager` via `@react-native-community/netinfo` or `expo-network`.
- Live Queries require `openDatabaseSync(..., { enableChangeListener: true })`.
- `@siteed/expo-audio-studio` requires `expo prebuild`/dev build; managed-only flows are not supported.
- LiveKit RN on Expo requires dev builds + `@livekit/react-native-expo-plugin`; pin versions and verify release notes before upgrades.

## Project Structure

```text
TimeLog/
├── app/                           # Expo Router (File-based routing)
│   ├── (auth)/                    # Auth screens (Elder implicit, Family Email/Password + Magic Link Post-MVP)
│   ├── (tabs)/                    # Main tabs (Recorder, Gallery, Family)
│   └── _layout.tsx                # Root Provider
├── src/
│   ├── features/                  # Feature-First Organization
│   │   ├── auth/                  # Authentication feature
│   │   ├── recorder/              # Voice recording feature
│   │   ├── story-gallery/         # Story management feature
│   │   └── family-listener/       # Family sharing feature
│   ├── components/ui/             # Shared Design System (NativeWind)
│   ├── db/                        # Database schema & migrations
│   ├── lib/                       # Core Infrastructure Wrappers
│   │   ├── supabase.ts            # Supabase Client Singleton
│   │   ├── livekit.ts             # LiveKit Room Manager
│   │   ├── sync-engine/           # Offline Queue Logic
│   │   └── logger.ts              # Sentry Wrapper
│   ├── types/                     # Shared Domain Models
│   └── utils/                     # Pure utility functions
├── tests/
│   ├── integration/               # Flow tests
│   ├── e2e/                       # Maestro flows
│   └── mocks/                     # Network/Audio mocks
├── drizzle/                       # Drizzle migrations
└── drizzle.config.ts              # Drizzle configuration
```

---

## Code Style Guidelines

### Naming Conventions

| Context | Convention | Example |
|:--------|:-----------|:--------|
| Database Tables | `snake_case`, plural | `audio_recordings` |
| Database Columns | `snake_case` | `created_at`, `is_synced` |
| Foreign Keys | `singular_table_id` | `user_id`, `story_id` |
| Primary Keys | UUID v7 | Offline-safe conflict resolution |
| REST Endpoints | kebab-case, plural | `/api/v1/audio-recordings` |
| File Uploads | `rec_{uuid_v7}.wav` | Meaningful prefix |
| Components | `PascalCase` | `RecordingButton.tsx` |
| Utilities/Configs | `kebab-case` | `date-utils.ts` |
| Functions/Variables | `camelCase` | `startRecording`, `isOnline` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RECORDING_DURATION` |
| Types/Interfaces | `PascalCase` (no prefix) | `AudioRecording` |

### TypeScript Rules

- **Strict Mode**: Always enabled. No `any` types allowed.
- **API Types**: All API responses must be typed via `src/types/*.ts`.
- **Async Handlers**: Event handlers calling async functions MUST handle errors.
- **Drizzle Mapping**: Use snake_case column names in schema definitions (e.g., `text('created_at')`) to map to camelCase fields; use `.name()` only if supported by the current Drizzle driver/version.

### Styling Rules

- Use **NativeWind v4** (`className`) exclusively.
- **Exception**: Use `StyleSheet` ONLY for `react-native-reanimated` shared values.

---

## Architecture Boundaries

### API Boundaries

- **External IO Mandate**: ALL external calls (Supabase, LiveKit, Fetch, FileSystem) MUST be in `src/features/*/services/*.ts`.
- **Lib Wrappers**: Direct fetch in components is FORBIDDEN. Use `src/lib/*` wrappers.
- **Dependency Rule**: `src/lib` CANNOT import from `src/features`. Use `src/types` for shared definitions.
- **Database**: `src/db/client.ts` is the single source of truth for SQLite access.

### Component Boundaries

- **Smart Components**: `src/features/**/components` - connected to stores/hooks.
- **Dumb Components**: `src/components/ui` - pure props only.
- **Navigation**: `app/` files only handle routing. Logic MUST be in `src/features`.

### Data Boundaries

- **Local First**: Writes always go to SQLite first (via Drizzle).
- **Sync Engine**: `src/lib/sync-engine/queue.ts` handles offline queue.
- **Audio Files**: Stored in `FileSystem.documentDirectory/recordings/`. Metadata in SQLite.

---

## Critical Implementation Rules

### Audio & Hardware Safeguards

- **Disk Pre-check**: Before `startRecording()`, check `FileSystem.getFreeDiskStorageAsync()`. Block if <500MB.
- **Elderly VAD Profile**: VAD sensitivity MUST use 3-5s pause tolerance (default is too aggressive).
- **File Naming**: `rec_{uuid_v7}.wav`.
- **Recording Format**: WAV chunks (Stream-to-Disk) for zero data loss.
- **Storage Format**: Opus 32-48kbps (transcoded after recording).

### Supabase Integration

- **Storage Adapter**: Supabase Client MUST use custom `storage` adapter with `expo-secure-store`.
- **Rate Limiting**: Device code authentication: 5 attempts per 10 minutes.

### Error Handling

```json
{
  "error": {
    "code": "AUTH_DEVICE_CODE_EXPIRED",
    "message": "User friendly message",
    "httpStatus": 401
  }
}
```

- HTTP Status: Standard 4xx/5xx.
- Code: TimeLog-specific error codes.
- Message: User-friendly (Humble Persona).

### Network as State

- Network failures are NOT exceptions. They are state transitions.
- Offline → Enqueue to Sync Queue → Promise Resolves (Optimistic UI).
- Online → Drain Sync Queue.

---

## Testing Instructions

### Test Structure

- **Unit Tests**: Co-located (`Button.test.tsx` next to `Button.tsx`).
- **Integration Tests**: `tests/integration/` for core flows.
- **E2E Tests**: Maestro (`.yaml` flows) - preferred over Detox for Expo.
- **Fixtures**: Shared mocks in `tests/mocks/`.

### Critical Test Scenarios

- Offline Mode toggle behavior
- Audio Permission denial handling
- Recorder → DB → Sync flow
- Family Email/Password + device binding flow

### Commands

```bash
# Run all tests
npm test

# Run specific test
npx jest -t "<test name>"

# Run E2E tests (Maestro)
maestro test tests/e2e/*.yaml
```

---

## Privacy & Security

- **Log Scrubbing**: NEVER log PII or Transcripts to Sentry.
- **Zero Retention**: `deleteAccount()` implies physical file deletion.
- **Token Storage**: Use `expo-secure-store` (iOS Keychain / Android Keystore).
- **Local Encryption**: AES-256 for sensitive local data.

---

## PR & Commit Instructions

- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `chore:`).
- **Pre-commit**: Always run `npm run lint` and `npm test` before committing.
- **Migrations**: Use `drizzle-kit generate`. Never edit generated SQL manually.

---

## Accessibility (WCAG 2.2 AAA)

- **Contrast Ratio**: Minimum 7:1.
- **Touch Targets**: Minimum 48dp.
- **Font Size**: Minimum 24pt for body text.
- **Voice First**: Primary interaction mode for elderly users.

---

## Agent-Specific Notes

### Before Making Changes

1. Read `project-context.md` for critical rules.
2. Check `architecture.md` for architectural decisions.
3. Verify package exists via web search before importing.

### Common Pitfalls

- ❌ Using `any` types - always define proper interfaces.
- ❌ Direct Supabase/fetch calls in components - use services.
- ❌ Default VAD settings - use Elderly Profile (3-5s pause).
- ❌ Forgetting disk space check before recording.
- ❌ Logging sensitive data to Sentry.
- ❌ Manual `useCssElement` wrapping for NativeWind v5 (Fails to merge styles). Use `cssInterop` instead.

### Environment

- **OS**: Windows 11
- **Shell**: PowerShell 7+

## Styling Rules (Evidence-Based)

### Default: NativeWind v5
- Use `className` for ALL static components
- Leverage `@/tw/animated` for animated components

### When to Use StyleSheet:
1. ✅ Performance-critical paths (Recorder, WaveformVisualizer)
2. ✅ Complex computed styles requiring calculations
3. ✅ Type-safe style objects

### Animated Components:
```tsx
// ✅ Correct Pattern
import { Animated } from '@/tw/animated';
<Animated.View className="..." entering={FadeIn} />

// ✅ For complex animations
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }]
}));
<Animated.View className="..." style={animatedStyle} />

// ❌ NEVER
<Animated.View className="...">
  <RegularComponent /> {/* Regular components inside won't animate! */}
</Animated.View>
```

### Mixing is OK:

```tsx
<View className="p-4 bg-white" style={dynamicStyle} />
```

