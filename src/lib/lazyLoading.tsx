/**
 * Lazy Loading Utilities - Component-level code splitting
 *
 * Provides utilities for lazy loading heavy components in React Native.
 * Uses React.lazy with custom Suspense fallbacks for better UX.
 *
 * Note: Expo Router already handles route-level code splitting.
 * This module focuses on component-level optimization for heavy features.
 *
 * @example
 * ```typescript
 * const WaveformVisualizer = createLazyComponent(
 *   () => import('@/features/recorder/components/WaveformVisualizer'),
 *   { fallback: 'skeleton' }
 * );
 * ```
 */

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { HeritageSkeleton } from '@/components/ui/heritage/HeritageSkeleton';

type FallbackType = 'spinner' | 'skeleton' | 'none' | ReactNode;

interface LazyComponentOptions {
  /** Type of loading fallback to show */
  fallback?: FallbackType;
  /** Minimum delay before showing content (prevents flash) */
  minDelayMs?: number;
}

/**
 * Default loading spinner fallback
 */
function SpinnerFallback(): JSX.Element {
  return (
    <View style={styles.fallbackContainer}>
      <ActivityIndicator size="large" color="#D97757" />
    </View>
  );
}

/**
 * Skeleton loading fallback
 */
function SkeletonFallback(): JSX.Element {
  return (
    <View style={styles.fallbackContainer}>
      <HeritageSkeleton variant="card" />
    </View>
  );
}

/**
 * Get the appropriate fallback component
 */
function getFallback(fallbackType: FallbackType): ReactNode {
  if (fallbackType === 'spinner') return <SpinnerFallback />;
  if (fallbackType === 'skeleton') return <SkeletonFallback />;
  if (fallbackType === 'none') return null;
  return fallbackType; // Custom ReactNode
}

/**
 * Create a lazy-loaded component with Suspense boundary
 *
 * @param importFn - Dynamic import function returning the component
 * @param options - Configuration options
 * @returns Wrapped component with lazy loading
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): T {
  const { fallback = 'spinner' } = options;

  const LazyComponent = React.lazy(importFn);

  // Create wrapper component that includes Suspense
  function WrappedComponent(props: React.ComponentProps<T>): JSX.Element {
    return (
      <Suspense fallback={getFallback(fallback)}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  // Preserve display name for debugging
  WrappedComponent.displayName = `Lazy(${(LazyComponent as any).displayName || 'Component'})`;

  return WrappedComponent as unknown as T;
}

/**
 * Higher-order component for lazy loading with error boundary
 *
 * @param importFn - Dynamic import function
 * @param options - Configuration options
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
): ComponentType<P> {
  return createLazyComponent(importFn, options);
}

/**
 * Preload a lazy component before it's needed
 * Call this during idle time or before navigation
 *
 * @param importFn - The same import function used with createLazyComponent
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<unknown> }>
): void {
  // Trigger the import to start loading
  importFn().catch(() => {
    // Silently ignore preload failures
  });
}

/**
 * Preload multiple components in parallel
 */
export function preloadComponents(
  importFns: (() => Promise<{ default: ComponentType<unknown> }>)[]
): void {
  importFns.forEach(preloadComponent);
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
});
