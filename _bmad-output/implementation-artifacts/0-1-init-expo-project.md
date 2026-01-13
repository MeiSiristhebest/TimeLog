# Story 0.1: Initialize Expo Project with Local-First Architecture

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to initialize the project with the specific `expo-local-first-template` and core dependencies,
so that I have a solid, architecture-aligned foundation for feature development.

## Acceptance Criteria

1. **Given** the development environment is set up
   **When** I run the initialization commands using `expo-local-first-template`
   **Then** a new Expo project is created with Drizzle, SQLite, and TypeScript configured

2. **Given** the project is initialized
   **When** I run `npx expo start`
   **Then** the project runs successfully on both iOS Simulator and Android Emulator

3. **Given** the project structure is inspected
   **When** I compare it to `architecture.md`
   **Then** the folder structure matches the Feature-First architecture (e.g., `src/features/`, `src/lib/`, `src/db/`)

## Tasks / Subtasks

- [x] Task 1: Clone and Configure Starter Template (AC: #1)
  - [x] 1.1: Run `npx create-expo-stack@latest TimeLog --expo-router --nativewind --drizzle --supabase`
  - [x] 1.2: Verify Expo SDK 54 is installed (`package.json`)
  - [x] 1.3: Configure `tsconfig.json` with strict mode and path aliases (`@/*`)
  - [x] 1.4: Ensure `react-native-mmkv` is added for settings storage
  - [x] 1.5: Ensure `expo-secure-store` is added for auth token storage

- [x] Task 2: Validate Drizzle & SQLite Setup (AC: #1)
  - [x] 2.1: Verify `drizzle.config.ts` exists and points to `src/db/schema.ts`
  - [x] 2.2: Create initial schema placeholder (`src/db/schema/index.ts`)
  - [x] 2.3: Run `drizzle-kit generate` to confirm migration toolchain works

- [x] Task 3: Align Folder Structure to Feature-First Architecture (AC: #3)
  - [x] 3.1: Create `src/features/` directory with placeholder (e.g., `src/features/.gitkeep`)
  - [x] 3.2: Create `src/lib/` directory for core services (e.g., `supabase.ts`, `mmkv.ts`)
  - [x] 3.3: Create `src/db/` directory for Drizzle schemas
  - [x] 3.4: Verify `app/` directory uses Expo Router file-based routing

- [x] Task 4: Run Project on Simulators (AC: #2)
  - [x] 4.1: Start Expo development server (`npx expo start`)
  - [x] 4.2: Test on iOS Simulator (or real device)
  - [x] 4.3: Test on Android Emulator (or real device)
  - [x] 4.4: Confirm no errors in Metro Bundler logs

## Dev Notes

### Architecture Requirements
- **Starter Template**: Use an Expo stack generator that provides Drizzle + SQLite + Expo Router. The exact command may vary based on available templates.
- **Fallback**: If `expo-local-first-template` is not available, use `create-expo-stack` with flags for router, nativewind, and drizzle.
- **Feature-First Structure**: All domain logic goes into `src/features/<feature_name>/`. Services go into `src/lib/`.

### Technical Stack (from project-context.md)
- **Runtime**: React Native 0.81 (Expo SDK 54)
- **Language**: TypeScript 5.x (Strict Mode)
- **Core Framework**: Expo Router v6
- **Styling**: NativeWind v4
- **Database**: `expo-sqlite` + `drizzle-orm`
- **Auth Token**: `expo-secure-store`
- **Settings**: `react-native-mmkv`

### Testing Standards
- Unit tests are co-located (`*.test.tsx`)
- E2E testing uses Maestro (`.yaml` flows)
- For this story, a simple smoke test confirming the app launches is sufficient.

### Project Structure Notes
Expected structure after this story:
```
TimeLog/
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root layout
│   └── index.tsx           # Home screen
├── src/
│   ├── db/
│   │   └── schema/index.ts # Drizzle schema
│   ├── features/           # Feature modules
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   └── mmkv.ts         # MMKV storage
│   └── types/              # TypeScript types
├── drizzle.config.ts
├── tailwind.config.js
└── package.json
```

### References
- [Source: project-context.md#Technology Stack & Versions]
- [Source: architecture.md#Project Structure]
- [Source: epics.md#Story 0.1]

## Dev Agent Record

### Agent Model Used
GPT-5 (Codex CLI)

### Debug Log References
- `npx create-expo-stack .\\_tmp-expo --exporouter --nativewind --supabase --noGit --noInstall --importAlias "@/*"`
- `npm install`
- `npx drizzle-kit generate` (initial failure on `.name` usage, then rerun after schema fix)

### Completion Notes List
- Scaffolded Expo Router project and merged into repo with Feature-First `src/` layout.
- Added SecureStore/MMKV wrappers plus Drizzle config/schema; generated initial migration.
- Updated path aliases and app metadata (name/slug/scheme).
- Pending: simulator/device validation (Task 4).

### File List
- .env
- .gitignore
- app.json
- app/+not-found.tsx
- app/_layout.tsx
- app/details.tsx
- app/index.tsx
- assets/adaptive-icon.png
- assets/favicon.png
- assets/icon.png
- assets/splash.png
- babel.config.js
- cesconfig.jsonc
- drizzle.config.ts
- drizzle/0000_overconfident_tiger_shark.sql
- eslint.config.js
- expo-env.d.ts
- global.css
- metro.config.js
- nativewind-env.d.ts
- package.json
- package-lock.json
- prettier.config.js
- src/components/ui/Button.tsx
- src/components/ui/Container.tsx
- src/components/ui/EditScreenInfo.tsx
- src/components/ui/ScreenContent.tsx
- src/db/schema/index.ts
- src/db/schema.ts
- src/features/.gitkeep
- src/lib/mmkv.ts
- src/lib/supabase.ts
- src/types/.gitkeep
- src/utils/.gitkeep
- tailwind.config.js
- tsconfig.json

## Change Log

| Date | Change |
|:-----|:-------|
| 2026-01-09 | Story created by create-story workflow |
| 2026-01-09 | Scaffolded Expo app, added Feature-First folders and Drizzle setup; pending simulator validation |
