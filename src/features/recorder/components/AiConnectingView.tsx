import { AppText } from '@/components/ui/AppText';
import { BreathingGlow } from '@/components/ui/heritage/BreathingGlow';
import type { NetworkQuality } from '@/features/recorder/services/NetworkQualityService';
import { useHeritageTheme } from '@/theme/heritage';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Animated } from '@/tw/animated';
import { Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming, } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectivityBadge } from './ConnectivityBadge';
import { RecordingModeSwitcher } from './RecordingModeSwitcher';

interface AiConnectingViewProps {
  questionText?: string;
  isOnline?: boolean;
  dialogMode?: 'DIALOG' | 'DEGRADED' | 'SILENT';
  onSwitchToClassic?: () => void;
}

function qualityFromOnline(isOnline: boolean): NetworkQuality {
  return isOnline ? 'GOOD' : 'OFFLINE';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function AiConnectingView({
  questionText,
  isOnline = true,
  dialogMode = 'DIALOG',
  onSwitchToClassic,
}: AiConnectingViewProps): JSX.Element {
  const { colors, isDark } = useHeritageTheme();
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulse = useSharedValue(1);

  const orbSize = clamp(Math.min(width * 0.54, height * 0.22), 170, 206);
  const innerCircleSize = Math.round(orbSize * 0.52);
  const glowSize = Math.round(orbSize * 0.72);

  useEffect(() => {
    let mounted = true;
    const resolveReduceMotion = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (mounted) setReduceMotion(enabled);
      } catch {
        if (mounted) setReduceMotion(false);
      }
    };
    void resolveReduceMotion();
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.quad) }), // Slower, deeper breath
      -1,
      true
    );
  }, [reduceMotion, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const statusText = !isOnline
    ? 'Recording locally (Offline)'
    : dialogMode === 'DEGRADED'
      ? 'Connecting (Network weak)...'
      : 'Connecting to AI Assistant...';

  const prompt = questionText ?? 'Tell me about this memory.';

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.screen}>

          {/* 1. Unified Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft} />

            <View style={styles.headerCenter}>
              <RecordingModeSwitcher
                mode="ai"
                onSwitch={(mode) => {
                  if (mode === 'basic' && onSwitchToClassic) {
                    onSwitchToClassic();
                  }
                }}
              />
            </View>

            <View style={styles.headerRight}>
              <ConnectivityBadge
                quality={qualityFromOnline(isOnline)}
                mode={dialogMode}
                minimal
              />
            </View>
          </View>

          {/* 2. Content */}
          <View style={styles.content}>
            <Animated.View
              entering={FadeIn.duration(600)}
              style={[styles.textWrap, { maxWidth: Math.min(width - 40, 380) }]}>

              <AppText style={[styles.dateLabel, { color: colors.tertiary }]}>
                {isOnline ? 'PREPARING SESSION' : 'OFFLINE SESSION'}
              </AppText>

              <AppText
                style={[
                  styles.promptText,
                  {
                    color: colors.onSurface,
                    fontFamily: 'Fraunces_600SemiBold',
                  },
                ]}>
                {prompt}
              </AppText>
            </Animated.View>

            {/* 3. Visualizer: Pulse Only */}
            <View style={styles.orbWrap}>
              <Animated.View
                style={[
                  styles.orbContainer,
                  pulseStyle,
                  {
                    width: orbSize,
                    height: orbSize,
                    borderRadius: orbSize / 2,
                    // No border
                  },
                ]}>
                <View style={styles.orbBackground}>
                  <BreathingGlow color={colors.warning} size={glowSize} profile="recording" />
                </View>
                <View
                  style={[
                    styles.innerCircle,
                    {
                      width: innerCircleSize,
                      height: innerCircleSize,
                      borderRadius: innerCircleSize / 2,
                      backgroundColor: isDark ? `${colors.warning}45` : `${colors.warning}30`,
                    },
                  ]}
                />
              </Animated.View>

              <Animated.View entering={FadeIn.delay(300)}>
                <AppText style={[styles.statusText, { color: colors.textMuted }]}>
                  {statusText}
                </AppText>
              </Animated.View>
            </View>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

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
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    rowGap: 48,
    paddingHorizontal: 8,
  },
  textWrap: {
    width: '100%',
    alignItems: 'center',
    rowGap: 16,
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
  promptText: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 32,
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
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  }
});

