# Settings + Display System Design (WeChat-style)

**Goal**
Build a WeChat-style Settings experience with module grouping and deep screens, while adding global font size control (7
steps) and theme mode (system/light/dark). Keep routing in `app/` thin and move logic/UI into `src/features/settings/`.

**Information Architecture**
Settings home is a clean index of modules, each opening a dedicated screen:

1. Account & Security
2. Family Sharing
3. Display & Accessibility
4. Notifications
5. Data & Storage
6. About & Help

Each module uses consistent grouped cards with right-side summaries (e.g., “System · Standard”). Deep screens are used
where needed (future expansion), following the WeChat pattern.

**Data Flow**
Create a `displaySettingsService` for MMKV persistence and a `displaySettingsStore` (Zustand) for UI state. IO stays
inside `src/features/settings/services/`. The theme hook reads the store to compute colors and typography. Display
settings are local-only (no sync). Defaults: `themeMode = system`, `fontScaleIndex = 2` (Standard).

**Theme + Typography**
Extend `src/theme/heritage.ts` to return typography tokens derived from a 7-step scale. Font sizes are multiplied by the
selected scale while keeping minimum body size (24pt). Provide labels: Small, Medium, Standard, Large, Extra Large,
Huge, Max. Add a reset action in Display & Accessibility to restore defaults.

**Global Font Scale**
Introduce `AppText` and migrate all `<Text>` usage to ensure consistent scaling. `AppText` reads typography from
`useHeritageTheme` and applies variants (body, title, caption, label). This enables global size changes without
per-screen adjustments.

**Screen Components**
Create shared settings UI primitives under `src/features/settings/components/`: `SettingsSection`, `SettingsRow`,
`SettingsCard`, and `SettingsValue`. Each screen uses these for consistent layout and spacing. Use `Icon` wrapper for
icons and `expo-image` for images.

**Error Handling**
Storage read/write failures fall back to defaults; log via `devLog` only. UI never blocks on storage failures.

**Testing Strategy**
TDD for services, store, theme helpers, and key UI primitives. Unit tests verify defaults, persistence, and correct
typography scaling. Screen tests verify key rows render and call navigation handlers.

**Non-goals (Phase 1)**
No backend sync for display settings, no platform-specific native theming beyond current Expo support, no redesign of
other app flows beyond settings.
