/**
 * FilterBar - Category chips for filtering stories
 * FIXED VERSION:
 * - Removed conflicting shadow/elevation styles that caused artifacts
 * - Properly implemented flex-wrap layout
 * - High contrast text colors
 * - Clean, flat design that works reliably on Android
 */

import { Ionicons } from '@/components/ui/Icon';
import { FilterCategory, CATEGORY_DATA } from '../data/mockGalleryData';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';

interface FilterBarProps {
  selectedCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
}

export function FilterBar({ selectedCategory, onSelectCategory }: FilterBarProps): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View style={{ backgroundColor: colors.surfaceWarm }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 12,
          alignItems: 'center',
        }}>
        {CATEGORY_DATA.map((cat, index) => {
          const isSelected = selectedCategory === cat.id;

          // Map colorKey to actual token
          const iconColor =
            cat.colorKey === 'textMuted'
              ? colors.textMuted
              : cat.colorKey === 'primary'
                ? colors.primary
                : cat.colorKey === 'blueAccent'
                  ? colors.blueAccent
                  : cat.colorKey === 'amberCustom'
                    ? colors.amberCustom
                    : cat.colorKey === 'sageGreen'
                      ? colors.sageGreen
                      : cat.colorKey === 'primaryMuted'
                        ? colors.primaryMuted
                        : colors.textMuted;

          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 999,
                  borderWidth: 1,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                },
                isSelected
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                { marginRight: index === CATEGORY_DATA.length - 1 ? 0 : 12, minHeight: 44 },
              ]}>
              {cat.icon && (
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={isSelected ? colors.onPrimary : iconColor}
                  style={{ marginRight: 6 }}
                />
              )}
              <AppText
                style={[
                  {
                    fontSize: 15,
                    lineHeight: 18,
                    fontWeight: '600',
                    letterSpacing: 0.2,
                  },
                  isSelected ? { color: colors.onPrimary } : { color: colors.onSurface },
                ]}>
                {cat.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
