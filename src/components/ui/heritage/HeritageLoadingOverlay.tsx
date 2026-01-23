/**
 * HeritageLoadingOverlay - Full-screen loading overlay.
 *
 * Features:
 * - Spinner animation
 * - Optional message text
 * - Backdrop blur
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageLoadingOverlay
 *   visible={isLoading}
 *   message="Saving your story..."
 * />
 */

import { View, Text, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

// Heritage Memoir Design Tokens
const TOKENS = {
    primary: '#B85A3B',
    surface: '#FFFCF7',
    backdrop: 'rgba(30, 41, 59, 0.5)',
    onSurface: '#1E293B',
    textMuted: '#475569',
} as const;

type HeritageLoadingOverlayProps = {
    /** Whether overlay is visible */
    visible: boolean;
    /** Loading message */
    message?: string;
    /** Show progress indicator */
    showProgress?: boolean;
    /** Progress value (0-1) */
    progress?: number;
};

export function HeritageLoadingOverlay({
    visible,
    message,
    showProgress = false,
    progress = 0,
}: HeritageLoadingOverlayProps) {
    const rotation = useSharedValue(0);
    const backdropOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            backdropOpacity.value = withTiming(1, { duration: 200 });
            rotation.value = withRepeat(
                withTiming(360, { duration: 1000, easing: Easing.linear }),
                -1,
                false
            );
        } else {
            backdropOpacity.value = withTiming(0, { duration: 150 });
        }
    }, [visible, backdropOpacity, rotation]);

    const spinnerStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <View style={styles.container}>
                    {/* Custom spinner */}
                    <View style={styles.spinnerContainer}>
                        <Animated.View style={spinnerStyle}>
                            <Ionicons name="book" size={40} color={TOKENS.primary} />
                        </Animated.View>
                        <ActivityIndicator
                            size="large"
                            color={TOKENS.primary}
                            style={styles.indicator}
                        />
                    </View>

                    {/* Message */}
                    {message && <Text style={styles.message}>{message}</Text>}

                    {/* Progress */}
                    {showProgress && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${Math.round(progress * 100)}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {Math.round(progress * 100)}%
                            </Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: TOKENS.backdrop,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: TOKENS.surface,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        minWidth: 200,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    spinnerContainer: {
        position: 'relative',
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    indicator: {
        position: 'absolute',
    },
    message: {
        fontSize: 16,
        color: TOKENS.onSurface,
        textAlign: 'center',
        marginTop: 8,
    },
    progressContainer: {
        marginTop: 16,
        width: '100%',
        alignItems: 'center',
    },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: '#E8E0D5',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: TOKENS.primary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: 14,
        color: TOKENS.textMuted,
        marginTop: 8,
    },
});

export default HeritageLoadingOverlay;
