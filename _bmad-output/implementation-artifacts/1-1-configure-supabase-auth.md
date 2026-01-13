# Story 1.1: 配置 Supabase Auth 与基础 RLS

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,  
I want to initialize the Supabase client and configure basic Row Level Security (RLS) policies,  
so that user data is secure by default and accessible only to authorized users.

## Acceptance Criteria

1. **Given** a Supabase project is created  
   **When** I configure the Auth providers (Email/Password + Magic Link Post-MVP)  
   **Then** I can successfully initialize the Supabase client in the App.
2. **Given** RLS is required  
   **When** I apply policies  
   **Then** a "deny all" RLS policy is applied to all tables by default.
3. **Given** user profiles are protected  
   **When** I query the `profiles` table  
   **Then** authenticated users can only select/read their own profile rows.

## Tasks / Subtasks

- [x] Task 1: Client initialization & env wiring (AC: 1)
  - [x] 1.1: Ensure `src/lib/supabase.ts` loads DSN/anon key from env and warns when missing.
  - [x] 1.2: Keep SecureStore-backed auth storage (per project rules) and Expo Router compatibility.
  - [x] 1.3: Add `.env.example` placeholders for Supabase public URL and anon key.

- [x] Task 2: RLS policy guidance (AC: 2, 3)
  - [x] 2.1: Add a SQL policy snippet file for Supabase: default deny all; allow select on `profiles` where `id = auth.uid()`.
  - [x] 2.2: Document how to apply the policy via Supabase SQL or Dashboard; no secrets in repo.

- [ ] Task 3: Verification (AC: 1, 2, 3)
  - [x] 3.1: Run lint/format and ensure app builds with env variables present.
  - [x] 3.2: Manual: with valid Supabase envs, confirm client creation succeeds (no runtime errors) and sample `profiles` query obeys RLS.

## Dev Notes

### Architecture & Guardrails

- External IO must live in `src/features/*/services/*.ts`; `src/lib/supabase.ts` is the single client.
- No secrets committed; use env vars (`EXPO_PUBLIC_*` for client). SecureStore required for auth storage.
- RLS: default deny; allow self-access policies only. Avoid logging PII.

### Implementation Notes

- Environment variables needed: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- For RLS: enable RLS on `profiles`, add policy `using (id = auth.uid())` for select; keep a deny-all default.
- Magic Link is Post-MVP; keep Email/Password as baseline. Avoid direct fetch; use Supabase client or services.

### File Structure Requirements

- `src/lib/supabase.ts`
- `drizzle/policies/supabase-rls.sql` (guidance)
- `.env.example`

### Testing Requirements

- Manual: app loads without Supabase init errors when env vars set; lint passes.
- Optional manual: with valid Supabase session, selecting `profiles` returns only current user (confirm via Supabase SQL console).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: project-context.md#Architecture & Boundaries]
- [Source: project-context.md#Privacy & Security]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `npm run lint`
- `npx prettier --write ...`

### Completion Notes List

- Supabase client init verified with env vars; test user sign-in and `profiles` query passed under RLS.
- RLS SQL prepared (creates `profiles` if missing, deny-all default, self-select policy).
- Settings test actions available for Sentry and Supabase diagnostics.

### File List

- src/lib/supabase.ts
- drizzle/policies/supabase-rls.sql
- .env.example
- app/(tabs)/settings.tsx
- src/features/auth/services/supabaseTest.ts
