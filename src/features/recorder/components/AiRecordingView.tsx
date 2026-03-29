import { AppText } from '@/components/ui/AppText';
import { BreathingGlow } from '@/components/ui/heritage/BreathingGlow';
import { Icon } from '@/components/ui/Icon';
import type { NetworkQuality } from '@/features/recorder/services/NetworkQualityService';
import type { TranscriptionSegment } from '@/lib/livekit/LiveKitClient';
import { useHeritageTheme } from '@/theme/heritage';
import { useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Animated } from '@/tw/animated';
import { FadeIn, SharedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectivityBadge } from './ConnectivityBadge';
import { RecordingControls } from './RecordingControls';
import { RecordingModeSwitcher } from './RecordingModeSwitcher';
import { WaveformVisualizer } from './WaveformVisualizer';
import { Container } from '@/components/ui/Container';

interface AiRecordingViewProps {
  questionText?: string;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onSwitchToClassic?: () => void;
  amplitude?: SharedValue<number>;
  recordingDurationSec?: number;
  isPaused?: boolean;
  isOnline?: boolean;
  dialogMode?: 'DIALOG' | 'DEGRADED' | 'SILENT';
  networkQuality?: NetworkQuality | null;
  isCloudConnected?: boolean;
  transcripts?: TranscriptionSegment[];
  cloudErrorMessage?: string | null;
  controlsDisabled?: boolean;
}

type VoiceVisualState = 'recording' | 'connecting' | 'ready' | 'degraded' | 'offline';

function qualityFromOnline(isOnline: boolean): NetworkQuality {
  return isOnline ? 'GOOD' : 'OFFLINE';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds: number): string {
  const minute = Math.floor(seconds / 60);
  const second = seconds % 60;
  return `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
}

export function AiRecordingView({
  questionText,
  onStop,
  onPause,
  onResume,
  onSwitchToClassic,
  amplitude,
  recordingDurationSec = 0,
  isPaused = false,
  isOnline = true,
  dialogMode = 'DIALOG',
  networkQuality = null,
  isCloudConnected = false,
  transcripts = [],
  cloudErrorMessage = null,
  controlsDisabled = false,
}: AiRecordingViewProps): JSX.Element {
  const { colors, isDark } = useHeritageTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Fallback amplitude if not provided
  const fallbackAmplitude = useSharedValue(0);
  const effectiveAmplitude = amplitude ?? fallbackAmplitude;

  const orbSize = clamp(Math.min(width * 0.54, height * 0.22), 170, 206);
  const innerCircleSize = Math.round(orbSize * 0.52);
  const glowSize = Math.round(orbSize * 0.72);
  const waveformWidth = Math.round(orbSize * 0.72);
  const waveformHeight = Math.round(orbSize * 0.3);
  const bottomPadding = Math.max(insets.bottom + 8, 18);

  useEffect(() => {
    const timer = setTimeout(() => setShowVisualizer(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const prompt = questionText ?? 'Tell me more about one meaningful memory today.';
  const effectiveQuality = networkQuality ?? qualityFromOnline(isOnline);
  const isDialogActive = dialogMode === 'DIALOG' && isCloudConnected && isOnline;

  const voiceVisualState: VoiceVisualState = !isOnline
    ? 'offline'
    : isDialogActive
      ? 'ready'
      : dialogMode === 'DEGRADED'
        ? 'degraded'
        : isCloudConnected
          ? 'recording'
          : 'connecting';

  const latestTranscript = useMemo(
    () =>
      transcripts
        .filter((segment) => segment.text.trim().length > 0)
        .slice(-1)[0],
    [transcripts]
  );

  const visualConfig = useMemo(() => {
    switch (voiceVisualState) {
      case 'ready':
        return { accentColor: colors.success };
      case 'connecting':
        return { accentColor: colors.tertiary };
      case 'degraded':
        return { accentColor: colors.warning };
      case 'offline':
        return { accentColor: colors.textMuted };
      default:
        return { accentColor: colors.tertiary };
    }
  }, [voiceVisualState, colors]);

  const transcriptText = latestTranscript
    ? latestTranscript.text
    : cloudErrorMessage
      ? 'Connection error. Recording locally.'
      : !isOnline || !isCloudConnected
        ? 'Waiting for connection...'
        : dialogMode === 'SILENT'
          ? 'AI silent. Recording locally.'
          : 'Listening...';

  const transcriptSpeaker = latestTranscript
    ? latestTranscript.speaker === 'agent'
      ? 'AI Assistant'
      : 'You'
    : 'Status';

  return (
    <Container className="flex-1 bg-surface">
      <View className="flex-1 px-4">
        {/* 1. Unified Header */}
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
                {formatTime(recordingDurationSec)}
              </AppText>
            </View>
          </View>

          <View className="flex-[2] items-center">
            <RecordingModeSwitcher
              mode="ai"
              onSwitch={(mode) => {
                if (mode === 'basic' && onSwitchToClassic) {
                  onSwitchToClassic();
                }
              }}
            />
          </View>

          <View className="flex-1 items-end">
            <ConnectivityBadge
              quality={effectiveQuality}
              mode={dialogMode}
              minimal
            />
          </View>
        </View>

        {/* 2. Content: Typography First */}
        <View className="flex-1 items-center justify-center row-gap-8 px-2">
          <Animated.View
            entering={FadeIn.duration(600)}
            className="items-center row-gap-6"
            style={{ maxWidth: Math.min(width - 40, 380) }}>

            {/* Primary: The Prompt */}
            <AppText
              className="text-[28px] leading-[36px] font-serif text-center tracking-tighter text-onSurface">
              {prompt}
            </AppText>

            {/* Secondary: The Transcript / Status */}
            <View className="items-center row-gap-1 max-w-[90%]">
              <AppText className="text-[11px] font-bold tracking-[1.5px] uppercase text-center mb-1" style={{ color: colors.tertiary }}>
                {transcriptSpeaker}
              </AppText>
              <AppText
                className="text-base leading-6 text-center opacity-90"
                style={{ color: colors.textMuted }}
                numberOfLines={3}>
                {transcriptText}
              </AppText>
            </View>
          </Animated.View>

          {/* 3. Visualizer */}
          <View className="items-center justify-center shrink-0">
            <View
              className="items-center justify-center overflow-hidden"
              style={{ width: orbSize, height: orbSize, borderRadius: orbSize / 2 }}>
              <View className="absolute inset-0 items-center justify-center">
                <BreathingGlow color={visualConfig.accentColor} size={glowSize} profile="recording" />
              </View>
              <View
                className="absolute"
                style={{
                  width: innerCircleSize,
                  height: innerCircleSize,
                  borderRadius: innerCircleSize / 2,
                  backgroundColor: isDark ? `${visualConfig.accentColor}45` : `${visualConfig.accentColor}30`,
                }}
              />
              {showVisualizer && (
                <View className="z-10" style={{ width: waveformWidth, height: waveformHeight }}>
                  <WaveformVisualizer
                    amplitude={effectiveAmplitude}
                    isRecording
                    isPaused={isPaused}
                    color={colors.tertiary}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 4. Footer */}
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
          <AppText className="mt-4 text-[13px] font-medium opacity-60 tracking-[0.4px] text-center" style={{ color: colors.textMuted }}>
            Press and hold to end session
          </AppText>
        </View>
      </View>
    </Container>
  );
}

export default AiRecordingView;
