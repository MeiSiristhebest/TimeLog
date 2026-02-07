/**
 * Lazy Component Exports
 *
 * Pre-configured lazy-loaded versions of heavy components.
 * These components are loaded on-demand to reduce initial bundle size.
 *
 * Usage:
 * ```typescript
 * import { LazyWaveformVisualizer, LazyStoryPlayer } from '@/lib/lazyComponents';
 * ```
 */

import { createLazyComponent, preloadComponents } from './lazyLoading';

/**
 * WaveformVisualizer - Heavy Skia-based component
 * Only loaded when recording screen needs visualization
 */
export const LazyWaveformVisualizer = createLazyComponent(
  () => import('@/features/recorder/components/WaveformVisualizer') as any,
  { fallback: 'none' }
);

/**
 * StoryPlayer - Audio playback component with progress tracking
 * Only loaded when viewing story details
 */
export const LazyStoryPlayer = createLazyComponent(
  () => import('@/features/story-gallery/components/AudioPlayer') as any,
  { fallback: 'skeleton' }
);

/**
 * TimelineLayout - Complex timeline visualization
 * Only loaded when gallery has stories
 */
export const LazyTimelineLayout = createLazyComponent(
  () => import('@/features/story-gallery/components/TimelineLayout') as any,
  { fallback: 'skeleton' }
);

/**
 * CommentList - Family comments feature
 * Only loaded when viewing story comments
 */
export const LazyCommentList = createLazyComponent(
  () => import('@/features/family-listener/components/CommentList') as any,
  { fallback: 'skeleton' }
);

/**
 * Preload commonly used components during app idle time
 * Call this after initial app render to warm up the cache
 */
export function preloadCommonComponents(): void {
  preloadComponents([
    () => import('@/features/story-gallery/components/TimelineLayout') as any,
    () => import('@/features/story-gallery/components/AudioPlayer') as any,
  ]);
}
