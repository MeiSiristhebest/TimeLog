/**
 * SkeletonCard - Loading skeleton for story cards.
 * 
 * Provides visual feedback during data loading without spinners (UX spec).
 * Heritage Memoir Design - Uses warm parchment tones for skeleton elements.
 */

import { View } from 'react-native';

// Heritage Palette skeleton colors
const SKELETON_BG = '#F9F3E8'; // Surface
const SKELETON_PULSE = '#EDE5D8'; // Surface Dim

export const SkeletonCard = () => {
  return (
    <View
      className="mb-3 min-h-[72px] rounded-2xl p-4"
      style={{
        backgroundColor: '#FFFCF7',
        borderWidth: 1,
        borderColor: '#E2E8F0'
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        {/* Left: Icon skeleton */}
        <View
          className="h-10 w-10 rounded-xl animate-pulse"
          style={{ backgroundColor: SKELETON_PULSE }}
        />

        {/* Middle: Text skeletons */}
        <View className="flex-1 gap-2">
          <View
            className="h-5 w-3/4 rounded animate-pulse"
            style={{ backgroundColor: SKELETON_PULSE }}
          />
          <View
            className="h-4 w-1/2 rounded animate-pulse"
            style={{ backgroundColor: SKELETON_PULSE }}
          />
          <View
            className="mt-1 h-6 w-20 rounded-full animate-pulse"
            style={{ backgroundColor: SKELETON_PULSE }}
          />
        </View>

        {/* Right: Play button skeleton */}
        <View
          className="h-11 w-11 rounded-full animate-pulse"
          style={{ backgroundColor: SKELETON_PULSE }}
        />
      </View>
    </View>
  );
};
