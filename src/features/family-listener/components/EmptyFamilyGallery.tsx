/**
 * EmptyFamilyGallery - Empty state for family story list.
 *
 * Displayed when the linked senior has no recorded stories yet.
 * Uses friendly, encouraging messaging.
 *
 * Story 4.1: Family Story List (AC: 1)
 */

import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { View } from 'react-native';

export function EmptyFamilyGallery(): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View className="flex-1 items-center justify-center p-8">
      <View
        className="mb-6 h-[160px] w-[160px] items-center justify-center rounded-full"
        style={{ backgroundColor: `${colors.primary}10` }}>
        <Ionicons name="people-circle-outline" size={80} color={colors.primary} />
      </View>

      <AppText
        className="mb-2 text-center text-2xl font-semibold"
        style={{ color: colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}>
        Waiting for stories
      </AppText>

      <AppText className="text-center text-base leading-6" style={{ color: colors.textMuted }}>
        When your family records a memory, it will appear here instantly.
      </AppText>
    </View>
  );
}
