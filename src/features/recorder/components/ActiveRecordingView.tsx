/**
 * ActiveRecordingView - Full-screen recording interface.
 *
 * Layout: 3-section vertical flex (Header, Content, Footer)
 * Based on Heritage Hybrid HTML mockup for proper spacing.
 */

import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet, Platform } from 'react-native';
import { Svg, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  FadeIn,
  FadeInDown,
  ZoomIn,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { LazyWaveformVisualizer } from '@/lib/lazyComponents';
import { useHeritageTheme } from '@/theme/heritage';
import { useActiveRecordingLogic } from '@/features/recorder/hooks/useActiveRecordingLogic';

interface ActiveRecordingViewProps {
  questionText?: string;
  onStop: () => void;
  amplitude?: SharedValue<number>;
  isPaused?: boolean;
}

// Helper to format MM:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function ActiveRecordingView({
  questionText,
  onStop,
  amplitude,
  isPaused = false,
}: ActiveRecordingViewProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const { duration, breathe, pulse } = useActiveRecordingLogic(isPaused);

  // Fallback amplitude if not provided
  const fallbackAmplitude = useSharedValue(0);
  const activeAmplitude = amplitude ?? fallbackAmplitude;

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
    opacity: 0.9,
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
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.surface} stopOpacity="1" />
            <Stop offset="0.4" stopColor={colors.surfaceDim} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.surfaceDim} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        {/* === SECTION 1: HEADER === */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          {/* "I am listening..." Status */}
          <Animated.View style={animatedTextStyle}>
            <AppText style={[styles.statusText, { color: colors.primary }]}>
              I am listening...
            </AppText>
          </Animated.View>

          {/* Timer Pill */}
          <View
            style={[
              styles.timerPill,
              {
                backgroundColor: `${colors.surface}99`,
                borderColor: `${colors.border}60`,
              },
            ]}>
            <Ionicons name="timer-outline" size={20} color={colors.primary} />
            <AppText style={[styles.timerText, { color: colors.onSurface }]}>
              {formatTime(duration)}
            </AppText>
          </View>
        </Animated.View>

        {/* === SECTION 2: CONTENT (Question + Visualizer) === */}
        <View style={styles.contentSection}>
          {/* Question Card - Positioned ABOVE visualizer */}
          <Animated.View
            entering={FadeIn.delay(400).duration(800)}
            style={styles.questionContainer}>
            <AppText style={[styles.chapterLabel, { color: colors.textMuted }]}>YOUR STORY</AppText>
            <AppText style={[styles.questionText, { color: colors.onSurface }]}>
              {questionText || 'What is your story today?'}
            </AppText>
          </Animated.View>

          {/* Visualizer Area - Below the question */}
          <Animated.View entering={ZoomIn.delay(600).duration(800)} style={styles.visualizerArea}>
            {/* Breathing Rings (Background) */}
            <View style={styles.ringsContainer}>
              <Animated.View
                style={[
                  styles.ring,
                  styles.ringOuter,
                  {
                    borderColor: `${colors.primary}20`,
                    backgroundColor: `${colors.primary}10`,
                  },
                  animatedRingStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.ring,
                  styles.ringMiddle,
                  {
                    borderColor: `${colors.primary}30`,
                    backgroundColor: `${colors.primary}08`,
                  },
                  animatedRingStyle,
                ]}
              />
              <View style={[styles.coreGlow, { backgroundColor: `${colors.primary}25` }]} />
            </View>

            {/* Waveform Bars (Foreground) */}
            <View style={styles.waveformContainer}>
              <LazyWaveformVisualizer
                amplitude={activeAmplitude}
                isRecording={true}
                isPaused={isPaused}
                color={colors.primary}
              />
            </View>
          </Animated.View>
        </View>

        {/* === SECTION 3: FOOTER === */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.footer}>
          <HeritageButton
            title="STOP RECORDING"
            onPress={onStop}
            variant="primary"
            size="large"
            icon="stop-circle"
            fullWidth
            style={styles.stopButton}
            textStyle={styles.stopButtonText}
          />
          <AppText style={[styles.helperText, { color: colors.textMuted }]}>
            Tap to save story
          </AppText>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between', // Key: Spread sections vertically
  },

  // === HEADER ===
  header: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 20,
  },
  statusText: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  timerText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },

  // === CONTENT SECTION ===
  contentSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly', // Changed from flex-start to space-evenly for better distribution
    paddingHorizontal: 24,
    paddingBottom: 20, // Add bottom padding to avoid touching footer
  },
  questionContainer: {
    alignItems: 'center',
    maxWidth: 320,
    zIndex: 20,
  },
  chapterLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  questionText: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 34,
  },

  // === VISUALIZER ===
  visualizerArea: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    height: 280,
  },
  ringsContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  ringOuter: {
    width: 280,
    height: 280,
  },
  ringMiddle: {
    width: 200,
    height: 200,
  },
  coreGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    // blur effect simulated via opacity
  },
  waveformContainer: {
    width: 200,
    height: 128,
    zIndex: 10, // Above rings
  },

  // === FOOTER ===
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  stopButton: {
    maxWidth: 340,
    height: 80,
    borderRadius: 40,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  helperText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default ActiveRecordingView;
