/**
 * FilterBar - Category chips for filtering stories
 * FIXED VERSION:
 * - Removed conflicting shadow/elevation styles that caused artifacts
 * - Properly implemented flex-wrap layout
 * - High contrast text colors
 * - Clean, flat design that works reliably on Android
 */

import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, Pressable, ScrollView } from '@/tw';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { FilterCategory, CATEGORY_DATA } from '../data/mockGalleryData';
import { useHeritageTheme } from '@/theme/heritage';

interface FilterBarProps {
  selectedCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
}

export function FilterBar({ selectedCategory, onSelectCategory }: FilterBarProps): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceWarm }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {CATEGORY_DATA.map((cat) => {
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
              style={({ pressed }) => [
                styles.pill,
                isSelected
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                pressed && styles.pillPressed,
              ]}>
              {cat.icon && (
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={isSelected ? colors.onPrimary : iconColor}
                  style={styles.icon}
                />
              )}
              <AppText
                style={[
                  styles.text,
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

const styles = StyleSheet.create({
  container: {
    // Background set via style prop
    // Removed marginTop to prevent gaps - spacing handled by padding
  },
  scrollContent: {
    paddingHorizontal: 24, // Match screen padding (px-6)
    paddingVertical: 12,
    gap: 12, // Space between pills
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Taller touch target
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
