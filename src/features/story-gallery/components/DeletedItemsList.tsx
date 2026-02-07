import { Ionicons } from '@/components/ui/Icon';
import { AudioRecording } from '@/types/entities';
import { getDaysRemaining } from '../services/storyService';
import { formatDate } from '../utils/date-utils';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { View, Pressable } from 'react-native';

interface DeletedItemsListProps {
  items: AudioRecording[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  isLoading?: boolean;
}

/**
 * List of soft-deleted stories with restore option.
 * Implements AC: 4 from Story 3.3
 */
export function DeletedItemsList({
  items,
  onRestore,
  onPermanentDelete,
  isLoading,
}: DeletedItemsListProps): JSX.Element {
  const { colors } = useHeritageTheme();

  const renderRow = useCallback(
    ({ item, index }: { item: AudioRecording; index: number }) => {
      const daysRemaining = item.deletedAt ? getDaysRemaining(item.deletedAt) : 0;
      const isLast = index === items.length - 1;

      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.surfaceCard,
            borderBottomWidth: isLast ? 0 : 0.5,
            borderColor: colors.border,
          }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <AppText
              style={{ fontSize: 16, fontWeight: '600', color: colors.onSurface, marginBottom: 2 }}
              numberOfLines={1}>
              {item.title || 'Untitled Story'}
            </AppText>
            <AppText style={{ fontSize: 12, color: `${colors.onSurface}99` }}>
              Deleted {formatDate(new Date(item.deletedAt || Date.now()))}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText style={{ fontSize: 12, fontWeight: '500', color: daysRemaining < 7 ? colors.error : `${colors.onSurface}60` }}>
                {daysRemaining} days left
              </AppText>
            </View>

            <Pressable
              onPress={() => onRestore(item.id)}
              style={({ pressed }) => ({
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 16,
                paddingHorizontal: 12,
                backgroundColor: `${colors.primary}15`,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppText style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                Recover
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => onPermanentDelete(item.id)}
              style={({ pressed }) => ({
                height: 32,
                width: 32,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 16,
                backgroundColor: `${colors.error}10`,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          </View>
        </View>
      );
    },
    [colors, items.length, onRestore, onPermanentDelete]
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <AppText style={{ fontSize: 16, color: `${colors.onSurface}80` }}>
          Loading deleted items...
        </AppText>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            marginBottom: 16,
            height: 64,
            width: 64,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 32,
            backgroundColor: `${colors.onSurface}08`
          }}>
          <Ionicons
            name="trash-outline"
            size={32}
            color={colors.onSurface}
            style={{ opacity: 0.5 }}
          />
        </View>
        <AppText style={{ fontSize: 16, textAlign: 'center', color: `${colors.onSurface}80` }}>
          No deleted stories found.
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={{
        margin: 16,
        overflow: 'hidden',
        borderRadius: 12,
        backgroundColor: colors.surfaceCard
      }}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      />
    </View>
  );
}
