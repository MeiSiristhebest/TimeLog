# Supabase Type Sync

This project now treats generated Supabase database types as a shared contract artifact rather than handwritten application code.

## Source of Truth

- Generator: `scripts/generate-supabase-types.ps1`
- Upstream schema: live Supabase project referenced by `SUPABASE_PROJECT_ID`
- Schemas generated: `public`

## Output Targets

- Mobile: `src/types/supabase.generated.ts`
- Web: `../TimeLog-Web/src/types/supabase.generated.ts`

## Rules

- Do not hand-edit generated type files.
- Regenerate after any Supabase schema, policy-adjacent table, RPC, or view change that affects client shape.
- If `../TimeLog-Web` does not exist yet, the script updates only the mobile target and emits a warning.

## Usage

```powershell
$env:SUPABASE_PROJECT_ID = "your-project-id"
./scripts/generate-supabase-types.ps1
```

Optional arguments:

```powershell
./scripts/generate-supabase-types.ps1 -ProjectId "your-project-id" -Schema "public"
```

## Expected Workflow

1. Apply or review schema changes in Supabase.
2. Run `./scripts/generate-supabase-types.ps1`.
3. Confirm both mobile and web targets updated as expected.
4. Commit generated output together with the schema or policy change.
