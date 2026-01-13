# Story 0.3: Bottom Tab Navigation Shell

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to implement the Bottom Tab navigation structure,
so that I have the shell for the application's main views.

## Acceptance Criteria

1. **Given** `expo-router` is installed  
   **When** I create the root layout with a Bottom Tab Bar  
   **Then** I see placeholders for Home (Recording), Gallery, Topics, and Settings tabs.
2. **Given** the Tab Bar is visible  
   **When** I apply design tokens  
   **Then** the Tab Bar uses Heritage palette styles (no system blue).
3. **Given** the tab structure is in place  
   **When** I tap each tab  
   **Then** navigation between tabs works smoothly.

## Tasks / Subtasks

- [x] Task 1: Create the Bottom Tab layout (AC: 1, 2, 3)
  - [x] 1.1: Add `app/(tabs)/_layout.tsx` using `Tabs` from `expo-router`.
  - [x] 1.2: Configure `screenOptions` for Heritage colors (active/inactive tint, background) and accessible label sizing.
  - [x] 1.3: Register four tabs: Home (index), Gallery, Topics, Settings.

- [x] Task 2: Create tab placeholder screens (AC: 1, 3)
  - [x] 2.1: Move or replace the current `app/index.tsx` with `app/(tabs)/index.tsx` for Home (Recording).
  - [x] 2.2: Add `app/(tabs)/gallery.tsx`, `app/(tabs)/topics.tsx`, `app/(tabs)/settings.tsx` with placeholder UI.
  - [x] 2.3: Keep screen content minimal; do not add business logic in `app/` routes.

- [x] Task 3: Root routing alignment (AC: 1)
  - [x] 3.1: Update `app/_layout.tsx` to keep the root `Stack` and include the `(tabs)` group as the default app shell.
  - [x] 3.2: If `app/index.tsx` remains, use it only as a redirect to `(tabs)` to avoid duplicate roots.

- [x] Task 4: Manual verification (AC: 3)
  - [x] 4.1: Run the app and confirm each tab routes to the correct placeholder.

## Dev Notes

### Architecture & Guardrails

- `app/` is for routing and layout only. All feature logic must live in `src/features/*`.
- Use Expo Router v6 with file-based routing: `(tabs)` group owns the Tab navigator.
- Styling should rely on NativeWind `className` when available; for navigation options that do not accept `className`, use minimal inline style objects (avoid `StyleSheet`).

### UX Requirements to Enforce

- Bottom Tab Bar with **Home, Gallery, Topics, Settings** (no hamburger menu).
- Heritage palette only; remove system blue defaults.
- Touch targets must be at least 48dp; tab labels should remain legible for seniors.

### Implementation Notes (Current Repo State)

- `app/_layout.tsx` currently renders a plain `Stack` and `app/index.tsx` is the Home screen.
- Introduce `(tabs)` group and move Home into `app/(tabs)/index.tsx`.
- Keep existing demo screens (e.g., `details.tsx`) unless they conflict; do not delete unrelated files.

### Dependency & Sequence Notes

- This story assumes Story 0.2 (NativeWind tokens) is completed so Heritage palette classes exist.
- If palette tokens are missing, complete Story 0.2 first before styling the Tab Bar.

### File Structure Requirements

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/gallery.tsx`
- `app/(tabs)/topics.tsx`
- `app/(tabs)/settings.tsx`
- `app/_layout.tsx`

### Conflict Resolution Notes

- Architecture examples mention `family.tsx` under `(tabs)`, but **Epic 0.3 and UX Spec** explicitly require **Topics** and **Settings** tabs now.
- Defer Family tab to Epic 4; do not add it in this story.

### Testing Requirements

- Manual navigation check only (no automated tests required).

### Previous Story Intelligence (0-2)

- NativeWind v4 and `global.css` wiring exist; apply Heritage palette and avoid default blue in navigation.
- Tailwind content scanning should already include `app/` and `src/` paths to compile class names in new screens.

### Git Intelligence

- No git commits exist yet; no recent patterns to align with.

### Latest Tech Information

- Expo Router v6 uses `Tabs` from `expo-router` with a `(tabs)` group and file-based routes for each tab screen.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Pattern Analysis & Inspiration]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Implementation Approach]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: project-context.md#Technology Stack & Versions]

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `git log -5 --oneline` (no commits)

### Completion Notes List

- Implemented bottom tab shell with Heritage palette, accessible label sizing, and 48dp+ touch targets.
- Added Home, Gallery, Topics, and Settings placeholder screens under `(tabs)` with Heritage surfaces/typography.
- Root routing now uses `(tabs)` as default with `app/index.tsx` redirect; kept `details` screen in Stack.
- Verified on device: all tabs render placeholders correctly and icons show with Heritage styling.

### File List

- app/\_layout.tsx
- app/index.tsx
- app/(tabs)/\_layout.tsx
- app/(tabs)/index.tsx
- app/(tabs)/gallery.tsx
- app/(tabs)/topics.tsx
- app/(tabs)/settings.tsx
- app/details.tsx
