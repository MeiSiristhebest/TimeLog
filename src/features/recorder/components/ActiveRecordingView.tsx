/**
 * ActiveRecordingView - Full-screen recording interface.
 *
 * Layout: 3-section vertical flex (Header, Content, Footer)
 * Based on Heritage Hybrid HTML mockup for proper spacing.
 */

import { AppText } from '@/components/ui/AppText';
import { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import Animated, {
  SharedValue,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { BreathingGlow } from '@/components/ui/heritage/BreathingGlow';
import { useHeritageTheme } from '@/theme/heritage';
import { useActiveRecordingLogic } from '@/features/recorder/hooks/useActiveRecordingLogic';
import { WaveformVisualizer } from './WaveformVisualizer';

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
  const { duration, pulse } = useActiveRecordingLogic(isPaused);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Fallback amplitude if not provided
  const fallbackAmplitude = useSharedValue(0);
  const activeAmplitude = amplitude ?? fallbackAmplitude;

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  useEffect(() => {
    // Give breathing circle one frame to stabilize before mounting Skia waveform.
    const timer = setTimeout(() => setShowVisualizer(true), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 w-full h-full" style={{ backgroundColor: colors.surface }}>

      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 justify-between">
        {/* === SECTION 1: HEADER === */}
        <Animated.View entering={FadeInDown.duration(600)} className="items-center pt-4 gap-5">
          {/* "I am listening..." Status */}
          <Animated.View style={animatedTextStyle}>
            <AppText className="text-[28px] italic tracking-tight" style={{ fontFamily: 'Fraunces_600SemiBold', color: colors.primary }}>
              I am listening...
            </AppText>
          </Animated.View>

          {/* Timer Pill */}
          <View
            className="flex-row items-center gap-2.5 px-5 py-2.5 rounded-full border"
            style={{
              backgroundColor: `${colors.surface}99`,
              borderColor: `${colors.border}60`,
            }}>
            <Ionicons name="timer-outline" size={20} color={colors.primary} />
            <AppText
              className="text-[22px] font-bold tracking-[2px]"
              style={{
                color: colors.onSurface,
                fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                fontVariant: ['tabular-nums'],
              }}>
              {formatTime(duration)}
            </AppText>
          </View>
        </Animated.View>

        {/* === SECTION 2: CONTENT (Question + Visualizer) === */}
        <View className="flex-1 items-center justify-evenly px-6 pb-5">
          {/* Question Card - Positioned ABOVE visualizer */}
          <Animated.View
            entering={FadeIn.delay(400).duration(800)}
            className="items-center max-w-[320px] z-20">
            <View
              className="w-full rounded-[24px] border px-6 py-5"
              style={{
                backgroundColor: colors.surfaceWarm,
                borderColor: colors.border,
              }}>
              <AppText className="text-xs font-bold tracking-[3px] uppercase mb-2.5 text-center" style={{ color: colors.textMuted }}>
                YOUR STORY
              </AppText>
              <AppText
                className="text-[26px] text-center leading-[34px]"
                style={{ fontFamily: 'Fraunces_600SemiBold', color: colors.onSurface }}>
                {questionText || 'What is your story today?'}
              </AppText>
            </View>
          </Animated.View>

          {/* Visualizer Area - Below the question */}
          <Animated.View entering={FadeIn.delay(520).duration(420)} className="relative items-center justify-center w-[228px] h-[228px]">
            {/* Breathing Area */}
            <View className="absolute inset-0 items-center justify-center">
              <View
                style={{
                  width: 228,
                  height: 228,
                  borderRadius: 114,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible',
                }}>
                <BreathingGlow color={colors.primary} size={212} profile="recording" />
              </View>
              <View
                style={{
                  position: 'absolute',
                  width: 118,
                  height: 118,
                  borderRadius: 59,
                  backgroundColor: `${colors.primarySoft}CC`,
                  borderWidth: 1,
                  borderColor: `${colors.primaryMuted}80`,
                }}
              />
            </View>

            {/* Waveform Bars (Foreground) */}
            {showVisualizer ? (
              <View className="w-[176px] h-28 z-10">
                <WaveformVisualizer
                  amplitude={activeAmplitude}
                  isRecording={true}
                  isPaused={isPaused}
                  color={colors.primary}
                />
              </View>
            ) : null}
          </Animated.View>
        </View>

        {/* === SECTION 3: FOOTER === */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)} className="items-center px-6 pb-6">
          <HeritageButton
            title="STOP RECORDING"
            onPress={onStop}
            variant="primary"
            size="large"
            icon="stop-circle"
            fullWidth
            style={{ maxWidth: 340, height: 80, borderRadius: 40 }}
            textStyle={{ fontSize: 18, fontWeight: '700', letterSpacing: 1.5 }}
          />
          <AppText
            className="mt-4 text-sm font-medium tracking-wide"
            style={{ color: colors.textMuted, textAlign: 'center', width: '100%' }}>
            Tap to save story
          </AppText>
        </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default ActiveRecordingView;
