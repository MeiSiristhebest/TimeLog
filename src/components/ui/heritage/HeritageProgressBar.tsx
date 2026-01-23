/**
 * HeritageProgressBar - Animated progress indicator.
 *
 * Features:
 * - Animated fill
 * - Gradient option
 * - Label support
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageProgressBar progress={0.65} />
 * <HeritageProgressBar progress={0.8} showLabel label="80% complete" />
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Heritage Memoir Design Tokens
const TOKENS = {
    primary: '#B85A3B',
    primaryLight: '#C9A961',
    background: '#E8E0D5',
    onSurface: '#1E293B',
    textMuted: '#475569',
} as const;

type HeritageProgressBarProps = {
    /** Progress value (0-1) */
    progress: number;
    /** Show percentage label */
    showLabel?: boolean;
    /** Custom label text */
    label?: string;
    /** Height of the bar */
    height?: number;
    /** Use gradient fill */
    gradient?: boolean;
    /** Animate progress changes */
    animated?: boolean;
    /** Custom colors */
    colors?: {
        fill?: string;
        background?: string;
    };
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function HeritageProgressBar({
    progress,
    showLabel = false,
    label,
    height = 8,
    gradient = true,
    animated = true,
    colors,
}: HeritageProgressBarProps) {
    const progressValue = useSharedValue(0);
    const clampedProgress = Math.max(0, Math.min(1, progress));

    useEffect(() => {
        if (animated) {
            progressValue.value = withSpring(clampedProgress, {
                damping: 20,
                stiffness: 100,
            });
        } else {
            progressValue.value = clampedProgress;
        }
    }, [clampedProgress, animated, progressValue]);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${progressValue.value * 100}%`,
    }));

    const percentage = Math.round(clampedProgress * 100);

    return (
        <View style={styles.container}>
            {/* Progress bar */}
            <View
                style={[
                    styles.track,
                    { height },
                    colors?.background && { backgroundColor: colors.background },
                ]}
            >
                <Animated.View style={[styles.fill, { height }, fillStyle]}>
                    {gradient ? (
                        <LinearGradient
                            colors={[TOKENS.primary, TOKENS.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    ) : (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: colors?.fill || TOKENS.primary },
                            ]}
                        />
                    )}
                </Animated.View>
            </View>

            {/* Label */}
            {showLabel && (
                <Text style={styles.label}>
                    {label || `${percentage}%`}
                </Text>
            )}
        </View>
    );
}

// Circular variant
export function HeritageCircularProgress({
    progress,
    size = 64,
    strokeWidth = 6,
    showPercentage = true,
}: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    showPercentage?: boolean;
}) {
    const progressValue = useSharedValue(0);
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        progressValue.value = withSpring(clampedProgress, {
            damping: 20,
            stiffness: 100,
        });
    }, [clampedProgress, progressValue]);

    const percentage = Math.round(clampedProgress * 100);

    return (
        <View style={[styles.circularContainer, { width: size, height: size }]}>
            {/* Background circle */}
            <View
                style={[
                    styles.circularTrack,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: strokeWidth,
                    },
                ]}
            />

            {/* Progress arc - simplified with View */}
            <View
                style={[
                    styles.circularFill,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: strokeWidth,
                        borderColor: TOKENS.primary,
                        borderTopColor: 'transparent',
                        borderRightColor: 'transparent',
                        transform: [{ rotate: `${-90 + clampedProgress * 360}deg` }],
                    },
                ]}
            />

            {/* Percentage text */}
            {showPercentage && (
                <Text style={styles.circularText}>{percentage}%</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    track: {
        flex: 1,
        backgroundColor: TOKENS.background,
        borderRadius: 100,
        overflow: 'hidden',
    },
    fill: {
        borderRadius: 100,
        overflow: 'hidden',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.textMuted,
        minWidth: 40,
        textAlign: 'right',
    },
    circularContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circularTrack: {
        position: 'absolute',
        borderColor: TOKENS.background,
    },
    circularFill: {
        position: 'absolute',
    },
    circularText: {
        fontSize: 14,
        fontWeight: '700',
        color: TOKENS.onSurface,
    },
});

export default HeritageProgressBar;
