/**
 * ActiveRecordingView - Full-screen recording interface.
 * 
 * Reuses existing components:
 * - WaveformVisualizer for audio visualization
 * - HeritageButton for Stop action
 * - useHeritageTheme for consistent styling
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Svg, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    SharedValue,
    FadeIn,
    FadeInDown,
    ZoomIn,
    useReducedMotion
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Reuse existing components
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { WaveformVisualizer } from '@/features/recorder/components/WaveformVisualizer';
import { useHeritageTheme } from '@/theme/heritage';

interface ActiveRecordingViewProps {
    questionText?: string;
    onStop: () => void;
    amplitude?: SharedValue<number>;
    isPaused?: boolean;
}

// Helper to format MM:SS
const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const ActiveRecordingView = ({
    questionText,
    onStop,
    amplitude,
    isPaused = false
}: ActiveRecordingViewProps) => {
    const { colors, spacing, radius } = useHeritageTheme();
    const [duration, setDuration] = useState(0);
    const shouldReduceMotion = useReducedMotion();

    // Fallback amplitude if not provided
    const fallbackAmplitude = useSharedValue(0);
    const activeAmplitude = amplitude ?? fallbackAmplitude;

    // Timer logic
    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (!isPaused) {
                setDuration(Math.floor((Date.now() - start) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused]);

    // Breathing animation for rings (respect Reduce Motion)
    const breathe = useSharedValue(1);
    const pulse = useSharedValue(1);

    useEffect(() => {
        // Skip animations if user prefers reduced motion
        if (shouldReduceMotion) {
            breathe.value = 1;
            pulse.value = 1;
            return;
        }

        breathe.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        pulse.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            true
        );
    }, [breathe, pulse, shouldReduceMotion]);

    const animatedRingStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breathe.value }],
        opacity: 0.9,
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: pulse.value,
    }));

    return (
        <View style={styles.container}>
            {/* Background: Radial Gradient via SVG */}
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <RadialGradient
                        id="grad"
                        cx="50%"
                        cy="30%"
                        rx="80%"
                        ry="50%"
                        fx="50%"
                        fy="30%"
                        gradientUnits="userSpaceOnUse"
                    >
                        <Stop offset="0" stopColor={colors.surface} stopOpacity="1" />
                        <Stop offset="0.4" stopColor={colors.surfaceDim} stopOpacity="1" />
                        <Stop offset="1" stopColor={colors.surfaceDim} stopOpacity="1" />
                    </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
            </Svg>

            <SafeAreaView style={styles.safeArea}>
                {/* 1. Header: Status & Timer */}
                <View style={styles.header}>
                    <Animated.Text
                        entering={FadeInDown.duration(600)}
                        style={[styles.statusText, { color: colors.primary }, animatedTextStyle]}
                    >
                        I am listening...
                    </Animated.Text>

                    <Animated.View
                        entering={FadeInDown.delay(200).duration(600)}
                        style={[styles.timerPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <Ionicons name="timer-outline" size={20} color={colors.primary} />
                        <Text style={[styles.timerText, { color: colors.onSurface }]}>{formatTime(duration)}</Text>
                    </Animated.View>
                </View>

                {/* 2. Context & Visualizer */}
                <View style={styles.centerContent}>
                    {/* Question */}
                    <Animated.View
                        entering={FadeIn.delay(400).duration(800)}
                        style={styles.questionContainer}
                    >
                        <Text style={[styles.chapterLabel, { color: colors.textMuted }]}>YOUR STORY</Text>
                        <Text style={[styles.questionText, { color: colors.onSurface }]}>
                            {questionText || "What is your story today?"}
                        </Text>
                    </Animated.View>

                    {/* Breathing Animation Background */}
                    <Animated.View
                        entering={ZoomIn.delay(600).duration(800)}
                        style={styles.visualizerWrapper}
                    >
                        <Animated.View style={[styles.ring, styles.ringOuter, { borderColor: `${colors.primary}10`, backgroundColor: `${colors.primary}05` }, animatedRingStyle]} />
                        <Animated.View style={[styles.ring, styles.ringInner, { borderColor: `${colors.primary}15` }, animatedRingStyle]} />

                        {/* REUSE: WaveformVisualizer Component */}
                        <View style={styles.waveformContainer}>
                            <WaveformVisualizer
                                amplitude={activeAmplitude}
                                isRecording={true}
                                isPaused={isPaused}
                                color={colors.primary}
                            />
                        </View>
                    </Animated.View>
                </View>

                {/* 3. Footer: Stop Button using HeritageButton */}
                <Animated.View
                    entering={FadeInDown.delay(800).duration(600)}
                    style={styles.footer}
                >
                    <HeritageButton
                        title="STOP RECORDING"
                        onPress={onStop}
                        variant="primary"
                        size="large"
                        icon="stop-circle"
                        fullWidth
                        style={styles.stopButton}
                    />
                    <Text style={[styles.helperText, { color: colors.textMuted }]}>Tap to save story</Text>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        paddingTop: 20,
        gap: 24,
    },
    statusText: {
        fontFamily: 'Fraunces_600SemiBold',
        fontSize: 30,
        fontStyle: 'italic',
        letterSpacing: -0.5,
    },
    timerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
    },
    timerText: {
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        fontSize: 24,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        letterSpacing: 2,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 32,
    },
    questionContainer: {
        alignItems: 'center',
        marginBottom: 40,
        zIndex: 10,
    },
    chapterLabel: {
        fontSize: 13, // Increased from 12pt for Mobile UX readability
        fontWeight: '700',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    questionText: {
        fontFamily: 'Fraunces_600SemiBold',
        fontSize: 28,
        textAlign: 'center',
        lineHeight: 36,
    },
    visualizerWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: 320,
        height: 320,
    },
    ring: {
        position: 'absolute',
        borderRadius: 9999,
        borderWidth: 1,
    },
    ringOuter: {
        width: 320,
        height: 320,
    },
    ringInner: {
        width: 240,
        height: 240,
    },
    waveformContainer: {
        width: 200,
        height: 128,
    },
    footer: {
        width: '100%',
        paddingHorizontal: 24,
        alignItems: 'center',
        paddingBottom: 24,
    },
    stopButton: {
        maxWidth: 340,
        height: 72,
    },
    helperText: {
        marginTop: 16,
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.5,
    }
});
