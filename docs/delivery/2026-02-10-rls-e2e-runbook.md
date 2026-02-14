# RLS End-to-End Verification Runbook

## Purpose
Generate reproducible, environment-backed RLS evidence for:
- senior self-access
- linked family access
- unlinked user denial

## Required Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `RLS_SENIOR_EMAIL`
- `RLS_SENIOR_PASSWORD`
- `RLS_FAMILY_EMAIL`
- `RLS_FAMILY_PASSWORD`
- `RLS_INTRUDER_EMAIL`
- `RLS_INTRUDER_PASSWORD`
- `RLS_EXPECTED_SHARED_STORY_ID`

## Execute
`npm run security:rls:e2e`

## Output
- `docs/delivery/2026-02-10-rls-e2e-evidence.md`

## Pass Criteria
- `RLS-01` PASS
- `RLS-02` PASS
- `RLS-03` PASS
- `RLS-04` PASS
