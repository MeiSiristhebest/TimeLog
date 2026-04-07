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
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';

// Category metadata for display
export const CATEGORY_METADATA: Record<
    QuestionCategory,
    { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
    [QUESTION_CATEGORIES.GENERAL]: { label: 'General', icon: 'chatbubbles', color: '#90A4AE' },
    [QUESTION_CATEGORIES.CHILDHOOD]: { label: 'Childhood', icon: 'happy', color: '#FF9E80' },
    [QUESTION_CATEGORIES.FAMILY]: { label: 'Family', icon: 'people', color: '#80D8FF' },
    [QUESTION_CATEGORIES.CAREER]: { label: 'Career', icon: 'briefcase', color: '#81C784' },
    [QUESTION_CATEGORIES.HOBBIES]: { label: 'Hobbies', icon: 'color-palette', color: '#FFD54F' },
    [QUESTION_CATEGORIES.TRAVEL]: { label: 'Travel', icon: 'airplane', color: '#B39DDB' },
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
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}>
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
                            style={({ pressed }) => [
                                styles.pill,
                                {
                                    backgroundColor: isSelected ? meta.color : colors.surface,
                                    borderColor: isSelected ? meta.color : colors.border,
                                    opacity: pressed ? 0.7 : 1,
                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 3,
                                },
                            ]}>
                            <Ionicons
                                name={meta.icon}
                                size={24}
                                color={isSelected ? '#000' : colors.textMuted}
                            />
                            <AppText
                                style={{
                                    fontSize: 18,
                                    color: isSelected ? '#000' : colors.onSurface,
                                    fontWeight: isSelected ? '700' : '600',
                                    marginLeft: 10,
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

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    scrollView: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 999,
        borderWidth: 2,
        minHeight: 56,
    },
});
