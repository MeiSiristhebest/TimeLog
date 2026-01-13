# Story 1.5: 自动登录与启动页 (Splash Screen)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,  
I want the app to remember me and load quickly,  
So that I can start using it immediately without logging in every time.

## Acceptance Criteria

1. **Given** I have previously logged in  
   **When** I relaunch the App  
   **Then** I see a branded Splash Screen while the session restores.
2. **Given** a valid session exists  
   **When** restore completes  
   **Then** I am automatically taken to the Home screen.
3. **Given** the session is invalid/expired  
   **When** restore fails  
   **Then** I am routed to the login screen with a friendly prompt.

## Tasks / Subtasks

- [x] Task 1: Splash screen & restore hook (AC: 1, 2, 3)
  - [x] 1.1: Add splash/loader route that attempts session restore from SecureStore/Supabase.
  - [x] 1.2: On success, navigate to Home tabs; on failure, navigate to login with friendly message.
  - [x] 1.3: Ensure Splash uses branded styling (no system blue) and high readability.

- [x] Task 2: Session state management (AC: 2, 3)
  - [x] 2.1: Add a simple auth/session store (Zustand) to track restoring/authenticated/unauthenticated states.
  - [x] 2.2: Wire Supabase `auth.getSession()` on app start; handle expired tokens by clearing and redirecting to login.

- [x] Task 3: Verification (AC: 1, 2, 3)
  - [x] 3.1: Run lint/format.
  - [x] 3.2: Manual: logged-in user relaunch → auto to Home; expired/cleared session → login prompt after splash; splash shows branded screen.

## Dev Notes

### Architecture & Guardrails

- Auth state should live in a store (Zustand) or a lightweight hook; avoid scattering session checks.
- Supabase client already persists session via SecureStore; ensure restore path handles null/expired gracefully.
- No login form for seniors; redirect seniors per role selection logic; families go to login when session missing.

### Implementation Notes

- Consider `app/(splash)/index.tsx` or `app/splash.tsx` as the initial route from `app/index.tsx`.
- Use NativeWind for splash visuals; Heritage palette; large type.
- If role is storyteller but session restore fails, route to device-code flow; if family, route to login.

### File Structure Requirements

- `app/(splash)/index.tsx` or `app/splash.tsx`
- `src/features/auth/store/authStore.ts` (or similar)

### Testing Requirements

- Manual only per AC.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: project-context.md#Architecture & Boundaries]
- [Source: project-context.md#Privacy & Security]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `npm run lint`
- `npx prettier --write ...`

### Completion Notes List

- Splash route restores Supabase session and routes based on role (Storyteller → device-code, Family → tabs/login).
- Added Zustand auth store for restoring/authenticated/unauthenticated state.
- Manual verification passed for logged-in/expired sessions and role-based routing; lint/format clean.

### File List

- app/splash.tsx
- app/index.tsx
- app/\_layout.tsx
- src/features/auth/store/authStore.ts
