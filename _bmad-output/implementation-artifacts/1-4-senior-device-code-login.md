# Story 1.4: 长者用户隐式登录与设备绑定

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Senior User,  
I want the app to sign me in automatically on first launch,  
So that I don't need to deal with emails or complex passwords.

## Acceptance Criteria

1. **Given** I select "Storyteller" on first launch  
   **When** the app initializes  
   **Then** a device-bound session is created and stored securely.
2. **Given** device binding is required  
   **When** the session is created  
   **Then** a shareable 6-digit Device Code is generated for family linking.
3. **Given** senior UX simplicity  
   **When** I use the app  
   **Then** no login form is shown to the senior user.

## Tasks / Subtasks

- [x] Task 1: Auth/binding flow (AC: 1, 2, 3)
  - [x] 1.1: Add a first-launch “Select role” screen with “Storyteller” option (senior implicit login).
  - [x] 1.2: On selecting Storyteller, create a device session: call `generate_device_code` RPC and persist device info locally (SecureStore/MMKV).
  - [x] 1.3: Store session/device info securely; ensure no email/password UI is shown for seniors.

- [x] Task 2: Device code surfacing (AC: 2)
  - [x] 2.1: Show the generated 6-digit Device Code to the senior for sharing with family (copy/share minimal UI).
  - [x] 2.2: Respect TTL and rate limit errors with friendly messaging; regenerate option if expired.

- [x] Task 3: Navigation & guardrails (AC: 1, 3)
  - [x] 3.1: Ensure Storyteller path routes to main tabs without login prompts.
  - [x] 3.2: Guard family-only screens behind auth; seniors stay in their implicit session.

- [x] Task 4: Verification (AC: 1, 2, 3)
  - [x] 4.1: Manual: first launch -> choose Storyteller -> device code shown; app usable without login; code can be read by family (via 1-3 flow).

## Dev Notes

### Architecture & Guardrails

- Use existing `generate_device_code` RPC + `devices`/`device_codes` tables.
- Keep logic in services; routes only orchestrate UI.
- Store device session in SecureStore/MMKV; no email/password prompts for seniors.
- Revocation takes effect on next heartbeat/access check (already defined in 1-3).

### Implementation Notes

- Role selector can live in `app/role.tsx` or similar; persist chosen role to skip on next launch.
- Device code UI should be large, high contrast (Heritage palette) for senior readability.
- Provide a “Regenerate code” option if expired; enforce backend rate limit messaging.

### File Structure Requirements

- `app/role.tsx` (role selection)
- `app/device-code.tsx` (senior-facing code display) or integrated into role flow
- `src/features/auth/services/deviceCodesService.ts` (reuse)
- Local storage key for role + device info (SecureStore/MMKV)

### Testing Requirements

- Manual: first-run flow, code display, no login form, code usable by family binding flow (1-3).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: project-context.md#Architecture & Boundaries]
- [Source: project-context.md#Privacy & Security]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `npm run lint`
- `npx prettier --write ...`

### Completion Notes List

- Added first-launch role selector and storyteller path that auto-generates device code; bypasses login forms for seniors.
- Device code screen shows 6-digit code with TTL/regenerate; rate-limit errors handled with navigation escape.
- Navigation guards route seniors to device-code, family to tabs; role switch added in Settings for testing.

### File List

- app/index.tsx
- app/role.tsx
- app/device-code.tsx
- app/\_layout.tsx
- app/(tabs)/settings.tsx
- src/features/auth/services/roleStorage.ts
- src/features/auth/services/deviceCodesService.ts
