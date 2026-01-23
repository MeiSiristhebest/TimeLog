import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioRecording } from '@/types/entities';
import { getDaysRemaining } from '../services/storyService';
import { formatDate, formatDuration } from '../utils/dateUtils';
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

export function DeletedItemsList({ items, onRestore, isLoading }: DeletedItemsListProps) {
  const theme = useHeritageTheme();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg" style={{ color: `${theme.colors.onSurface}80` }}>Loading deleted items...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${theme.colors.onSurface}08` }}
        >
          <Ionicons name="trash-outline" size={32} color={theme.colors.onSurface} style={{ opacity: 0.5 }} />
        </View>
        <Text className="text-lg text-center" style={{ color: `${theme.colors.onSurface}80` }}>
          No deleted stories found.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      renderItem={({ item }) => {
        const daysRemaining = item.deletedAt ? getDaysRemaining(item.deletedAt) : 0;

        return (
          <View
            className="rounded-xl p-4 border flex-row items-center justify-between shadow-sm"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow || theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-1 mr-4">
              <Text
                className="text-lg"
                style={{ color: theme.colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}
                numberOfLines={1}
              >
                {item.title || formatDate(new Date(item.startedAt))}
              </Text>
              <Text className="text-sm mt-1" style={{ color: `${theme.colors.onSurface}99` }}>
                {formatDuration(item.durationMs)} • Deleted {formatDate(new Date(item.deletedAt || Date.now()))}
              </Text>
              <Text className="text-sm font-medium mt-1" style={{ color: theme.colors.error }}>
                {daysRemaining} days remaining
              </Text>
            </View>

            <HeritageButton
              title="Restore"
              size="small"
              variant="secondary"
              onPress={() => onRestore(item.id)}
            />
          </View>
        );
      }}
    />
  );
}
