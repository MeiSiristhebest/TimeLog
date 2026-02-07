/**
 * Category Filter Component - Horizontal scrollable category pills
 * F3.2: Category Filter for Topics Discovery screen
 *
 * Design: Elderly-friendly with large touch targets and high contrast
 */

import { AppText } from '@/components/ui/AppText';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import type { QuestionCategory } from '@/db/schema/familyQuestions';
import { QUESTION_CATEGORIES } from '@/db/schema/familyQuestions';
import { View, ScrollView, Pressable } from 'react-native';

// Category metadata for display
export const CATEGORY_METADATA: Record<
    QuestionCategory,
    { label: string; icon: any; color: string }
> = {
    [QUESTION_CATEGORIES.GENERAL]: { label: 'General', icon: 'chatbubbles', color: '#90A4AE' },
    [QUESTION_CATEGORIES.CHILDHOOD]: { label: 'Childhood', icon: 'happy', color: '#FF9E80' },
    [QUESTION_CATEGORIES.FAMILY_HISTORY]: { label: 'Family History', icon: 'people', color: '#80D8FF' },
    [QUESTION_CATEGORIES.WISDOM]: { label: 'Wisdom', icon: 'bulb', color: '#81C784' },
    [QUESTION_CATEGORIES.FUN]: { label: 'Fun', icon: 'star', color: '#FFD54F' },
};

export interface CategoryFilterProps {
    selectedCategories: QuestionCategory[];
    onCategoryToggle: (category: QuestionCategory) => void;
}

export function CategoryFilter({ selectedCategories, onCategoryToggle }: CategoryFilterProps) {
    const { colors } = useHeritageTheme();

    // If no categories selected, show all
    const isAllSelected = selectedCategories.length === 0;

    const handleCategoryPress = (category: QuestionCategory) => {
        onCategoryToggle(category);
    };

    const categories = Object.keys(CATEGORY_METADATA) as QuestionCategory[];

    return (
        <View className="py-3">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                className="flex-grow-0">
                {categories.map((category) => {
                    const meta = CATEGORY_METADATA[category];
                    const isSelected =
                        selectedCategories.includes(category) ||
                        (isAllSelected && category === QUESTION_CATEGORIES.GENERAL);

                    return (
                        <Pressable
                            key={category}
                            onPress={() => handleCategoryPress(category)}
                            accessibilityRole="button"
                            accessibilityLabel={meta.label}
                            accessibilityState={{ selected: isSelected }}
                            className="flex-row items-center px-5 py-3.5 rounded-full border-2 gap-2.5 min-h-[56px] shadow-sm elevation-3"
                            style={({ pressed }) => [
                                {
                                    backgroundColor: isSelected ? meta.color : colors.surface,
                                    borderColor: isSelected ? meta.color : colors.border,
                                    opacity: pressed ? 0.7 : 1,
                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                },
                            ]}>
                            <Ionicons
                                name={meta.icon}
                                size={24}
                                color={isSelected ? '#000' : colors.textMuted}
                            />
                            <AppText
                                className="text-lg tracking-wide"
                                style={{
                                    color: isSelected ? '#000' : colors.textMuted,
                                    fontWeight: isSelected ? '700' : '600',
                                }}>
                                {meta.label}
                            </AppText>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}
