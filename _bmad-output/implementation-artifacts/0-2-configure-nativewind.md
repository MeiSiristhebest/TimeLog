# Story 0.2: Configure NativeWind Design System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to configure NativeWind v4 with the Heritage palette and accessibility-first typography tokens,
so that I can build consistent, high-contrast UI components that match the TimeLog UX specification.

## Acceptance Criteria

1. **Given** the project is initialized  
   **When** I configure `tailwind.config.js` with the Heritage palette (Primary: `#C26B4A`, Surface: `#FFFAF5`)  
   **Then** I can use class names like `bg-primary` and `text-surface` in React Native components.
2. **Given** the design system tokens are defined  
   **When** I apply them to a sample screen  
   **Then** the UI uses the system default font stack and body text tokens at 24pt or above.
3. **Given** NativeWind v4 is the styling system  
   **When** I add or update UI components  
   **Then** styling is applied via `className` only (no alternative UI kit or StyleSheet usage).
4. **Given** Tailwind content scanning is required  
   **When** I update the NativeWind config  
   **Then** it includes `app/` and `src/` paths so class names in `src/components` and `app/` compile correctly.
5. **Given** I implement a "Hello World" verification screen  
   **When** I run the app  
   **Then** the custom colors render correctly and the screen reflects the Heritage palette.

## Tasks / Subtasks

- [x] Task 1: Update NativeWind/Tailwind configuration (AC: 1, 2, 4)
  - [x] 1.1: Update `tailwind.config.js` content globs to include `./app/**/*.{js,ts,tsx}` and `./src/**/*.{js,ts,tsx}`.
  - [x] 1.2: Extend theme colors with Heritage palette tokens: `primary`, `onPrimary`, `surface`, `onSurface`, `success`, `warning`, `error`.
  - [x] 1.3: Add typography tokens for `display`, `headline`, `body`, `caption` at 32/28/24/18 with sensible line heights.
  - [x] 1.4: Set `fontFamily.sans` to the system default font stack (no custom fonts).
  - [x] 1.5: Confirm `global.css` and `metro.config.js` remain configured for NativeWind input.

- [x] Task 2: Align base UI components to design tokens (AC: 2, 3)
  - [x] 2.1: Update `src/components/ui/Button.tsx` to use `bg-primary` + `text-onPrimary`, and enforce a 48dp minimum touch target.
  - [x] 2.2: Update `src/components/ui/ScreenContent.tsx` and `Container` styles to use `bg-surface` and `text-onSurface`.
  - [x] 2.3: Replace any default blue/purple accents in shared UI with Heritage tokens.

- [x] Task 3: Create "Hello World" visual verification (AC: 5)
  - [x] 3.1: Update `app/index.tsx` to render a simple screen that uses `bg-surface`, `text-onSurface`, and a primary button.
  - [x] 3.2: Ensure body text is 24pt+ and uses the system font stack.

- [x] Task 4: Manual validation (AC: 5)
  - [x] 4.1: Run the app and visually confirm the Heritage palette renders correctly.

## Dev Notes

### Architecture & Guardrails
- NativeWind v4 is the only styling system. Use `className` everywhere; `StyleSheet` is only allowed for `react-native-reanimated` shared values (not needed in this story).
- `app/` routes only handle navigation; keep component logic in `src/components/ui` for shared UI.
- Avoid introducing any additional UI libraries.

### UX Requirements to Enforce
- Heritage palette tokens (warm, high-contrast) must be applied:  
  - `primary`: `#C26B4A`, `onPrimary`: `#FFF8E7`, `surface`: `#FFFAF5`, `onSurface`: `#2C2C2C`  
  - `success`: `#7D9D7A`, `warning`: `#D4A012`, `error`: `#C65D4A`
- Body text must be 24pt or higher; default to system fonts.
- Touch targets must be at least 48dp for buttons (Record button 72dp is a later story).
- No system blue or purple accents in the base UI.

### Implementation Notes (Current Repo State)
- `tailwind.config.js` currently only scans `./app` and `./components`. Components live under `src/components`, so update globs to include `./src/**/*`.
- `global.css` already contains Tailwind directives and is imported in `app/_layout.tsx`.
- `metro.config.js` already uses `withNativeWind` with `input: "./global.css"`; keep this intact.
- Existing `Button` uses `bg-indigo-500` and `text-lg`. Replace with Heritage tokens and 24pt+ text.

### Library/Framework Requirements
- NativeWind v4 preset required in `tailwind.config.js` via `presets: [require("nativewind/preset")]`.
- Keep `nativewind-env.d.ts` for type support.

### File Structure Requirements
- Configuration: `tailwind.config.js`, `global.css`, `metro.config.js`.
- UI components: `src/components/ui/*`.
- Demo screen: `app/index.tsx` only for verification content.

### Testing Requirements
- Manual visual verification is sufficient for this story (no automated tests required).

### Previous Story Intelligence (0-1)
- NativeWind and global CSS are already wired up; focus on tokens and component usage.
- The initial UI components are placeholders and need to adopt the design system.

### Git Intelligence
- No git commits exist yet; no recent patterns to align with.

### Latest Tech Information
- NativeWind v4 requires `withNativeWind(config, { input: "./global.css" })` in `metro.config.js`.
- Tailwind config should use the NativeWind preset and include all `app/` and `src/` paths in `content`.

### Project Context Reference
- Strict TypeScript, no `any` types, and use NativeWind `className` styling only.
- Accessibility: minimum 24pt body text and 48dp touch targets.

### Project Structure Notes
- All shared UI components live in `src/components/ui`.
- Avoid introducing `components/` at the repo root (not in structure spec).

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Compliance]
- [Source: project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: https://context7.com/nativewind/nativewind/llms.txt]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

None.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Updated Tailwind config with Heritage palette, typography tokens, and system font stack.
- Aligned shared UI components to Heritage colors and 24pt+ typography.
- Built a Hello World verification screen using surface/on-surface and primary button tokens.
- Resolved lint errors/warnings and ran `npm run format`; `npm run lint` now passes cleanly.
- Added Android package ID and installed `expo-dev-client` to support AVD validation.
- Automated tests are not configured; manual visual verification remains pending.
- Manual validation completed on device; Heritage palette, typography, and touch targets render correctly.

### File List

- app/index.tsx
- app/+html.tsx
- app/+not-found.tsx
- app/_layout.tsx
- app/details.tsx
- app.json
- babel.config.js
- drizzle.config.ts
- drizzle/meta/0000_snapshot.json
- drizzle/meta/_journal.json
- eslint.config.js
- metro.config.js
- package-lock.json
- package.json
- prettier.config.js
- src/components/ui/Button.tsx
- src/components/ui/Container.tsx
- src/components/ui/EditScreenInfo.tsx
- src/components/ui/ScreenContent.tsx
- src/db/schema.ts
- src/db/schema/index.ts
- src/lib/mmkv.ts
- src/lib/supabase.ts
- tailwind.config.js
- tsconfig.json
- _bmad/bmb/workflows/create-module/templates/installer.template.js
- _bmad/bmm/workflows/document-project/templates/project-scan-report-schema.json
- .claude/settings.json
- .mcp.json
- _bmad-output/implementation-artifacts/0-2-configure-nativewind.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-01-10: Applied Heritage palette + typography tokens, refreshed shared UI styles, and added Hello World verification screen.
- 2026-01-10: Cleaned lint warnings and formatted repo to satisfy Prettier checks.
- 2026-01-10: Added Android package ID and dev client dependency for emulator validation.
