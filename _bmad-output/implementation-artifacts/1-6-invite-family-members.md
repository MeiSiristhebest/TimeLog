# Story 1.6: 邀请家庭成员 (多账号共享)

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Family User (Admin),  
I want to invite other family members via email to manage the same senior account,  
So that my siblings can also listen to stories and interact.

## Acceptance Criteria

1. **Given** I am an admin of the family account  
   **When** I enter a sibling's email address  
   **Then** they receive an invitation link via email.
2. **Given** the invite is accepted  
   **When** they open the invitation  
   **Then** they are added to the `family_members` table.
3. **Given** membership is granted  
   **When** the invite is accepted  
   **Then** they gain access to view and comment on the senior's stories.

## Tasks / Subtasks

- [x] Task 1: Data/API design (AC: 1, 2, 3)
  - [x] 1.1: Define `family_members` table schema (role, status, invited_by, created_at).
  - [x] 1.2: Define invite token flow (Supabase function or RPC) to create and validate invitations.
- [x] 1.3: Plan invite sharing: no email service for MVP — return invite link/token to front-end for copy/QR and deep link.

- [x] Task 2: Client services (AC: 1, 2, 3)
  - [x] 2.1: Add service stubs for sending invites and accepting invites (Supabase RPC).
- [x] 2.2: Add env placeholder for invite redirect URL (`EXPO_PUBLIC_INVITE_REDIRECT_URL`).

- [x] Task 3: UI flow (AC: 1, 2, 3)
  - [x] 3.1: Add an invite screen (Family Admin) to submit an email and show success/error.
  - [x] 3.2: Add an accept-invite handler (deep link landing) to join the family account.

- [ ] Task 4: Verification (AC: 1, 2, 3)
  - [ ] 4.1: Manual: send invite -> receive email -> accept -> member row created and can access content.

## Dev Notes

### Architecture & Guardrails

- Keep invite logic in services; use Supabase RPC/edge function to avoid exposing secrets.
- Enforce RLS: only admins can invite/manage members; members can access shared content.
- Avoid PII leaks in logs; use env-driven email templates and redirect URLs.

### Implementation Notes

- Table fields: `id`, `family_id`, `email`, `user_id`, `role`, `status` (pending/accepted), `invited_by`, `invited_at`, `accepted_at`, `invite_token`.
- Admin model: `family_id = admin user_id`; first user becomes admin; RLS checks membership; RPC enforces admin.
- Invite flow: RPC generates token and returns link (`EXPO_PUBLIC_INVITE_REDIRECT_URL?token=...`); accept flow validates token, binds `user_id`, marks accepted.
- No email sending in MVP; share link/QR via client UI.

### File Structure Requirements

- `drizzle/policies/supabase-family-invites.sql`
- `src/features/family/services/inviteService.ts`
- `app/invite.tsx`
- `app/accept-invite.tsx`
- Invite UI: e.g., `app/invite.tsx` (send) and `app/accept-invite.tsx` (landing)

### Testing Requirements

- Manual validation per AC; no automated tests required in this story.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]
- [Source: project-context.md#Architecture & Boundaries]
- [Source: project-context.md#Privacy & Security]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `npm run lint`
- `npx prettier --write ...`

### Completion Notes List

- Drafted `family_members` table and invite RPCs (create/accept) with tokens; admin = first user (family_id = admin uid), RLS enforced on select/update.
- Added client services for invite creation/acceptance, returning invite link for sharing.
- Added invite/accept UI screens with copy-to-clipboard link sharing, deep link handler, stack routes, and settings entry; updated env placeholder for redirect URL.

### File List

- drizzle/policies/supabase-family-invites.sql
- src/features/family/services/inviteService.ts
- app/invite.tsx
- app/accept-invite.tsx
