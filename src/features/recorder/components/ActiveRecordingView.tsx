/**
 * ActiveRecordingView - Full-screen recording interface (Classic Mode).
 *
 * Layout: 3-section vertical flex (Header, Content, Footer)
 * Standardized for NativeWind v4, SF Symbols, and Header consistency.
 */

import { AppText } from '@/components/ui/AppText';
import { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Animated } from '@/tw/animated';
import { SharedValue, FadeIn, useSharedValue } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NetworkQuality } from '@/features/recorder/services/NetworkQualityService';

import { BreathingGlow } from '@/components/ui/heritage/BreathingGlow';
import { useHeritageTheme } from '@/theme/heritage';
import { useActiveRecordingLogic } from '@/features/recorder/hooks/useActiveRecordingLogic';
import { ConnectivityBadge } from './ConnectivityBadge';
import { WaveformVisualizer } from './WaveformVisualizer';
import { RecordingModeSwitcher } from './RecordingModeSwitcher';
import { RecordingControls } from './RecordingControls';
import { Container } from '@/components/ui/Container';

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
    <Container className="flex-1 bg-surface">
      <View className="flex-1 px-4">
        {/* 1. Unified Header (Status & Mode) */}
        <View className="flex-row items-center justify-between pt-2 h-12">
          <View className="flex-1 items-start">
            <View
              className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}>
              <Icon name="timer" size={14} color={isDark ? colors.textMuted : colors.textFaint} />
              <AppText
                className="text-sm font-semibold text-onSurface"
                style={{
                  fontVariant: ['tabular-nums'],
                  letterSpacing: 0.5,
                }}>
                {formatTime(displayedDuration)}
              </AppText>
            </View>
          </View>

          <View className="flex-[2] items-center">
            <RecordingModeSwitcher
              mode="basic"
              disabled={controlsDisabled}
              onSwitch={(mode) => {
                if (mode === 'ai') onSwitchToAi();
              }}
            />
          </View>

          <View className="flex-1 items-end">
            <ConnectivityBadge
              quality={qualityFromOnline(isOnline)}
              mode={isOnline ? 'DIALOG' : 'SILENT'}
              minimal
            />
          </View>
        </View>

        {/* 2. Content: Typography First */}
        <View className="flex-1 items-center justify-center row-gap-10 px-2">
          <Animated.View
            entering={FadeIn.delay(300).duration(800)}
            className="items-center row-gap-3"
            style={{ maxWidth: Math.min(width - 40, 380) }}>
            <AppText className="text-[11px] font-bold tracking-[2px] uppercase text-center opacity-90" style={{ color: colors.tertiary }}>
              TODAY'S TOPIC
            </AppText>

            <AppText
              className="text-[30px] font-serif leading-[38px] text-center tracking-tighter text-onSurface">
              {questionText || 'What is your story today?'}
            </AppText>
          </Animated.View>

          {/* 3. Visualizer: The "Breathing" Core */}
          <Animated.View entering={FadeIn.delay(500).duration(600)} className="items-center justify-center shrink-0">
            <View
              className="items-center justify-center overflow-hidden"
              style={{ width: orbSize, height: orbSize, borderRadius: orbSize / 2 }}>
              <View className="absolute inset-0 items-center justify-center">
                <BreathingGlow color={colors.primary} size={glowSize} profile="recording" />
              </View>

              <View
                className="absolute"
                style={{
                  width: innerCircleSize,
                  height: innerCircleSize,
                  borderRadius: innerCircleSize / 2,
                  backgroundColor: `${colors.primarySoft}60`,
                }}
              />

              {showVisualizer && (
                <View className="z-10" style={{ width: waveformWidth, height: waveformHeight }}>
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
        <View className="items-center justify-end pt-1" style={{ paddingBottom: bottomPadding }}>
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
            className="mt-4 text-[13px] font-medium opacity-60 tracking-[0.4px] text-center" style={{ color: colors.textMuted }}>
            Press and hold to end session
          </AppText>
        </View>
      </View>
    </Container>
  );
}

export default ActiveRecordingView;
