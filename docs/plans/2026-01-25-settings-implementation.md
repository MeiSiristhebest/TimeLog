# Settings Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement WeChat-style Settings with module grouping + deep screens, add global font size control (7 steps)
and theme mode (system/light/dark), and make font scaling apply app-wide.

**Architecture:** Feature-first settings UI lives in `src/features/settings/` with service/store for display settings.
Routing remains in `app/(tabs)/settings/` as thin wrappers. Theme hook reads store state to provide palette +
typography. Global font scaling is enforced via `AppText` and migrated usage.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, Zustand, MMKV, Expo Router, NativeWind v5, expo-symbols,
expo-image.

---

### Task 1: Add display settings service (MMKV) with tests

**Files:**

- Create: `src/features/settings/services/displaySettingsService.ts`
- Test: `src/features/settings/services/displaySettingsService.test.ts`

**Step 1: Write the failing test**

```ts
import { getDisplaySettings, setThemeMode, setFontScaleIndex, resetDisplaySettings } from './displaySettingsService';
import { mmkv } from '@/lib/mmkv';

jest.mock('@/lib/mmkv');

test('defaults to system + standard when empty', () => {
  (mmkv.getString as jest.Mock).mockReturnValue(undefined);
  const settings = getDisplaySettings();
  expect(settings).toEqual({ themeMode: 'system', fontScaleIndex: 2 });
});

test('persists theme mode', () => {
  setThemeMode('dark');
  expect(mmkv.set).toHaveBeenCalledWith('display.themeMode', 'dark');
});

test('persists font scale index', () => {
  setFontScaleIndex(4);
  expect(mmkv.set).toHaveBeenCalledWith('display.fontScaleIndex', '4');
});

test('reset restores defaults', () => {
  resetDisplaySettings();
  expect(mmkv.set).toHaveBeenCalledWith('display.themeMode', 'system');
  expect(mmkv.set).toHaveBeenCalledWith('display.fontScaleIndex', '2');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/settings/services/displaySettingsService.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
export type ThemeMode = 'system' | 'light' | 'dark';
const THEME_KEY = 'display.themeMode';
const SCALE_KEY = 'display.fontScaleIndex';
export const DEFAULT_THEME_MODE: ThemeMode = 'system';
export const DEFAULT_FONT_SCALE_INDEX = 2;

export function getDisplaySettings() {
  const themeMode = (mmkv.getString(THEME_KEY) as ThemeMode) ?? DEFAULT_THEME_MODE;
  const scaleRaw = mmkv.getString(SCALE_KEY);
  const fontScaleIndex = scaleRaw ? Number(scaleRaw) : DEFAULT_FONT_SCALE_INDEX;
  return { themeMode, fontScaleIndex };
}

export function setThemeMode(mode: ThemeMode) {
  mmkv.set(THEME_KEY, mode);
}

export function setFontScaleIndex(index: number) {
  mmkv.set(SCALE_KEY, String(index));
}

export function resetDisplaySettings() {
  setThemeMode(DEFAULT_THEME_MODE);
  setFontScaleIndex(DEFAULT_FONT_SCALE_INDEX);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/settings/services/displaySettingsService.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/services/displaySettingsService.ts src/features/settings/services/displaySettingsService.test.ts
git commit -m "feat: add display settings service"
```

---

### Task 2: Add display settings store with tests

**Files:**

- Create: `src/features/settings/store/displaySettingsStore.ts`
- Test: `src/features/settings/store/displaySettingsStore.test.ts`

**Step 1: Write the failing test**

```ts
import { act } from '@testing-library/react-native';
import { useDisplaySettingsStore } from './displaySettingsStore';
import * as service from '../services/displaySettingsService';

jest.mock('../services/displaySettingsService');

test('hydrate loads defaults', () => {
  (service.getDisplaySettings as jest.Mock).mockReturnValue({
    themeMode: 'system',
    fontScaleIndex: 2,
  });

  act(() => {
    useDisplaySettingsStore.getState().hydrate();
  });

  const state = useDisplaySettingsStore.getState();
  expect(state.themeMode).toBe('system');
  expect(state.fontScaleIndex).toBe(2);
  expect(state.isLoaded).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/settings/store/displaySettingsStore.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
import { create } from 'zustand';
import {
  getDisplaySettings,
  setThemeMode,
  setFontScaleIndex,
  resetDisplaySettings,
  type ThemeMode,
} from '../services/displaySettingsService';

type State = {
  themeMode: ThemeMode;
  fontScaleIndex: number;
  isLoaded: boolean;
  hydrate: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setFontScaleIndex: (index: number) => void;
  reset: () => void;
};

export const useDisplaySettingsStore = create<State>((set) => ({
  themeMode: 'system',
  fontScaleIndex: 2,
  isLoaded: false,
  hydrate: () => {
    const settings = getDisplaySettings();
    set({ ...settings, isLoaded: true });
  },
  setThemeMode: (mode) => {
    setThemeMode(mode);
    set({ themeMode: mode });
  },
  setFontScaleIndex: (index) => {
    setFontScaleIndex(index);
    set({ fontScaleIndex: index });
  },
  reset: () => {
    resetDisplaySettings();
    set({ themeMode: 'system', fontScaleIndex: 2 });
  },
}));
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/settings/store/displaySettingsStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/store/displaySettingsStore.ts src/features/settings/store/displaySettingsStore.test.ts
git commit -m "feat: add display settings store"
```

---

### Task 3: Update heritage theme helpers (mode + typography) with tests

**Files:**

- Modify: `src/theme/heritage.ts`
- Test: `src/theme/heritage.test.ts`

**Step 1: Write the failing test**

```ts
import { createHeritageTheme, FONT_SCALE_LABELS, DEFAULT_FONT_SCALE_INDEX } from './heritage';

test('returns dark palette for dark mode', () => {
  const theme = createHeritageTheme({ themeMode: 'dark', fontScaleIndex: DEFAULT_FONT_SCALE_INDEX, systemScheme: 'light' });
  expect(theme.isDark).toBe(true);
});

test('typography scales by step', () => {
  const theme = createHeritageTheme({ themeMode: 'light', fontScaleIndex: 4, systemScheme: 'light' });
  expect(theme.typography.body).toBeGreaterThan(24);
});

test('labels length matches steps', () => {
  expect(FONT_SCALE_LABELS.length).toBe(7);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/theme/heritage.test.ts`
Expected: FAIL (exports missing)

**Step 3: Write minimal implementation**

```ts
import type { ThemeMode } from '@/features/settings/services/displaySettingsService';

export const FONT_SCALE_STEPS = [0.9, 0.96, 1.0, 1.08, 1.16, 1.24, 1.32] as const;
export const FONT_SCALE_LABELS = ['Small', 'Medium', 'Standard', 'Large', 'Extra Large', 'Huge', 'Max'] as const;
export const DEFAULT_FONT_SCALE_INDEX = 2;

export function createTypography(scale: number) {
  return {
    body: Math.round(24 * scale),
    title: Math.round(28 * scale),
    subtitle: Math.round(26 * scale),
    caption: Math.round(20 * scale),
    label: Math.round(22 * scale),
  } as const;
}

export function createHeritageTheme({ themeMode, fontScaleIndex, systemScheme }: { themeMode: ThemeMode; fontScaleIndex: number; systemScheme: 'light' | 'dark' | null | undefined; }) {
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const scale = FONT_SCALE_STEPS[fontScaleIndex] ?? FONT_SCALE_STEPS[DEFAULT_FONT_SCALE_INDEX];
  return {
    colors: isDark ? DARK_PALETTE : PALETTE,
    spacing: SPACING,
    radius: RADIUS,
    animation: ANIMATION_CONFIGS,
    typography: createTypography(scale),
    fontScaleIndex: fontScaleIndex ?? DEFAULT_FONT_SCALE_INDEX,
    isDark,
  };
}
```

Update `useHeritageTheme()` to call `useDisplaySettingsStore()` and `createHeritageTheme()`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/theme/heritage.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/heritage.ts src/theme/heritage.test.ts
git commit -m "feat: add typography scaling to heritage theme"
```

---

### Task 4: Add AppText component with tests

**Files:**

- Create: `src/components/ui/AppText.tsx`
- Test: `src/components/ui/AppText.test.tsx`

**Step 1: Write the failing test**

```ts
import { render } from '@testing-library/react-native';
import { AppText } from './AppText';

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({ typography: { body: 24, title: 28, subtitle: 26, caption: 20, label: 22 } }),
}));

test('uses body size by default', () => {
  const { getByText } = render(<AppText>Sample</AppText>);
  const node = getByText('Sample');
  expect(node.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 24 })]));
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/AppText.test.tsx`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```tsx
import { Text, TextProps } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';

type Variant = 'body' | 'title' | 'subtitle' | 'caption' | 'label';

type AppTextProps = TextProps & { variant?: Variant };

export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  const { typography } = useHeritageTheme();
  return <Text {...rest} style={[{ fontSize: typography[variant] }, style]} />;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/AppText.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ui/AppText.tsx src/components/ui/AppText.test.tsx
git commit -m "feat: add AppText for global scaling"
```

---

### Task 5: Settings UI primitives (WeChat-style) with tests

**Files:**

- Create: `src/features/settings/components/SettingsRow.tsx`
- Create: `src/features/settings/components/SettingsSection.tsx`
- Create: `src/features/settings/components/SettingsCard.tsx`
- Test: `src/features/settings/components/SettingsRow.test.tsx`

**Step 1: Write the failing test**

```ts
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsRow } from './SettingsRow';

jest.mock('@/components/ui/AppText', () => ({ AppText: ({ children }: { children: string }) => children }));

test('renders label and value', () => {
  const { getByText } = render(<SettingsRow label="Dark Mode" value="System" />);
  expect(getByText('Dark Mode')).toBeTruthy();
  expect(getByText('System')).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/settings/components/SettingsRow.test.tsx`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

Implement row, section, and card using `className` for layout and theme colors for text/borders.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/settings/components/SettingsRow.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/components/SettingsRow.tsx src/features/settings/components/SettingsSection.tsx src/features/settings/components/SettingsCard.tsx src/features/settings/components/SettingsRow.test.tsx
git commit -m "feat: add settings UI primitives"
```

---

### Task 6: Settings home screen (module index) with tests

**Files:**

- Create: `src/features/settings/screens/SettingsHomeScreen.tsx`
- Test: `src/features/settings/screens/SettingsHomeScreen.test.tsx`
- Modify: `app/(tabs)/settings/index.tsx`

**Step 1: Write the failing test**

```ts
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsHomeScreen } from './SettingsHomeScreen';

const push = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push }) }));

test('navigates to display screen', () => {
  const { getByText } = render(<SettingsHomeScreen />);
  fireEvent.press(getByText('Display & Accessibility'));
  expect(push).toHaveBeenCalledWith('/(tabs)/settings/display-accessibility');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/settings/screens/SettingsHomeScreen.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

Create the home screen using `SettingsSection` + `SettingsRow`, and update `app/(tabs)/settings/index.tsx` to render it.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/settings/screens/SettingsHomeScreen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/screens/SettingsHomeScreen.tsx src/features/settings/screens/SettingsHomeScreen.test.tsx app/(tabs)/settings/index.tsx
git commit -m "feat: add settings home screen"
```

---

### Task 7: Display & Accessibility screen (theme + font size) with tests

**Files:**

- Create: `src/features/settings/screens/DisplayAccessibilityScreen.tsx`
- Test: `src/features/settings/screens/DisplayAccessibilityScreen.test.tsx`
- Create: `app/(tabs)/settings/display-accessibility.tsx`

**Step 1: Write the failing test**

```ts
import { render, fireEvent } from '@testing-library/react-native';
import { DisplayAccessibilityScreen } from './DisplayAccessibilityScreen';
import { useDisplaySettingsStore } from '../store/displaySettingsStore';

jest.mock('../store/displaySettingsStore');

test('reset calls store reset', () => {
  const reset = jest.fn();
  (useDisplaySettingsStore as jest.Mock).mockReturnValue({
    themeMode: 'system',
    fontScaleIndex: 2,
    setThemeMode: jest.fn(),
    setFontScaleIndex: jest.fn(),
    reset,
  });

  const { getByText } = render(<DisplayAccessibilityScreen />);
  fireEvent.press(getByText('Reset to Defaults'));
  expect(reset).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/settings/screens/DisplayAccessibilityScreen.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

Use a list of theme mode options (System/Light/Dark) with checkmarks, and a slider for font size (7 steps). Use
`AppText` for preview. Add a `Reset to Defaults` row.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/settings/screens/DisplayAccessibilityScreen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/screens/DisplayAccessibilityScreen.tsx src/features/settings/screens/DisplayAccessibilityScreen.test.tsx app/(tabs)/settings/display-accessibility.tsx
git commit -m "feat: add display and accessibility settings"
```

---

### Task 8: Remaining settings module screens (Account, Family, Notifications, Data, About)

**Files:**

- Create: `src/features/settings/screens/AccountSecurityScreen.tsx`
- Create: `src/features/settings/screens/AccountSecurityScreen.test.tsx`
- Create: `src/features/settings/screens/FamilySharingScreen.tsx`
- Modify: `app/(tabs)/settings/notifications.tsx`
- Create: `src/features/settings/screens/DataStorageScreen.tsx`
- Create: `src/features/settings/screens/AboutHelpScreen.tsx`
- Create route wrappers:
    - `app/(tabs)/settings/account-security.tsx`
    - `app/(tabs)/settings/family-sharing.tsx`
    - `app/(tabs)/settings/data-storage.tsx`
    - `app/(tabs)/settings/about-help.tsx`

**Step 1: Write the failing test**

```ts
import { render } from '@testing-library/react-native';
import { AccountSecurityScreen } from './AccountSecurityScreen';

test('renders logout action', () => {
  const { getByText } = render(<AccountSecurityScreen />);
  expect(getByText('Sign Out')).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/settings/screens/AccountSecurityScreen.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

Map existing hooks/services into the appropriate screens:

- Account & Security: profile edit, role switching, device code, sign out, delete account.
- Family Sharing: family list, invite flow, QR/link (reuse existing logic from old settings screen).
- Notifications: reuse current notification toggles (move UI into feature screen, wrapper in app/).
- Data & Storage: cache size placeholder + clear cache action (non-destructive).
- About & Help: help, privacy, version, support links.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/settings/screens/AccountSecurityScreen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/screens/* app/(tabs)/settings/*.tsx
git commit -m "feat: add settings module screens"
```

---

### Task 9: Update settings stack layout

**Files:**

- Modify: `app/(tabs)/settings/_layout.tsx`

**Step 1: Write the failing test**

Not required (layout config). Document change only.

**Step 2: Implement**

Add the new routes to the stack and give them titles. Keep headers consistent with theme.

**Step 3: Commit**

```bash
git add app/(tabs)/settings/_layout.tsx
git commit -m "chore: register settings module routes"
```

---

### Task 10: Migrate Text usage to AppText for global scaling

**Files:**

- Create: `src/components/ui/heritage/HeritageButton.test.tsx`
- Modify all files containing `<Text>`:

```
app/ask-question.tsx
app/+not-found.tsx
app/device-code.tsx
app/consent-review.tsx
app/accept-invite.tsx
app/_layout.tsx
app/welcome.tsx
src/theme/heritage.ts
app/(tabs)/topics.tsx
src/tw/index.tsx
app/invite.tsx
app/index.tsx
app/help.tsx
app/role.tsx
app/device-management.tsx
app/recovery-code.tsx
app/story-comments/[id].tsx
app/family-story/[id].tsx
app/(tabs)/gallery.tsx
app/family-members.tsx
app/login.tsx
app/splash.tsx
src/components/ui/GlassCard.tsx
src/components/ui/UndoToast.tsx
src/components/ui/HeritageModal.tsx
src/components/ui/ScreenContent.tsx
src/components/ui/HeritageAlert.tsx
app/story/[id].tsx
app/(tabs)/settings/notifications.tsx
app/(tabs)/settings/index.tsx
app/(tabs)/settings/deleted-items.tsx
src/components/ui/Button.tsx
src/components/ui/HeritageTimePicker.tsx
app/(tabs)/index.tsx
src/components/ui/EditScreenInfo.tsx
src/components/ui/heritage/HeritageActionSheet.tsx
app/(tabs)/family/ask-question.tsx
src/components/ui/heritage/HeritageBottomSheet.tsx
src/components/ui/feedback/OfflineBanner.tsx
src/components/ui/feedback/OfflineScreen.tsx
src/components/ui/heritage/HeritageButton.tsx
src/components/ui/heritage/HeritageEmptyState.tsx
src/components/ui/heritage/HeritageFAB.tsx
src/components/ui/feedback/ToastProvider.tsx
src/components/ui/heritage/HeritageInput.tsx
src/components/ui/heritage/HeritageHeader.tsx
src/components/ui/heritage/HeritageLoadingOverlay.tsx
src/components/ui/heritage/HeritageProgressBar.tsx
src/features/home/components/ActivityCard.tsx
src/features/settings/components/EditProfileModal.tsx
src/features/home/hooks/useWeatherResource.ts
src/features/home/components/HomeNotification.tsx
src/components/ui/heritage/HeritageSwipeableRow.tsx
src/components/ui/heritage/HeritageSelect.tsx
src/components/ui/heritage/HeritageTabBar.tsx
src/components/ui/heritage/HeritageSwitch.tsx
src/components/ui/heritage/HeritageTheme.tsx
src/features/story-gallery/components/AudioPlayer.tsx
src/features/story-gallery/components/CommentBadge.tsx
src/features/story-gallery/components/DeleteConfirmModal.tsx
src/features/story-gallery/components/DeletedItemsList.tsx
src/features/story-gallery/components/EditTitleSheet.tsx
src/features/story-gallery/components/EmptyGallery.tsx
src/features/recorder/components/QuestionCard.tsx
src/features/story-gallery/components/FilterBar.tsx
src/features/recorder/components/ResumeRecordingPrompt.tsx
src/features/recorder/components/ActiveRecordingView.tsx
src/features/story-gallery/components/SortOptionsModal.tsx
src/features/recorder/components/RecordingControls.tsx
src/features/recorder/components/StorySavedView.tsx
src/features/story-gallery/components/StoryCard.tsx
src/features/family-listener/components/CommentInput.tsx
src/features/family-listener/components/CommentItem.tsx
src/features/family-listener/components/CommentList.tsx
src/features/family-listener/components/CommentSection.tsx
src/features/family-listener/components/EmptyFamilyGallery.tsx
src/features/story-gallery/components/SyncStatusBadge.tsx
src/features/story-gallery/components/TimelineStoryCard.tsx
src/features/family-listener/components/FamilyStoryCard.tsx
src/features/family-listener/components/FamilyStoryList.tsx
src/features/family-listener/components/NotificationBanner.tsx
src/features/family-listener/components/NotificationPrompt.tsx
src/features/family-listener/components/PlaybackControls.tsx
```

**Step 1: Write a minimal validation test**

```ts
import { render } from '@testing-library/react-native';
import { HeritageButton } from './HeritageButton';

jest.mock('@/components/ui/AppText', () => ({
  AppText: ({ children }: { children: string }) => children,
}));

test('uses AppText for label', () => {
  const { getByText } = render(<HeritageButton title="Save" onPress={() => {}} />);
  expect(getByText('Save')).toBeTruthy();
});
```

Update or add a test to ensure `AppText` is used in at least one migrated component (e.g., `HeritageButton`) and that
font size comes from theme. This ensures global scaling is wired to UI components.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/heritage/HeritageButton.test.tsx`
Expected: FAIL (uses Text)

**Step 3: Migrate Text usage**

Replace `Text` imports with `AppText` and update JSX tags. Keep non-text elements unchanged. Use `AppText` variants
where appropriate.

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/ui/heritage/HeritageButton.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app src
git commit -m "refactor: use AppText for global font scaling"
```

---

### Task 11: Update app layout to consume theme + system UI

**Files:**

- Modify: `app/_layout.tsx`

**Step 1: Write the failing test**

Not required (layout config). Document change only.

**Step 2: Implement**

Use `useHeritageTheme()` for header colors and `expo-system-ui` for status bar background where appropriate.

**Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "chore: align app layout with heritage theme"
```

---

### Task 12: Verification

**Step 1: Run focused tests**

Run: `npm test -- src/features/settings/services/displaySettingsService.test.ts`
Run: `npm test -- src/features/settings/store/displaySettingsStore.test.ts`
Run: `npm test -- src/theme/heritage.test.ts`
Run: `npm test -- src/components/ui/AppText.test.tsx`
Run: `npm test -- src/features/settings/screens/SettingsHomeScreen.test.tsx`
Run: `npm test -- src/features/settings/screens/DisplayAccessibilityScreen.test.tsx`

**Step 2: Optional full test pass**

Run: `npm test`

---

**Notes**

- All labels and UI strings must be English only.
- Use `expo-image` for images and `Icon` wrapper for icons.
- Use NativeWind (`className`) for layout; use inline styles only for theme-driven colors.
- Avoid AsyncStorage; use MMKV via services only.
