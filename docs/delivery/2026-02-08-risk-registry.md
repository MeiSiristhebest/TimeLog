# TimeLog Risk Registry (Sprint 3)

Date: 2026-02-08  
Scope: Sprint 3 P1/P2 quality convergence and delivery readiness

| ID | Risk | Impact | Likelihood | Current Mitigation | Residual |
| --- | --- | --- | --- | --- | --- |
| R-001 | Sync queue cloud delete not executed when offline | High | Medium | Added `delete_file` queue item + processor execution path + replay integration test | Low |
| R-002 | Architecture drift: `src/lib` reverse-depends on `src/features` | Medium | Medium | Removed runtime reverse imports; moved lazy component binding to feature layer; notification services decoupled from feature imports | Low |
| R-003 | Notification push token registration fails silently | Medium | Medium | Registration/unregister now logs errors and uses explicit Supabase operations with guarded user lookup | Medium |
| R-004 | Audio upload/delete format mismatch (`wav` vs `opus`) | High | Medium | Permanent delete derives cloud path from `uploadFormat`, defaults to `wav` | Medium |
| R-005 | Queue retry backlog under unstable network | Medium | Medium | Existing exponential backoff + pending item cleanup retained | Medium |
| R-006 | Type erosion (`any`) in sync critical path | Medium | Medium | Replaced key `any` in queue transcript enqueue/test chain with typed payloads | Low |
| R-007 | Test suite emits warnings hiding real regressions | Medium | High | Added warning baseline gate in CI (`lint:baseline:check`) | Low |
| R-008 | Sync telemetry insertion failures could interfere with queue flow | Medium | Medium | Metrics writes are isolated and swallowed on failure; queue retry/dequeue remains authoritative | Low |
| R-009 | Sync telemetry retention growth over time | Medium | Medium | Added `cleanup_sync_events_older_than(days)` function with 90-day default | Low |

## Follow-up Actions Status

1. `delete_file` success/failure metrics in sync observability: Completed.
2. Integration test for permanent delete local+queue replay chain: Completed.
3. CI warning budget hardening (fail on new warnings): Completed.
