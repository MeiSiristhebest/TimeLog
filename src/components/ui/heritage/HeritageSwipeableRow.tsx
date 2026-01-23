/**
 * HeritageSwipeableRow - Swipeable list item with actions.
 *
 * Features:
 * - Left/right actions reveal
 * - Haptic feedback at thresholds
 * - Auto-snap back
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageSwipeableRow
 *   leftActions={[
 *     { icon: 'archive', color: '#6B8E6B', onPress: handleArchive }
 *   ]}
 *   rightActions={[
 *     { icon: 'trash', color: '#B84A4A', onPress: handleDelete }
 *   ]}
 * >
 *   <YourListItemContent />
 * </HeritageSwipeableRow>
 */

import { ReactNode, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTION_WIDTH = 80;
const THRESHOLD = 40;

type SwipeAction = {
    icon: keyof typeof Ionicons.glyphMap;
    label?: string;
    color: string;
    onPress: () => void;
};

type HeritageSwipeableRowProps = {
    children: ReactNode;
    leftActions?: SwipeAction[];
    rightActions?: SwipeAction[];
    onSwipeStart?: () => void;
    onSwipeEnd?: () => void;
};

export function HeritageSwipeableRow({
    children,
    leftActions = [],
    rightActions = [],
    onSwipeStart,
    onSwipeEnd,
}: HeritageSwipeableRowProps) {
    const translateX = useSharedValue(0);
    const hasTriggeredHaptic = useRef(false);
    const startX = useRef(0);

    const maxLeftSwipe = leftActions.length * ACTION_WIDTH;
    const maxRightSwipe = rightActions.length * ACTION_WIDTH;

    const triggerHaptic = useCallback(() => {
        if (!hasTriggeredHaptic.current) {
            hasTriggeredHaptic.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, []);

    const resetHaptic = useCallback(() => {
        hasTriggeredHaptic.current = false;
    }, []);

    const close = useCallback(() => {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    }, [translateX]);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            startX.current = translateX.value;
            if (onSwipeStart) runOnJS(onSwipeStart)();
        })
        .onUpdate((event) => {
            let newX = startX.current + event.translationX;

            // Clamp and add resistance at edges
            if (newX > maxLeftSwipe) {
                newX = maxLeftSwipe + (newX - maxLeftSwipe) * 0.2;
            } else if (newX < -maxRightSwipe) {
                newX = -maxRightSwipe + (newX + maxRightSwipe) * 0.2;
            }

            translateX.value = newX;

            // Haptic feedback at threshold
            if (Math.abs(newX) > THRESHOLD) {
                runOnJS(triggerHaptic)();
            } else {
                runOnJS(resetHaptic)();
            }
        })
        .onEnd((event) => {
            if (onSwipeEnd) runOnJS(onSwipeEnd)();
            runOnJS(resetHaptic)();

            // Snap to open or closed
            if (event.velocityX > 500 && leftActions.length > 0) {
                translateX.value = withSpring(maxLeftSwipe, { damping: 20 });
            } else if (event.velocityX < -500 && rightActions.length > 0) {
                translateX.value = withSpring(-maxRightSwipe, { damping: 20 });
            } else if (translateX.value > maxLeftSwipe / 2) {
                translateX.value = withSpring(maxLeftSwipe, { damping: 20 });
            } else if (translateX.value < -maxRightSwipe / 2) {
                translateX.value = withSpring(-maxRightSwipe, { damping: 20 });
            } else {
                translateX.value = withSpring(0, { damping: 20 });
            }
        });

    const rowStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const leftActionsStyle = useAnimatedStyle(() => ({
        width: Math.max(0, translateX.value),
    }));

    const rightActionsStyle = useAnimatedStyle(() => ({
        width: Math.max(0, -translateX.value),
    }));

    const handleActionPress = useCallback((action: SwipeAction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        close();
        setTimeout(() => action.onPress(), 200);
    }, [close]);

    return (
        <View style={styles.container}>
            {/* Left actions */}
            {leftActions.length > 0 && (
                <Animated.View style={[styles.actionsContainer, styles.leftActions, leftActionsStyle]}>
                    {leftActions.map((action, index) => (
                        <Pressable
                            key={index}
                            style={[styles.action, { backgroundColor: action.color }]}
                            onPress={() => handleActionPress(action)}
                        >
                            <Ionicons name={action.icon} size={24} color="#FFFFFF" />
                            {action.label && <Text style={styles.actionLabel}>{action.label}</Text>}
                        </Pressable>
                    ))}
                </Animated.View>
            )}

            {/* Right actions */}
            {rightActions.length > 0 && (
                <Animated.View style={[styles.actionsContainer, styles.rightActions, rightActionsStyle]}>
                    {rightActions.map((action, index) => (
                        <Pressable
                            key={index}
                            style={[styles.action, { backgroundColor: action.color }]}
                            onPress={() => handleActionPress(action)}
                        >
                            <Ionicons name={action.icon} size={24} color="#FFFFFF" />
                            {action.label && <Text style={styles.actionLabel}>{action.label}</Text>}
                        </Pressable>
                    ))}
                </Animated.View>
            )}

            {/* Content */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.content, rowStyle]}>
                    {children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    actionsContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    leftActions: {
        left: 0,
        justifyContent: 'flex-start',
    },
    rightActions: {
        right: 0,
        justifyContent: 'flex-end',
    },
    action: {
        width: ACTION_WIDTH,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 4,
    },
    content: {
        backgroundColor: '#FFFCF7',
    },
});

export default HeritageSwipeableRow;
