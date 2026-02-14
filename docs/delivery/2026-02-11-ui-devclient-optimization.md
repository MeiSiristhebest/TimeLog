# UI + Dev Client Optimization Notes

Date: 2026-02-11

## Scope
- Modularized Home tab recording button into a reusable feature component.
- Introduced centralized NativeWind/Reanimated wrapper at `src/tw/animated.ts`.
- Refactored recording mode switcher animation logic to avoid render-time shared value writes and hard-coded translation offsets.
- Added dev-client oriented npm scripts and EAS submit profile.

## Why
- Reduce animation boilerplate and improve consistency (`@/tw/animated`).
- Improve maintainability of route files via component extraction.
- Improve runtime stability and readability for recorder mode animation.
- Make dev-client workflows explicit and reproducible.

## Dev Client Commands
- `npm run start:dev-client`
- `npm run build:dev:ios`
- `npm run build:dev:android`
