import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';

export type SortOption = 'newest' | 'oldest' | 'longest' | 'shortest';

interface SortOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    currentSort: SortOption;
    onSelectSort: (sort: SortOption) => void;
}

/**
 * Sort Options Modal - Heritage Design
 * Similar to DeleteConfirmModal but for selection.
 */
export function SortOptionsModal({
    visible,
    onClose,
    currentSort,
    onSelectSort,
}: SortOptionsModalProps) {
    const theme = useHeritageTheme();
    const { colors } = theme;

    // Animation Values
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
            Haptics.selectionAsync();
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            scale.value = withTiming(0.9, { duration: 150 });
        }
    }, [visible]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const handleSelect = (sort: SortOption) => {
        Haptics.selectionAsync();
        onSelectSort(sort);
        // Delay closing slightly for visual feedback? Or close immediately.
        // Close immediately usually feels snappier for simple selects.
        onClose();
    };

    if (!visible) return null;

    const renderOption = (label: string, value: SortOption, icon: keyof typeof Ionicons.glyphMap) => {
        const isSelected = currentSort === value;
        return (
            <TouchableOpacity
                onPress={() => handleSelect(value)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    backgroundColor: isSelected ? colors.surfaceAccent : 'transparent',
                    borderRadius: 16,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primaryMuted : 'transparent',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isSelected ? colors.primary : colors.surfaceDim,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Ionicons name={icon} size={20} color={isSelected ? colors.onPrimary : colors.textMuted} />
                    </View>
                    <Text style={{
                        fontSize: 17,
                        fontWeight: isSelected ? '600' : '500',
                        color: isSelected ? colors.onSurface : colors.textMuted,
                    }}>
                        {label}
                    </Text>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                {/* Dimmed Backdrop */}
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onClose}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <Animated.View
                        style={[{
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                        }, animatedBackdropStyle]}
                    />
                </TouchableOpacity>

                {/* Modal Content */}
                <Animated.View
                    style={[{
                        width: '100%',
                        maxWidth: 360,
                        backgroundColor: colors.surface,
                        borderRadius: 32,
                        padding: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.25,
                        shadowRadius: 20,
                        elevation: 10,
                    }, animatedContainerStyle]}
                >
                    {/* Header */}
                    <Text style={{
                        fontFamily: 'Fraunces_600SemiBold',
                        fontSize: 24,
                        color: colors.onSurface,
                        textAlign: 'center',
                        marginBottom: 24,
                        marginTop: 8,
                    }}>
                        Sort Stories
                    </Text>

                    {/* Options */}
                    <View>
                        {renderOption('Newest First', 'newest', 'calendar')}
                        {renderOption('Oldest First', 'oldest', 'time-outline')}
                        {renderOption('Longest', 'longest', 'timer-outline')}
                        {renderOption('Shortest', 'shortest', 'hourglass-outline')}
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            marginTop: 16,
                            alignItems: 'center',
                            paddingVertical: 12,
                        }}
                    >
                        <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>

                </Animated.View>
            </View>
        </Modal>
    );
}
