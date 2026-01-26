import { AppText } from '@/components/ui/AppText';
import React, { useCallback } from 'react';

import { FlatList } from 'react-native';
import { View } from '@/tw';
import { Ionicons } from '@/components/ui/Icon';
import { AudioRecording } from '@/types/entities';
import { getDaysRemaining } from '../services/storyService';
import { formatDate, formatDuration } from '../utils/date-utils';
import { useHeritageTheme } from '../../../theme/heritage';
import { HeritageButton } from '../../../components/ui/heritage/HeritageButton';

interface DeletedItemsListProps {
  items: AudioRecording[];
  onRestore: (id: string) => void;
  isLoading?: boolean;
}

/**
 * List of soft-deleted stories with restore option.
 * Implements AC: 4 from Story 3.3
 */

export function DeletedItemsList({
  items,
  onRestore,
  isLoading,
}: DeletedItemsListProps): JSX.Element {
  const { colors } = useHeritageTheme();

  const renderItem = useCallback(
    ({ item }: { item: AudioRecording }) => {
      const daysRemaining = item.deletedAt ? getDaysRemaining(item.deletedAt) : 0;

      return (
        <View
          className="flex-row items-center justify-between rounded-xl border p-4 shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
          <View className="mr-4 flex-1">
            <AppText
              className="text-lg"
              style={{ color: colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}
              numberOfLines={1}>
              {item.title || formatDate(new Date(item.startedAt))}
            </AppText>
            <AppText className="mt-1 text-sm" style={{ color: `${colors.onSurface}99` }}>
              {formatDuration(item.durationMs)} • Deleted{' '}
              {formatDate(new Date(item.deletedAt || Date.now()))}
            </AppText>
            <AppText className="mt-1 text-sm font-medium" style={{ color: colors.error }}>
              {daysRemaining} days remaining
            </AppText>
          </View>

          <HeritageButton
            title="Restore"
            size="small"
            variant="secondary"
            onPress={() => onRestore(item.id)}
          />
        </View>
      );
    },
    [colors, onRestore]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <AppText className="text-lg" style={{ color: `${colors.onSurface}80` }}>
          Loading deleted items...
        </AppText>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.onSurface}08` }}>
          <Ionicons
            name="trash-outline"
            size={32}
            color={colors.onSurface}
            style={{ opacity: 0.5 }}
          />
        </View>
        <AppText className="text-center text-lg" style={{ color: `${colors.onSurface}80` }}>
          No deleted stories found.
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
    />
  );
}
