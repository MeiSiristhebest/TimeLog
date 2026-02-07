# Code Simplifier Design

**Goal:** Align the codebase with project standards (function declarations for top-level exports, explicit return types,
no nested ternary chains, ESM imports over non-asset require, kebab-case utilities) while preserving behavior and
architecture boundaries.

## Scope and Approach

This refactor is purely structural and style-focused: no behavior changes, no new features. Work is applied in directory
batches: `app/` first, then `src/`, then `tests/`. In `app/`, only routing and screen composition change; logic remains
in `src/` services/hooks. In `src/`, updates focus on exported hooks, services, stores, and components; external I/O
remains in `src/features/*/services/*.ts` per the service mandate. Asset requires (images, lottie, sounds) stay as
`require(...)` because React Native requires static asset resolution. Non-asset `require` usage is replaced by ESM or
dynamic `import()` where lazy loading is required. Nested ternaries are replaced with helper functions or `switch`
statements for readability. File renames for utilities will use kebab-case and update all references.

## Error Handling and Data Flow

Try/catch blocks remain only at unavoidable boundaries (native modules, file system, network calls). Where feasible,
error handling is shifted into service helpers that return Result-like objects so UI layers can handle failure as state
rather than exceptions. No new logging of PII or transcripts is introduced; existing Sentry capture helpers continue to
be used. All changes preserve local-first flows and sync-queue semantics; there is no change to database schema or
network contracts.

## Testing and Validation

Each batch completes with targeted checks: run `npm run lint` and the most relevant unit/integration tests for touched
areas. After all batches, run `npm test` to confirm no regressions. If a refactor requires test updates (e.g., named
exports, signature changes), tests are adjusted to match the new declarations without altering test intent.
