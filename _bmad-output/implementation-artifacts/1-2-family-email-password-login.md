# Story 1.2: 家人用户 Email/Password 登录

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Family User,  
I want to log in using Email/Password,  
So that I can reliably access the family dashboard.

## Acceptance Criteria

1. **Given** I am on the Welcome screen  
   **When** I enter a valid email and password and submit  
   **Then** I am authenticated and redirected to the Home screen.
2. **Given** invalid credentials  
   **When** I attempt to log in  
   **Then** I see a friendly error with retry guidance.
3. **Given** I forgot my password  
   **When** I tap "Forgot Password"  
   **Then** I can request a reset email.

## Tasks / Subtasks

- [x] Task 1: Auth service wiring (AC: 1, 2, 3)
  - [x] 1.1: Add `signInWithEmailPassword` service using Supabase client (env-based URL/key, SecureStore auth).
  - [x] 1.2: Add `sendResetEmail` service with redirect URL from env (no hardcoded secrets).
  - [x] 1.3: Document required env (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_RESET_REDIRECT`, optional test creds).

- [x] Task 2: Login screen (AC: 1, 2, 3)
  - [x] 2.1: Create `app/login.tsx` (or group under `(auth)`) with email/password form, NativeWind styles, and friendly errors.
  - [x] 2.2: Add "Forgot Password" action invoking reset email; show success/error feedback.
  - [x] 2.3: Provide navigation entry from Settings (or landing) to reach login screen.
  - [x] 2.4: On success, navigate to Home tab.

- [x] Task 3: Verification (AC: 1, 2, 3)
  - [x] 3.1: Run lint/format.
  - [x] 3.2: Manual: login succeeds with valid user and redirects to Home; invalid creds show friendly error; reset email request succeeds.

## Dev Notes

### Architecture & Guardrails

- Supabase client lives in `src/lib/supabase.ts`; services in `src/features/auth/services`.
- UI-only in routes; business logic stays in services/hooks. No direct fetch/Supabase calls in components.
- No PII in logs; handle errors gracefully with user-friendly messaging.

### Implementation Notes

- Use NativeWind `className` for inputs/buttons; maintain 48dp targets and 24pt body text.
- Redirect URL for password reset: `EXPO_PUBLIC_SUPABASE_RESET_REDIRECT` (fallback to `timelog://login` if missing).
- Keep test buttons/dev utilities limited to Settings if needed; avoid blocking overlays.

### File Structure Requirements

- `src/features/auth/services/authService.ts`
- `app/login.tsx` (or `app/(auth)/login.tsx`)
- (optional) `app/_layout.tsx` update for stack screen options

### Testing Requirements

- Manual validation per AC; no automated tests required in this story.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: project-context.md#Architecture & Boundaries]
- [Source: project-context.md#Privacy & Security]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `npm run lint`
- `npx prettier --write ...`

### Completion Notes List

- Added Supabase auth services (sign-in, reset email) with env-driven config and friendly errors.
- Implemented login screen with NativeWind styling, forgot password action, and success navigation to Home.
- Linked login entry from Settings for easy access.
- Lint/format passing; manual auth verification completed (login + reset email flow confirmed).

### File List

- src/features/auth/services/authService.ts
- app/login.tsx
- app/\_layout.tsx
- app/(tabs)/settings.tsx
- .env.example
