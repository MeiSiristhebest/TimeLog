# TimeLog Traceability Matrix (Sprint 3)

Date: 2026-02-08

| Requirement ID | Design Element | Code Reference | Verification |
| --- | --- | --- | --- |
| SRS-SYNC-001 | Offline queue + replay | `src/lib/sync-engine/queue.ts`, `src/lib/sync-engine/store.ts` | `src/lib/sync-engine/queue.test.ts`, `src/lib/sync-engine/store.test.ts` |
| SRS-SYNC-002 | Metadata update queue item | `src/lib/sync-engine/queue.ts` | `src/lib/sync-engine/queue.test.ts` |
| SRS-SYNC-003 | Cloud delete queue (`delete_file`) | `src/lib/sync-engine/queue.ts`, `src/lib/sync-engine/store.ts`, `src/lib/sync-engine/transport.ts` | `src/lib/sync-engine/queue.test.ts`, `src/lib/sync-engine/store.test.ts`, `tests/integration/permanent-delete-sync-replay.test.tsx` |
| SRS-SYNC-004 | Sync telemetry for `delete_file` success/failure | `src/lib/sync-engine/metrics.ts`, `src/lib/sync-engine/store.ts`, `supabase/migrations/20260210_create_sync_events.sql` | `tests/integration/permanent-delete-sync-replay.test.tsx` |
| SRS-STORY-001 | Permanent delete local + cloud queue | `src/features/story-gallery/services/storyService.ts` | `src/features/story-gallery/services/storyService.test.ts` |
| SRS-REC-001 | Upload asset resolution and format-aware upload | `src/lib/sync-engine/transcode.ts`, `src/lib/sync-engine/store.ts` | `src/lib/sync-engine/store.test.ts`, `src/lib/sync-engine/transcode.test.ts` |
| SRS-NTF-001 | Push token registration + persistence | `src/lib/notifications.ts` | `src/lib/notifications.test.ts` |
| SRS-NTF-002 | Badge from unread count | `src/lib/notifications/badgeService.ts` | Covered in home-flow hooks tests + runtime verification |
| SRS-NTF-003 | Nudge inactivity scheduling | `src/lib/notifications/nudgeService.ts` | `src/lib/notifications/nudgeService.test.ts` |
| SRS-NFR-004 | No runtime `src/lib` -> `src/features` dependency | `src/lib/**` | `rg -n \"@/features|/features/\" src/lib` |
| SRS-NFR-005 | Build quality gates | whole repo | `npm run lint`, `npm test`, `npx tsc --noEmit` |
| SRS-NFR-006 | CI warning budget gate | `scripts/eslint-warning-budget.mjs`, `tools/eslint-warning-baseline.json`, `.github/workflows/ci.yml` | `npm run lint:baseline:check` |
