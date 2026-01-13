# Story 1.3: 管理长者设备码 (生成/恢复/吊销)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Family User,  
I want to generate a 6-digit code for my parent's device and manage existing codes,  
So that I can link their device and set up a replacement device if one is lost (Recovery).

## Acceptance Criteria

1. **Given** I am logged in as a Family User  
   **When** I navigate to "Add Senior Device"  
   **Then** I can generate a temporary 6-digit code (valid for 15 mins).
2. **Given** active device codes exist  
   **When** I view the device list  
   **Then** I can see active devices linked to the account.
3. **Given** a device code should be revoked
   **When** I revoke a specific device's access
   **Then** it is invalidated on next heartbeat/access check (no forced immediate logout).
4. **Given** abuse prevention  
   **When** I generate codes  
   **Then** generation is rate-limited (max 5 codes/hour per account).

## Tasks / Subtasks

- [x] Task 1: Schema & service design (AC: 1, 2, 3, 4)
  - [x] 1.1: Define tables for device codes/devices (Supabase SQL) with RLS and rate-limit counters.
  - [x] 1.2: Add service stubs in `src/features/auth/services` for generate/list/revoke device codes.
  - [x] 1.3: Define rate-limit logic (5/hour per family account) and code TTL (15 mins).

- [x] Task 2: API/DB implementation plan (AC: 1, 2, 3)
  - [x] 2.1: Plan Supabase RPC for secure code generation/revocation (avoid secrets on client).
  - [x] 2.2: Document RLS policies for device codes/devices (family user scoped).

- [x] Task 3: UI flow plan (AC: 1, 2, 3, 4)
  - [x] 3.1: Identify navigation entry (Settings → Device Management).
  - [x] 3.2: Outline screens: generate code, list devices, revoke action, rate-limit feedback.

- [x] Task 4: Verification plan (AC: 1, 2, 3, 4)
  - [x] 4.1: Manual checks to ensure TTL, rate-limit, and revocation behaviors are testable.

## Dev Notes

### Architecture & Guardrails

- Keep device code logic in `src/features/auth/services`; avoid direct fetch in components.
- Enforce RLS: family users only manage their account’s codes/devices; no PII leaks.
- Use server-side generation (Supabase function/RPC) for 6-digit codes; client should not trust itself for rate limits.

### Implementation Notes

- Code format: 6-digit numeric, TTL 15 mins, rate limit 5/hour/account.
- Tables implemented via Supabase SQL: `public.devices`, `public.device_codes`.
- RPCs: `generate_device_code`, `list_family_devices`, `revoke_device`.
- Device list should be filterable by active/revoked.
- Revocation takes effect on next heartbeat/access check.

### File Structure Requirements

- `drizzle/policies/supabase-device-codes.sql`
- `src/features/auth/services/deviceCodesService.ts`
- (future) RPC/Edge function scripts (doc only in this story)

### Testing Requirements

- Manual validation once implemented (future story may build UI).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: project-context.md#Architecture & Boundaries]
- [Source: project-context.md#Privacy & Security]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- (to be filled during dev-story)

### Completion Notes List

- Defined Supabase SQL for `devices` and `device_codes` tables with RLS.
- Added RPCs for generate/list/revoke device operations with rate limiting and TTL.
- Added client service stubs to call RPCs from app features.
- Implemented Device Management UI entry in Settings; code generation verified with RPC.

### File List

- drizzle/policies/supabase-device-codes.sql
- src/features/auth/services/deviceCodesService.ts
- app/device-management.tsx
- app/(tabs)/settings.tsx
- app/\_layout.tsx
