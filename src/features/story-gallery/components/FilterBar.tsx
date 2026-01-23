/**
 * FilterBar - Category chips for filtering stories
 * FIXED VERSION: 
 * - Removed conflicting shadow/elevation styles that caused artifacts
 * - Properly implemented flex-wrap layout
 * - High contrast text colors
 * - Clean, flat design that works reliably on Android
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type FilterCategory = 'all' | 'adventures' | 'reflections' | 'milestones' | 'childhood' | 'family';

interface FilterBarProps {
    selectedCategory: FilterCategory;
    onSelectCategory: (category: FilterCategory) => void;
}

const CATEGORIES: { id: FilterCategory; label: string; icon?: keyof typeof Ionicons.glyphMap; iconColor?: string }[] = [
    { id: 'all', label: 'All Stories' },
    { id: 'adventures', label: 'Adventures', icon: 'sparkles', iconColor: '#D97757' },
    { id: 'reflections', label: 'Reflections', icon: 'bulb', iconColor: '#60A5FA' },
    { id: 'milestones', label: 'Milestones', icon: 'star', iconColor: '#F59E0B' },
    { id: 'childhood', label: 'Childhood', icon: 'home', iconColor: '#7D9D7A' },
    { id: 'family', label: 'Family', icon: 'heart', iconColor: '#EABFAA' },
];

export const FilterBar = ({ selectedCategory, onSelectCategory }: FilterBarProps) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;

                    return (
                        <Pressable
                            key={cat.id}
                            onPress={() => onSelectCategory(cat.id)}
                            style={({ pressed }) => [
                                styles.pill,
                                isSelected ? styles.pillActive : styles.pillInactive,
                                pressed && styles.pillPressed
                            ]}
                        >
                            {cat.icon && (
                                <Ionicons
                                    name={cat.icon}
                                    size={16}
                                    color={isSelected ? '#FFFFFF' : cat.iconColor}
                                    style={styles.icon}
                                />
                            )}
                            <Text
                                style={[
                                    styles.text,
                                    isSelected ? styles.textActive : styles.textInactive
                                ]}
                            >
                                {cat.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // No border, seamless background
        backgroundColor: '#FFFAF5',
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
    pillActive: {
        backgroundColor: '#D97757',
        borderColor: '#D97757',
        // Completely removed elevation/shadow to prevent Android DecorView crash
    },
    pillInactive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E7E5E4',
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
    textActive: {
        color: '#FFFFFF',
    },
    textInactive: {
        color: '#44403C',
    },
});
