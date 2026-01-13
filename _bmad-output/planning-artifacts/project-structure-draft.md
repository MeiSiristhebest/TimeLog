## Project Structure & Boundaries

### Complete Project Directory Structure

```text
TimeLog/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, Type Check, Test
│       └── build-preview.yml      # EAS Build Preview
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   ├── splash.png
│   └── fonts/                     # Custom fonts (Inter/Roboto)
├── app/                           # Expo Router (File-based routing)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # Auth Entry (Elder implicit, Family Email/Password + Magic Link Post-MVP)
│   │   └── verify.tsx             # Code Verification
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # Recorder (Home)
│   │   ├── gallery.tsx            # Story Gallery
│   │   └── family.tsx             # Family Listener Activity
│   ├── _layout.tsx                # Root Provider (Auth, Query, Theme)
│   ├── +not-found.tsx
│   └── modal.tsx 
├── src/
│   ├── features/                  # Feature-First Organization
│   │   ├── auth/
│   │       ...
│   │   ├── recorder/
│   │   │   ├── components/        # BigRedButton, AudioVisualizer
│   │   │   ├── hooks/             # useRecorder (Siteed/Expo-Audio)
│   │   │   ├── services/          # vad-service.ts, file-system-service.ts
│   │   │   └── config/            # recorder-sync-config.ts (Retry policy, Priority)
│   │   ├── story-gallery/
│       ...
│   ├── components/
│   │   ├── ui/                    # Shared Design System (NativeWind)
│   │   │   ├── feedback/          # toast.tsx, spinner.tsx
│   │   │   ├── forms/             # button.tsx, input.tsx
│   │   │   ├── layout/            # card.tsx, divider.tsx
│   │   │   └── typography/        # text.tsx
│   │   └── layout/                # ScreenWrapper, SafeAreaView
│   ├── db/
│       ...
│   ├── lib/                       # Core Infrastructure Wrappers
│   │   ├── supabase.ts            # Supabase Client Singleton
│   │   ├── livekit.ts             # LiveKit Room Manager
│   │   ├── sync-engine/           # [Refactored] Network-as-State Engine
│   │   │   ├── queue.ts           # Offline Queue Logic
│   │   │   └── transport.ts       # Network Execution
│   │   └── logger.ts              # Sentry Wrapper
│   ├── types/                     # [NEW] Shared Domain Models (Prevent Circular Deps)
│   │   ├── entities.ts            # User, Recording, Story
│   │   └── api.ts                 # Shared API Interfaces
│   └── utils/
├── tests/
│   ├── integration/               # Flow Tests (Recorder -> DB -> Sync)
│   ├── e2e/                       # Maestro Flows
│   └── mocks/                     # Network/Audio Mocks
│   # Note: Unit tests are co-located with components (Button.test.tsx)├── drizzle/                       # Drizzle Kit Config & Output
├── app.json                       # Expo Config
├── babel.config.js
├── drizzle.config.ts              # Drizzle Kit Configuration
├── metro.config.js                # Metro Bundler Config (SQL support)
├── package.json
├── tailwind.config.js             # NativeWind Configuration
└── tsconfig.json
```

### Architectural Boundaries

**API Boundaries:**
- **External:** All external calls (Supabase, LiveKit, Deepgram) MUST go through `src/lib/*` wrappers. Direct fetch in components is FORBIDDEN.
- **Sync Boundary:** `src/lib/sync-engine` handles mechanism (Queue/Transport). Feature `config/` defines policy (What/When).
- **Dependency Rule:** `src/lib` CANNOT import from `src/features`. Use `src/types` for shared definitions.
- **Database:** `src/db/client.ts` is the single source of truth for SQLite access.

**Component Boundaries:**
- **Smart vs Dumb:** `src/features/**/components` are Smart (connected to stores/hooks). `src/components/ui` are Dumb (pure props).
- **Navigation:** `app/` files only handle routing params and layout. Logic MUST be delegated to `src/features`.

**Data Boundaries:**
- **Local First:** Writes always go to SQLite first (via Drizzle).
- **Replication:** `SyncService` (background) listens to SQLite changes or SyncQueue to push to Supabase.
- **Audio Files:** Stored in `FileSystem.documentDirectory/recordings/`. Metadata in SQLite.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

*   **Recorder Epic** (FR1-6)
    *   UI: `src/features/recorder/components`
    *   Logic: `src/features/recorder/hooks/useRecorder.ts`
    *   Storage: `src/features/recorder/services/file-system-service.ts`
    *   Route: `app/(tabs)/index.tsx`

*   **Auth Epic** (FR16-19)
    *   UI: `src/features/auth/components`
    *   Service: `src/features/auth/services/auth-service.ts`
    *   Route: `app/(auth)/*`

*   **Offline Capability** (NFR6)
    *   Core: `src/lib/sync-client.ts`
    *   Queue: SQLite table `sync_queue` (in `schema.ts`)

### Integration Points

**Internal Communication:**
- **Global State:** Zustand Stores in `src/features/*/stores` (e.g., `useRecorderStore`).
- **Events:** `DeviceEventEmitter` for low-level audio events (VAD triggers) to UI.

**External Integrations:**
- **Supabase:** Auth & Data Sync (via `lib/supabase.ts`).
- **LiveKit:** Real-time Transport (via `lib/livekit.ts`).
- **Sentry:** Error boundary integration (via `lib/logger.ts`).

### Development Workflow Integration

- **Development:** `npx expo start --dev-client` (Native code required).
- **Database:** `npx drizzle-kit push` (Prototyping) or `generate` (Migration).
- **Build:** `eas build --profile development` (Internal Testing).
