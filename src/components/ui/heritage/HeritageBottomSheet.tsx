/**
 * HeritageBottomSheet - Apple Maps style bottom sheet.
 *
 * Features:
 * - Gesture-driven with snap points
 * - Handle indicator with drag feedback
 * - Keyboard avoiding
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageBottomSheet
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   snapPoints={['25%', '50%', '90%']}
 * >
 *   <Text>Content</Text>
 * </HeritageBottomSheet>
 */

import { useEffect, useCallback, ReactNode, useRef } from 'react';
import {
    View,
    Modal,
    Pressable,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SnapPoint = `${number}%` | number;

type HeritageBottomSheetProps = {
    /** Whether sheet is visible */
    visible: boolean;
    /** Called when sheet should close */
    onClose: () => void;
    /** Sheet content */
    children: ReactNode;
    /** Snap points as percentages or pixels */
    snapPoints?: SnapPoint[];
    /** Initial snap point index */
    initialSnapIndex?: number;
    /** Enable backdrop tap to close */
    enableBackdropDismiss?: boolean;
    /** Title for accessibility */
    title?: string;
};

const parseSnapPoint = (point: SnapPoint): number => {
    if (typeof point === 'number') return point;
    const percentage = parseInt(point.replace('%', ''), 10);
    return (percentage / 100) * SCREEN_HEIGHT;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeritageBottomSheet({
    visible,
    onClose,
    children,
    snapPoints = ['50%'],
    initialSnapIndex = 0,
    enableBackdropDismiss = true,
    title = 'Bottom sheet',
}: HeritageBottomSheetProps) {
    const theme = useHeritageTheme();
    const { colors, animation } = theme;

    const parsedSnapPoints = snapPoints.map(parseSnapPoint).sort((a, b) => a - b);
    const maxHeight = parsedSnapPoints[parsedSnapPoints.length - 1];
    const minHeight = parsedSnapPoints[0];

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const isHandleDragging = useSharedValue(false);
    const startY = useRef(0);

    // Haptic feedback
    const triggerHaptic = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // Find nearest snap point
    const findNearestSnapPoint = useCallback(
        (y: number): number => {
            const currentHeight = SCREEN_HEIGHT - y;
            let nearestIndex = 0;
            let minDistance = Math.abs(parsedSnapPoints[0] - currentHeight);

            parsedSnapPoints.forEach((point, index) => {
                const distance = Math.abs(point - currentHeight);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });

            return nearestIndex;
        },
        [parsedSnapPoints]
    );

    // Animate to snap point
    const snapTo = useCallback(
        (index: number) => {
            'worklet';
            const targetHeight = parsedSnapPoints[index] || parsedSnapPoints[0];
            const targetY = SCREEN_HEIGHT - targetHeight;
            translateY.value = withSpring(targetY, animation.modal);
        },
        [parsedSnapPoints, translateY, animation.modal]
    );

    // Open/close animation
    useEffect(() => {
        if (visible) {
            backdropOpacity.value = withTiming(1, { duration: 200 });
            const initialHeight = parsedSnapPoints[initialSnapIndex] || parsedSnapPoints[0];
            translateY.value = withSpring(SCREEN_HEIGHT - initialHeight, animation.modal);
        } else {
            backdropOpacity.value = withTiming(0, { duration: 150 });
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        }
    }, [visible, backdropOpacity, translateY, parsedSnapPoints, initialSnapIndex, animation.modal]);

    // Pan gesture using new Gesture API
    const panGesture = Gesture.Pan()
        .onStart(() => {
            startY.current = translateY.value;
            isHandleDragging.value = true;
        })
        .onUpdate((event) => {
            const newY = startY.current + event.translationY;
            // Clamp to valid range
            const minY = SCREEN_HEIGHT - maxHeight;
            const maxY = SCREEN_HEIGHT - minHeight;
            translateY.value = Math.max(minY, Math.min(maxY + 50, newY));
        })
        .onEnd((event) => {
            isHandleDragging.value = false;

            // If dragged down past threshold, close
            if (event.velocityY > 500 || translateY.value > SCREEN_HEIGHT - minHeight + 50) {
                runOnJS(onClose)();
                runOnJS(triggerHaptic)();
                return;
            }

            // Find nearest snap point
            const velocity = event.velocityY;
            const nearestIndex = findNearestSnapPoint(translateY.value + velocity * 0.1);
            snapTo(nearestIndex);
            runOnJS(triggerHaptic)();
        });

    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
        backgroundColor: colors.backdrop,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        backgroundColor: colors.surface,
        // Terracotta shadow
        shadowColor: colors.shadow,
    }));

    const handleStyle = useAnimatedStyle(() => ({
        backgroundColor: isHandleDragging.value ? colors.handleActive : colors.handle,
        transform: [{ scaleX: isHandleDragging.value ? 1.2 : 1 }],
    }));

    const handleBackdropPress = () => {
        if (enableBackdropDismiss) {
            onClose();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Backdrop */}
                <AnimatedPressable style={[styles.backdrop, backdropStyle]} onPress={handleBackdropPress} />

                {/* Sheet */}
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[styles.sheet, { height: maxHeight + 50 }, sheetStyle]}
                        accessibilityLabel={title}
                        accessibilityRole="none"
                    >
                        {/* Handle */}
                        <View style={styles.handleContainer}>
                            <Animated.View style={[styles.handle, handleStyle]} />
                        </View>

                        {/* Content */}
                        <View style={styles.content}>{children}</View>
                    </Animated.View>
                </GestureDetector>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 24,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
});

export default HeritageBottomSheet;
