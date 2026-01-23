/**
 * HeritageFAB - Floating Action Button with animations.
 *
 * Features:
 * - Press scale animation
 * - Shadow depth change on press
 * - Expandable menu option
 * - Haptic feedback
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageFAB
 *   icon="add"
 *   onPress={handleAdd}
 * />
 *
 * // With expandable menu
 * <HeritageFAB
 *   icon="add"
 *   actions={[
 *     { icon: 'mic', label: 'Record', onPress: handleRecord },
 *     { icon: 'camera', label: 'Photo', onPress: handlePhoto },
 *   ]}
 * />
 */

import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Heritage Memoir Design Tokens
const TOKENS = {
    primary: '#B85A3B',
    onPrimary: '#FFFFFF',
    surface: '#FFFCF7',
    onSurface: '#1E293B',
    shadow: '#B85A3B',
} as const;

const FAB_SIZE = 64;
const MINI_FAB_SIZE = 48;

type FABAction = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
};

type HeritageFABProps = {
    /** Main FAB icon */
    icon: keyof typeof Ionicons.glyphMap;
    /** Icon when expanded (defaults to 'close') */
    iconExpanded?: keyof typeof Ionicons.glyphMap;
    /** Simple press handler (when no actions provided) */
    onPress?: () => void;
    /** Expandable action menu */
    actions?: FABAction[];
    /** Position from bottom */
    bottom?: number;
    /** Position from right */
    right?: number;
    /** Accessibility label */
    accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeritageFAB({
    icon,
    iconExpanded = 'close',
    onPress,
    actions,
    bottom = 24,
    right = 24,
    accessibilityLabel = 'Action button',
}: HeritageFABProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Animation values
    const scale = useSharedValue(1);
    const shadowRadius = useSharedValue(12);
    const rotation = useSharedValue(0);
    const expandProgress = useSharedValue(0);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.92, { damping: 15 });
        shadowRadius.value = withTiming(6, { duration: 100 });
    }, [scale, shadowRadius]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 15 });
        shadowRadius.value = withTiming(12, { duration: 100 });
    }, [scale, shadowRadius]);

    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (actions && actions.length > 0) {
            // Toggle expanded state
            const newExpanded = !isExpanded;
            setIsExpanded(newExpanded);
            expandProgress.value = withSpring(newExpanded ? 1 : 0, { damping: 18 });
            rotation.value = withSpring(newExpanded ? 45 : 0, { damping: 15 });
        } else if (onPress) {
            onPress();
        }
    }, [actions, isExpanded, expandProgress, rotation, onPress]);

    const handleActionPress = useCallback((action: FABAction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsExpanded(false);
        expandProgress.value = withTiming(0, { duration: 200 });
        rotation.value = withTiming(0, { duration: 200 });
        setTimeout(() => action.onPress(), 100);
    }, [expandProgress, rotation]);

    // Animated styles
    const fabStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotation.value}deg` },
        ],
        shadowRadius: shadowRadius.value,
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: expandProgress.value * 0.3,
        pointerEvents: expandProgress.value > 0 ? 'auto' : 'none',
    }));

    return (
        <>
            {/* Backdrop when expanded */}
            {actions && (
                <AnimatedPressable
                    style={[styles.backdrop, backdropStyle]}
                    onPress={() => {
                        setIsExpanded(false);
                        expandProgress.value = withTiming(0, { duration: 200 });
                        rotation.value = withTiming(0, { duration: 200 });
                    }}
                />
            )}

            <View style={[styles.container, { bottom, right }]}>
                {/* Action buttons */}
                {actions && actions.map((action, index) => {
                    const actionStyle = useAnimatedStyle(() => {
                        const translateY = interpolate(
                            expandProgress.value,
                            [0, 1],
                            [0, -(index + 1) * 70]
                        );
                        const opacity = expandProgress.value;
                        const actionScale = interpolate(expandProgress.value, [0, 1], [0.6, 1]);

                        return {
                            transform: [
                                { translateY },
                                { scale: actionScale },
                            ],
                            opacity,
                        };
                    });

                    return (
                        <Animated.View key={index} style={[styles.actionContainer, actionStyle]}>
                            <View style={styles.actionLabel}>
                                <Text style={styles.actionLabelText}>{action.label}</Text>
                            </View>
                            <Pressable
                                style={styles.actionButton}
                                onPress={() => handleActionPress(action)}
                            >
                                <Ionicons name={action.icon} size={24} color={TOKENS.onPrimary} />
                            </Pressable>
                        </Animated.View>
                    );
                })}

                {/* Main FAB */}
                <AnimatedPressable
                    style={[styles.fab, fabStyle]}
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole="button"
                >
                    <Ionicons
                        name={isExpanded ? iconExpanded : icon}
                        size={28}
                        color={TOKENS.onPrimary}
                    />
                </AnimatedPressable>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        // Terracotta shadow
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        elevation: 12,
    },
    actionContainer: {
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionLabel: {
        backgroundColor: TOKENS.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 12,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    actionLabelText: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.onSurface,
    },
    actionButton: {
        width: MINI_FAB_SIZE,
        height: MINI_FAB_SIZE,
        borderRadius: MINI_FAB_SIZE / 2,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        // Terracotta shadow
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        elevation: 8,
    },
});

export default HeritageFAB;
