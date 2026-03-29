/**
 * FilterBar - Category chips for filtering stories
 * Optimized with NativeWind v4 and SF Symbols.
 */

import { Icon, Ionicons } from '@/components/ui/Icon';
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
    <View className="bg-surfaceWarm">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-6 py-3 items-center">
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
              className={`flex-row items-center rounded-full border px-[18px] py-[10px] min-h-[44px] ${
                isSelected ? 'bg-primary' : 'bg-surfaceCard'
              } ${index === CATEGORY_DATA.length - 1 ? '' : 'mr-3'}`}
              style={{ borderColor: isSelected ? colors.primary : colors.border }}>
              {cat.icon && (
                <View className="mr-1.5">
                  <Icon
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={isSelected ? colors.onPrimary : iconColor}
                  />
                </View>
              )}
              <AppText
                className={`text-[15px] font-semibold tracking-wider ${
                  isSelected ? 'text-onPrimary' : 'text-onSurface'
                }`}>
                {cat.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
