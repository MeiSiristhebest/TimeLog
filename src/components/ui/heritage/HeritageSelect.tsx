/**
 * HeritageSelect - Custom dropdown/select component.
 *
 * Features:
 * - Bottom sheet option list
 * - Search/filter capability
 * - Multi-select support
 * - Checkmark indicators
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageSelect
 *   label="Category"
 *   options={[
 *     { value: 'family', label: 'Family Stories' },
 *     { value: 'travel', label: 'Travel Memories' },
 *   ]}
 *   value={category}
 *   onValueChange={setCategory}
 * />
 */

import { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    Pressable,
    TextInput,
    FlatList,
    StyleSheet,
    Modal,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Heritage Memoir Design Tokens
const TOKENS = {
    primary: '#B85A3B',
    surface: '#FFFCF7',
    surfaceSecondary: '#F9F3E8',
    onSurface: '#1E293B',
    textMuted: '#475569',
    border: '#E2E8F0',
    backdrop: 'rgba(30, 41, 59, 0.4)',
    success: '#6B8E6B',
} as const;

type SelectOption = {
    value: string;
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    disabled?: boolean;
};

type HeritageSelectProps = {
    /** Label text */
    label: string;
    /** Options list */
    options: SelectOption[];
    /** Selected value (single select) */
    value?: string;
    /** Selected values (multi select) */
    values?: string[];
    /** Change handler (single select) */
    onValueChange?: (value: string) => void;
    /** Change handler (multi select) */
    onValuesChange?: (values: string[]) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Enable multi-select */
    multiple?: boolean;
    /** Enable search */
    searchable?: boolean;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Error message */
    error?: string;
    /** Disabled state */
    disabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeritageSelect({
    label,
    options,
    value,
    values = [],
    onValueChange,
    onValuesChange,
    placeholder = 'Select an option',
    multiple = false,
    searchable = false,
    searchPlaceholder = 'Search...',
    error,
    disabled = false,
}: HeritageSelectProps) {
    const insets = useSafeAreaInsets();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Animation values
    const scale = useSharedValue(1);
    const sheetY = useSharedValue(500);
    const backdropOpacity = useSharedValue(0);

    // Filter options by search
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const query = searchQuery.toLowerCase();
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(query)
        );
    }, [options, searchQuery]);

    // Get display text
    const displayText = useMemo(() => {
        if (multiple) {
            if (values.length === 0) return placeholder;
            if (values.length === 1) {
                return options.find((o) => o.value === values[0])?.label || placeholder;
            }
            return `${values.length} selected`;
        }
        return options.find((o) => o.value === value)?.label || placeholder;
    }, [multiple, value, values, options, placeholder]);

    const isSelected = useCallback(
        (optionValue: string) => {
            if (multiple) {
                return values.includes(optionValue);
            }
            return value === optionValue;
        },
        [multiple, value, values]
    );

    const handleOpen = useCallback(() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsOpen(true);
        setSearchQuery('');
        backdropOpacity.value = withTiming(1, { duration: 200 });
        sheetY.value = withSpring(0, { damping: 25, stiffness: 300 });
    }, [disabled, backdropOpacity, sheetY]);

    const handleClose = useCallback(() => {
        backdropOpacity.value = withTiming(0, { duration: 150 });
        sheetY.value = withTiming(500, { duration: 200 });
        setTimeout(() => setIsOpen(false), 200);
    }, [backdropOpacity, sheetY]);

    const handleSelect = useCallback(
        (option: SelectOption) => {
            if (option.disabled) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (multiple) {
                const newValues = values.includes(option.value)
                    ? values.filter((v) => v !== option.value)
                    : [...values, option.value];
                onValuesChange?.(newValues);
            } else {
                onValueChange?.(option.value);
                handleClose();
            }
        },
        [multiple, values, onValueChange, onValuesChange, handleClose]
    );

    const handlePressIn = useCallback(() => {
        if (disabled) return;
        scale.value = withSpring(0.98, { damping: 15 });
    }, [disabled, scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 15 });
    }, [scale]);

    // Animated styles
    const triggerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: sheetY.value }],
    }));

    const renderOption = ({ item }: { item: SelectOption }) => {
        const selected = isSelected(item.value);
        return (
            <Pressable
                style={[
                    styles.option,
                    selected && styles.optionSelected,
                    item.disabled && styles.optionDisabled,
                ]}
                onPress={() => handleSelect(item)}
                disabled={item.disabled}
            >
                {item.icon && (
                    <Ionicons
                        name={item.icon}
                        size={22}
                        color={item.disabled ? TOKENS.textMuted : TOKENS.onSurface}
                        style={styles.optionIcon}
                    />
                )}
                <Text
                    style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                        item.disabled && styles.optionLabelDisabled,
                    ]}
                >
                    {item.label}
                </Text>
                {selected && (
                    <Ionicons name="checkmark" size={22} color={TOKENS.primary} />
                )}
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            {/* Label */}
            <Text style={styles.label}>{label}</Text>

            {/* Trigger */}
            <AnimatedPressable
                style={[
                    styles.trigger,
                    error && styles.triggerError,
                    disabled && styles.triggerDisabled,
                    triggerStyle,
                ]}
                onPress={handleOpen}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
            >
                <Text
                    style={[
                        styles.triggerText,
                        !value && !values.length && styles.triggerPlaceholder,
                    ]}
                    numberOfLines={1}
                >
                    {displayText}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={20}
                    color={TOKENS.textMuted}
                />
            </AnimatedPressable>

            {/* Error */}
            {error && <Text style={styles.error}>{error}</Text>}

            {/* Bottom Sheet Modal */}
            <Modal
                visible={isOpen}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={handleClose}
            >
                <View style={styles.modalContainer}>
                    {/* Backdrop */}
                    <AnimatedPressable
                        style={[styles.backdrop, backdropStyle]}
                        onPress={handleClose}
                    />

                    {/* Sheet */}
                    <Animated.View
                        style={[
                            styles.sheet,
                            { paddingBottom: insets.bottom + 16 },
                            sheetStyle,
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>{label}</Text>
                            {multiple && values.length > 0 && (
                                <Pressable
                                    onPress={() => {
                                        onValuesChange?.([]);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <Text style={styles.clearButton}>Clear all</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Search */}
                        {searchable && (
                            <View style={styles.searchContainer}>
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color={TOKENS.textMuted}
                                    style={styles.searchIcon}
                                />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder={searchPlaceholder}
                                    placeholderTextColor={TOKENS.textMuted}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {searchQuery.length > 0 && (
                                    <Pressable onPress={() => setSearchQuery('')}>
                                        <Ionicons
                                            name="close-circle"
                                            size={20}
                                            color={TOKENS.textMuted}
                                        />
                                    </Pressable>
                                )}
                            </View>
                        )}

                        {/* Options */}
                        <FlatList
                            data={filteredOptions}
                            keyExtractor={(item) => item.value}
                            renderItem={renderOption}
                            style={styles.optionsList}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No options found</Text>
                                </View>
                            }
                        />

                        {/* Done button for multi-select */}
                        {multiple && (
                            <Pressable style={styles.doneButton} onPress={handleClose}>
                                <Text style={styles.doneButtonText}>Done</Text>
                            </Pressable>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.onSurface,
        marginBottom: 8,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: TOKENS.surface,
        borderWidth: 1,
        borderColor: TOKENS.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
    },
    triggerError: {
        borderColor: '#B84A4A',
    },
    triggerDisabled: {
        backgroundColor: TOKENS.surfaceSecondary,
        opacity: 0.6,
    },
    triggerText: {
        flex: 1,
        fontSize: 18,
        color: TOKENS.onSurface,
    },
    triggerPlaceholder: {
        color: TOKENS.textMuted,
    },
    error: {
        fontSize: 14,
        color: '#B84A4A',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: TOKENS.backdrop,
    },
    sheet: {
        backgroundColor: TOKENS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        paddingTop: 8,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: TOKENS.border,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TOKENS.onSurface,
    },
    clearButton: {
        fontSize: 16,
        color: TOKENS.primary,
        fontWeight: '500',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: TOKENS.surfaceSecondary,
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: TOKENS.onSurface,
        paddingVertical: 12,
    },
    optionsList: {
        flexGrow: 0,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: TOKENS.border,
    },
    optionSelected: {
        backgroundColor: `${TOKENS.primary}10`,
    },
    optionDisabled: {
        opacity: 0.4,
    },
    optionIcon: {
        marginRight: 12,
    },
    optionLabel: {
        flex: 1,
        fontSize: 18,
        color: TOKENS.onSurface,
    },
    optionLabelSelected: {
        color: TOKENS.primary,
        fontWeight: '600',
    },
    optionLabelDisabled: {
        color: TOKENS.textMuted,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: TOKENS.textMuted,
    },
    doneButton: {
        backgroundColor: TOKENS.primary,
        marginHorizontal: 16,
        marginTop: 16,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default HeritageSelect;
