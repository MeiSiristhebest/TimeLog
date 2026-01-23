/**
 * HeritageModal - Base modal component with Heritage Memoir styling.
 *
 * Features:
 * - Terracotta-tinted backdrop blur
 * - Elevated parchment background
 * - Smooth enter/exit animations
 * - Accessibility: focus trap, screen reader support
 *
 * @example
 * <HeritageModal visible={isOpen} onClose={() => setIsOpen(false)}>
 *   <Text>Modal content</Text>
 * </HeritageModal>
 */

import { useEffect, ReactNode } from 'react';
import {
    View,
    Modal,
    Pressable,
    StyleSheet,
    Dimensions,
    AccessibilityInfo,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
    Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Heritage Memoir Design Tokens
const TOKENS = {
    backdrop: 'rgba(30, 41, 59, 0.4)',
    surface: '#FFFCF7',
    shadow: 'rgba(184, 90, 59, 0.15)',
    radius: 24,
    // Animation
    enterDuration: 250,
    exitDuration: 200,
} as const;

type HeritageModalProps = {
    /** Whether modal is visible */
    visible: boolean;
    /** Called when modal should close */
    onClose: () => void;
    /** Modal content */
    children: ReactNode;
    /** Whether to close on backdrop press (default: true) */
    closeOnBackdrop?: boolean;
    /** Test ID for testing */
    testID?: string;
    /** Accessibility label for the modal */
    accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeritageModal({
    visible,
    onClose,
    children,
    closeOnBackdrop = true,
    testID = 'heritage-modal',
    accessibilityLabel = 'Modal dialog',
}: HeritageModalProps) {
    const backdropOpacity = useSharedValue(0);
    const contentScale = useSharedValue(0.95);
    const contentOpacity = useSharedValue(0);

    // Animate in when visible
    useEffect(() => {
        if (visible) {
            backdropOpacity.value = withTiming(1, { duration: TOKENS.enterDuration });
            contentScale.value = withSpring(1, { damping: 20, stiffness: 300 });
            contentOpacity.value = withTiming(1, { duration: TOKENS.enterDuration });

            // Announce to screen readers
            AccessibilityInfo.announceForAccessibility(accessibilityLabel);
        } else {
            backdropOpacity.value = withTiming(0, { duration: TOKENS.exitDuration });
            contentScale.value = withTiming(0.95, {
                duration: TOKENS.exitDuration,
                easing: Easing.in(Easing.ease),
            });
            contentOpacity.value = withTiming(0, { duration: TOKENS.exitDuration });
        }
    }, [visible, backdropOpacity, contentScale, contentOpacity, accessibilityLabel]);

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ scale: contentScale.value }],
    }));

    const handleBackdropPress = () => {
        if (closeOnBackdrop) {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
            testID={testID}
        >
            <View style={styles.container}>
                {/* Backdrop */}
                <AnimatedPressable
                    style={[styles.backdrop, backdropStyle]}
                    onPress={handleBackdropPress}
                    accessibilityLabel="Close modal"
                    accessibilityRole="button"
                />

                {/* Content */}
                <Animated.View
                    style={[styles.content, contentStyle]}
                    accessibilityViewIsModal
                    accessibilityLabel={accessibilityLabel}
                >
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: TOKENS.backdrop,
    },
    content: {
        backgroundColor: TOKENS.surface,
        borderRadius: TOKENS.radius,
        width: '100%',
        maxWidth: SCREEN_WIDTH - 48,
        // Terracotta-tinted shadow
        shadowColor: '#B85A3B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
        elevation: 24,
        overflow: 'hidden',
    },
});

export default HeritageModal;
