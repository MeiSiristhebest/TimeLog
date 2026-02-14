import { AppText } from '@/components/ui/AppText';
import { BreathingGlow } from '@/components/ui/heritage/BreathingGlow';
import { Ionicons } from '@/components/ui/Icon';
import type { NetworkQuality } from '@/features/recorder/services/NetworkQualityService';
import type { TranscriptionSegment } from '@/lib/livekit/LiveKitClient';
import { useHeritageTheme } from '@/theme/heritage';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Animated } from '@/tw/animated';
import { FadeIn, SharedValue, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectivityBadge } from './ConnectivityBadge';
import { RecordingControls } from './RecordingControls';
import { RecordingModeSwitcher } from './RecordingModeSwitcher';
import { WaveformVisualizer } from './WaveformVisualizer';

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
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.screen}>

          {/* 1. Unified Header */}
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
                  {formatTime(recordingDurationSec)}
                </AppText>
              </View>
            </View>

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
                quality={effectiveQuality}
                mode={dialogMode}
                minimal
              />
            </View>
          </View>


          {/* 2. Content: Typography First */}
          <View style={styles.content}>
            <Animated.View
              entering={FadeIn.duration(600)}
              style={[styles.textWrap, { maxWidth: Math.min(width - 40, 380) }]}>

              {/* Primary: The Prompt */}
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

              {/* Secondary: The Transcript / Status */}
              <View style={styles.transcriptContainer}>
                <AppText style={[styles.speakerLabel, { color: colors.tertiary }]}>
                  {transcriptSpeaker}
                </AppText>
                <AppText
                  style={[
                    styles.transcriptText,
                    { color: colors.textMuted }
                  ]}
                  numberOfLines={3}
                >
                  {transcriptText}
                </AppText>
              </View>
            </Animated.View>

            {/* 3. Visualizer */}
            <View style={styles.orbWrap}>
              <View
                style={[
                  styles.orbContainer,
                  {
                    width: orbSize,
                    height: orbSize,
                    borderRadius: orbSize / 2,
                    // No border
                  },
                ]}>
                <View style={styles.orbBackground}>
                  <BreathingGlow color={visualConfig.accentColor} size={glowSize} profile="recording" />
                </View>
                <View
                  style={[
                    styles.innerCircle,
                    {
                      width: innerCircleSize,
                      height: innerCircleSize,
                      borderRadius: innerCircleSize / 2,
                      backgroundColor: isDark ? `${visualConfig.accentColor}45` : `${visualConfig.accentColor}30`,
                    },
                  ]}
                />
                {showVisualizer && (
                  <View style={{ width: waveformWidth, height: waveformHeight, zIndex: 10 }}>
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
            <AppText style={[styles.footerText, { color: colors.textMuted }]}>
              Press and hold to end session
            </AppText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default AiRecordingView;

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
    rowGap: 32, // Space between text groups and orb
    paddingHorizontal: 8,
  },
  textWrap: {
    width: '100%',
    alignItems: 'center',
    rowGap: 24,
  },
  promptText: {
    fontSize: 28, // Magazine style
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  transcriptContainer: {
    alignItems: 'center',
    rowGap: 4,
    maxWidth: '90%',
  },
  speakerLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
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
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  footerText: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    opacity: 0.6,
    letterSpacing: 0.4,
  },
});
