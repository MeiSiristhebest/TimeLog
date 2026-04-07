/**
 * ActiveRecordingView - Full-screen recording interface (Classic Mode).
 *
 * Layout: 3-section vertical flex (Header, Content, Footer)
 * Redesigned for better spacing, stacking, and consistent controls.
 */

import { AppText } from '@/components/ui/AppText';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Animated } from '@/tw/animated';
import { SharedValue,
  FadeIn,
  useSharedValue, } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NetworkQuality } from '@/features/recorder/services/NetworkQualityService';

import { BreathingGlow } from '@/components/ui/heritage/BreathingGlow';
import { useHeritageTheme } from '@/theme/heritage';
import { useActiveRecordingLogic } from '@/features/recorder/hooks/useActiveRecordingLogic';
import { ConnectivityBadge } from './ConnectivityBadge';
import { WaveformVisualizer } from './WaveformVisualizer';
import { RecordingModeSwitcher } from './RecordingModeSwitcher';
import { RecordingControls } from './RecordingControls';

interface ActiveRecordingViewProps {
  questionText?: string;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onSwitchToAi: () => void;
  amplitude?: SharedValue<number>;
  recordingDurationSec?: number;
  isPaused?: boolean;
  isOnline?: boolean;
  canSwitchToAi?: boolean;
  controlsDisabled?: boolean;
}

// Helper to format MM:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function qualityFromOnline(isOnline: boolean): NetworkQuality {
  return isOnline ? 'GOOD' : 'OFFLINE';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function ActiveRecordingView({
  questionText,
  onStop,
  onPause,
  onResume,
  onSwitchToAi,
  amplitude,
  recordingDurationSec,
  isPaused = false,
  isOnline = true,
  canSwitchToAi = true,
  controlsDisabled = false,
}: ActiveRecordingViewProps): JSX.Element {
  const { colors, isDark } = useHeritageTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { duration } = useActiveRecordingLogic(isPaused);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Fallback amplitude if not provided
  const fallbackAmplitude = useSharedValue(0);
  const activeAmplitude = amplitude ?? fallbackAmplitude;
  const orbSize = clamp(Math.min(width * 0.54, height * 0.22), 170, 206);
  const innerCircleSize = Math.round(orbSize * 0.52);
  const glowSize = Math.round(orbSize * 0.72);
  const waveformWidth = Math.round(orbSize * 0.72);
  const waveformHeight = Math.round(orbSize * 0.3);
  const bottomPadding = Math.max(insets.bottom + 8, 18);

  const displayedDuration = recordingDurationSec ?? duration;

  useEffect(() => {
    // Give breathing circle one frame to stabilize before mounting Skia waveform.
    const timer = setTimeout(() => setShowVisualizer(true), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.screen}>

          {/* 1. Unified Header (Status & Mode) */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.timerPill,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }
                ]}
              >
                <Ionicons name="timer-outline" size={14} color={isDark ? colors.textMuted : colors.textFaint} />
                <AppText
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.onSurface,
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                    fontVariant: ['tabular-nums'],
                    letterSpacing: 0.5,
                  }}>
                  {formatTime(displayedDuration)}
                </AppText>
              </View>
            </View>

            <View style={styles.headerCenter}>
              <RecordingModeSwitcher
                mode="basic"
                disabled={controlsDisabled}
                onSwitch={(mode) => {
                  if (mode === 'ai') onSwitchToAi();
                }}
              />
            </View>

            <View style={styles.headerRight}>
              <ConnectivityBadge
                quality={qualityFromOnline(isOnline)}
                mode={isOnline ? 'DIALOG' : 'SILENT'}
                minimal // Pass minimal prop to ConnectivityBadge if supported, or rely on its small usage
              />
            </View>
          </View>

          {/* 2. Content: Typography First (No Cards) */}
          <View style={styles.content}>
            <Animated.View
              entering={FadeIn.delay(300).duration(800)}
              style={[styles.questionWrap, { maxWidth: Math.min(width - 40, 380) }]}>

              <AppText style={[styles.dateLabel, { color: colors.tertiary }]}>
                TODAY&apos;S TOPIC
              </AppText>

              <AppText
                style={[
                  styles.questionText,
                  { fontFamily: 'Fraunces_600SemiBold', color: colors.onSurface },
                ]}>
                {questionText || 'What is your story today?'}
              </AppText>
            </Animated.View>

            {/* 3. Visualizer: The "Breathing" Core */}
            <Animated.View entering={FadeIn.delay(500).duration(600)} style={styles.orbWrap}>
              <View
                style={[
                  styles.orbContainer,
                  { width: orbSize, height: orbSize, borderRadius: orbSize / 2 },
                  // Remove border, let it blend
                ]}>
                <View style={styles.orbBackground}>
                  <BreathingGlow color={colors.primary} size={glowSize} profile="recording" />
                </View>

                <View
                  style={[
                    styles.innerCircle,
                    {
                      width: innerCircleSize,
                      height: innerCircleSize,
                      borderRadius: innerCircleSize / 2,
                      backgroundColor: `${colors.primarySoft}60`, // More subtle
                      // Removed borderColor
                    },
                  ]}
                />

                {showVisualizer && (
                  <View style={{ zIndex: 10, width: waveformWidth, height: waveformHeight }}>
                    <WaveformVisualizer
                      amplitude={activeAmplitude}
                      isRecording={true}
                      isPaused={isPaused}
                      color={colors.primary}
                    />
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          {/* 4. Footer: Clean Controls */}
          <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
            <RecordingControls
              isRecording={true}
              isPaused={isPaused}
              onStart={() => { }}
              onStop={onStop}
              onPause={onPause}
              onResume={onResume}
              disabled={controlsDisabled}
            />
            <AppText
              style={[styles.finishText, { color: colors.textMuted }]}>
              Press and hold to end session
            </AppText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default ActiveRecordingView;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    height: 48,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    borderRadius: 999,
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    rowGap: 40, // More breathing room between text and orb
    paddingHorizontal: 8,
  },
  questionWrap: {
    width: '100%',
    alignItems: 'center',
    rowGap: 12,
  },
  dateLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    opacity: 0.9,
  },
  questionText: {
    fontSize: 30, // Larger, more magazine-like
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbBackground: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    position: 'absolute',
    // No border
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  finishText: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    opacity: 0.6,
    letterSpacing: 0.4,
  },
});
