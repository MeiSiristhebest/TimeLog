/**
 * SkeletonCard - Loading placeholder for family story cards.
 *
 * Uses shimmer animation for visual feedback during loading.
 * Heritage Memoir Design - Warm parchment tones.
 * No spinners per UX specification.
 *
 * Story 4.1: Family Story List (AC: 1)
 */

import { View } from 'react-native';

// Heritage Palette skeleton colors
const SKELETON_PULSE = '#EDE5D8'; // Surface Dim

export const SkeletonCard = () => {
  return (
    <View
      className="mb-3 min-h-[72px] rounded-2xl border p-4 shadow-sm"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#E2E8F0' }}
    >
      <View className="flex-row items-center gap-3">
        {/* Icon placeholder */}
        <View
          className="h-10 w-10 rounded-full animate-pulse"
          style={{ backgroundColor: SKELETON_PULSE }}
        />

        {/* Content placeholder */}
        <View className="flex-1">
          {/* Title placeholder */}
          <View
            className="mb-2 h-5 w-3/4 rounded animate-pulse"
            style={{ backgroundColor: SKELETON_PULSE }}
          />
          {/* Date placeholder */}
          <View
            className="h-4 w-1/2 rounded animate-pulse"
            style={{ backgroundColor: SKELETON_PULSE }}
          />
        </View>

        {/* Duration + Play button placeholder */}
        <View className="flex-row items-center gap-3">
          <View
            className="h-4 w-10 rounded animate-pulse"
            style={{ backgroundColor: SKELETON_PULSE }}
          />
          <View
            className="h-12 w-12 rounded-full animate-pulse"
            style={{ backgroundColor: SKELETON_PULSE }}
          />
        </View>
      </View>
    </View>
  );
};
