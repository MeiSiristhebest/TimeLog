/**
 * Heritage Component Library - Barrel Export
 *
 * A complete set of custom UI components following the Heritage Memoir design system.
 * These components provide Instagram/Discord-level UI quality with:
 * - Smooth animations (react-native-reanimated)
 * - Haptic feedback (expo-haptics)
 * - Accessibility support
 * - Consistent Heritage Memoir styling
 */

// Core Components (already exist in parent)
// export * from '../HeritageModal';
// export * from '../HeritageAlert';
// export * from '../HeritageTimePicker';

// Layout & Navigation
export { HeritageHeader, default as HeritageHeaderDefault } from './HeritageHeader';
export { HeritageTabBar, default as HeritageTabBarDefault } from './HeritageTabBar';
export { HeritageBottomSheet, default as HeritageBottomSheetDefault } from './HeritageBottomSheet';

// Inputs & Forms
export { HeritageInput, default as HeritageInputDefault } from './HeritageInput';
export { HeritageButton, default as HeritageButtonDefault } from './HeritageButton';
export { HeritageSwitch } from './HeritageSwitch';

// Feedback & Loading
export { HeritageActionSheet, default as HeritageActionSheetDefault } from './HeritageActionSheet';
export { HeritageLoadingOverlay, default as HeritageLoadingOverlayDefault } from './HeritageLoadingOverlay';
export { HeritageEmptyState, default as HeritageEmptyStateDefault } from './HeritageEmptyState';
export { HeritageProgressBar, HeritageCircularProgress, default as HeritageProgressBarDefault } from './HeritageProgressBar';

// Skeleton Loading
export {
    HeritageSkeleton,
    SkeletonCard,
    SkeletonStoryCard,
    SkeletonList,
    default as HeritageSkeletonDefault,
} from './HeritageSkeleton';

// Interactive Elements
export { HeritageFAB, default as HeritageFABDefault } from './HeritageFAB';
export { HeritageSwipeableRow, default as HeritageSwipeableRowDefault } from './HeritageSwipeableRow';
export { HeritageRefreshControl, default as HeritageRefreshControlDefault } from './HeritageRefreshControl';

// Animations
export { HeritageLottie, default as HeritageLottieDefault } from './HeritageLottie';

// Forms
export { HeritageSelect, default as HeritageSelectDefault } from './HeritageSelect';

// Theme
export {
    HeritageThemeProvider,
    useHeritageTheme,
    useTheme,
    lightTheme,
    darkTheme,
    default as HeritageThemeDefault,
} from './HeritageTheme';
export type { HeritageTheme, ThemeMode } from './HeritageTheme';
