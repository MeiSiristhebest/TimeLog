# Performance Benchmark Report

Generated at: 2026-02-10T10:59:52.775Z

| Benchmark | Command | Target | Duration | Status |
|---|---|---:|---:|---|
| typecheck | `npx tsc --noEmit` | 60000 ms | 8521 ms | PASS |
| lint_baseline_check | `npm run lint:baseline:check` | 20000 ms | 19425 ms | PASS |
| offline_policy_suite | `npx jest src/features/recorder/services/NetworkQualityService.test.ts --runInBand` | 15000 ms | 1979 ms | PASS |
| family_question_linkage_suite | `npx jest tests/integration/family-question-answered-linkage.test.tsx --runInBand` | 15000 ms | 2277 ms | PASS |

## Notes

- These benchmarks measure repeatable repository checks and critical test latencies.
- Mobile runtime targets (cold start, on-device cue latency) still require device-level instrumentation runs.
