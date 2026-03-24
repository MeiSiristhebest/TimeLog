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
    { label: string; icon: keyof typeof Ionicons.glyphMap; colorKey: string }
> = {
    [QUESTION_CATEGORIES.GENERAL]: { label: 'General', icon: 'chatbubbles', colorKey: 'textMuted' },
    [QUESTION_CATEGORIES.CHILDHOOD]: { label: 'Childhood', icon: 'happy', colorKey: 'amberCustom' },
    [QUESTION_CATEGORIES.FAMILY]: { label: 'Family', icon: 'people', colorKey: 'primary' },
    [QUESTION_CATEGORIES.CAREER]: { label: 'Career', icon: 'briefcase', colorKey: 'sageGreen' },
    [QUESTION_CATEGORIES.HOBBIES]: { label: 'Hobbies', icon: 'color-palette', colorKey: 'blueAccent' },
    [QUESTION_CATEGORIES.TRAVEL]: { label: 'Travel', icon: 'airplane', colorKey: 'primaryMuted' },
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
        <View style={{ backgroundColor: colors.surfaceDim, paddingBottom: 12 }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    alignItems: 'center',
                }}>
                {categories.map((category, index) => {
                    const meta = CATEGORY_METADATA[category];
                    const isSelected =
                        selectedCategories.includes(category) ||
                        (isAllSelected && category === QUESTION_CATEGORIES.GENERAL);

                    // Dynamic mapped icon colors
                    const iconColor =
                        meta.colorKey === 'textMuted'
                            ? colors.textMuted
                            : meta.colorKey === 'primary'
                                ? colors.primary
                                : meta.colorKey === 'blueAccent'
                                    ? colors.blueAccent
                                    : meta.colorKey === 'amberCustom'
                                        ? colors.amberCustom
                                        : meta.colorKey === 'sageGreen'
                                            ? colors.sageGreen
                                            : meta.colorKey === 'primaryMuted'
                                                ? colors.primaryMuted
                                                : colors.textMuted;

                    return (
                        <Pressable
                            key={category}
                            onPress={() => handleCategoryPress(category)}
                            accessibilityRole="button"
                            accessibilityLabel={meta.label}
                            accessibilityState={{ selected: isSelected }}
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
                                { marginRight: index === categories.length - 1 ? 0 : 12, minHeight: 44 },
                            ]}>
                            {meta.icon && (
                                <Ionicons
                                    name={meta.icon}
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
                                {meta.label}
                            </AppText>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}
