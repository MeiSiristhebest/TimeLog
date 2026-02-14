/**
 * SkeletonCard - Loading skeleton for story cards.
 *
 * Provides visual feedback during data loading without spinners (UX spec).
 * Heritage Memoir Design - Uses warm parchment tones for skeleton elements.
 */

import React from 'react';
import { View } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';

export function SkeletonCard(): JSX.Element {
  const { colors, isDark } = useHeritageTheme();
  const pulseColor = isDark ? `${colors.border}66` : '#EDE5D8';

  return (
    <View
      className="mb-3 min-h-[72px] rounded-2xl p-4"
      style={{
        backgroundColor: colors.surfaceCard,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <View className="flex-row items-start justify-between gap-3">
        <View
          className="h-10 w-10 animate-pulse rounded-xl"
          style={{ backgroundColor: pulseColor }}
        />

        <View className="flex-1 gap-2">
          <View
            className="h-5 w-3/4 animate-pulse rounded"
            style={{ backgroundColor: pulseColor }}
          />
          <View
            className="h-4 w-1/2 animate-pulse rounded"
            style={{ backgroundColor: pulseColor }}
          />
          <View
            className="mt-1 h-6 w-20 animate-pulse rounded-full"
            style={{ backgroundColor: pulseColor }}
          />
        </View>

        <View
          className="h-11 w-11 animate-pulse rounded-full"
          style={{ backgroundColor: pulseColor }}
        />
      </View>
    </View>
  );
}
