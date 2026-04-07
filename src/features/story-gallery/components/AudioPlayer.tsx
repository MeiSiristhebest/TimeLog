import { AppText } from '@/components/ui/AppText';
import { useCallback, useEffect } from 'react';
import { View, ActivityIndicator, Text, AppState, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@/components/ui/Icon';
import { usePlayerStore } from '../store/usePlayerStore';
import type { PlayerOutputMode } from '../services/playerService';
import { useHeritageTheme } from '@/theme/heritage';
import { PlaybackWaveform } from './PlaybackWaveform';
import { useFocusEffect } from '@react-navigation/native';

function formatTime(millis: number): string {
  const totalSeconds = millis / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface AudioPlayerProps {
  uri: string;
}

export function AudioPlayer({ uri }: AudioPlayerProps): JSX.Element {
  const theme = useHeritageTheme();
  const {
    load,
    togglePlayback,
    seek,
    reset,
    outputMode,
    setOutputMode,
    isPlaying,
    isTogglingPlayback,
    positionMillis,
    durationMillis,
    isLoading,
    error,
  } = usePlayerStore();

  useFocusEffect(
    useCallback(() => {
      void load(uri);
      return () => {
        reset();
      };
    }, [uri, load, reset])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        reset();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [reset]);

  const handleSeek = (value: number) => {
    seek(value);
  };

  const handleSkip = (seconds: number) => {
    const newPosition = positionMillis + seconds * 1000;
    seek(Math.max(0, Math.min(newPosition, durationMillis || 0)));
  };

  const handleToggleOutputMode = () => {
    const nextMode: PlayerOutputMode = outputMode === 'speaker' ? 'earpiece' : 'speaker';
    void setOutputMode(nextMode);
  };

  const handleTogglePlayback = useCallback(() => {
    void togglePlayback();
  }, [togglePlayback]);

  if (error) {
    return (
      <View className="p-4 rounded-2xl items-center" style={{ backgroundColor: `${theme.colors.error}15` }}>
        <AppText className="text-sm font-medium" style={{ color: theme.colors.error }}>{error}</AppText>
      </View>
    );
  }

  return (
    <View className="w-full">
      {/* Waveform Visual (Real analysis) */}
      <View style={{ marginBottom: 12 }}>
        <PlaybackWaveform
          uri={uri}
          positionMillis={positionMillis}
          durationMillis={durationMillis}
          height={50}
          barWidth={1}
          barGap={2}
          color={`${theme.colors.primary}60`}
          progressColor={theme.colors.primaryDeep}
        />
      </View>

      {/* Scrubber */}
      <View className="mb-4">
        <View className="flex-row justify-between px-1 -mb-2">
          <AppText className="font-semibold text-sm tabular-nums" style={{ color: theme.colors.primary }}>
            {formatTime(positionMillis)}
          </AppText>
          <AppText className="font-semibold text-sm tabular-nums" style={{ color: theme.colors.textMuted }}>
            {formatTime(durationMillis)}
          </AppText>
        </View>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={durationMillis || 1}
          value={positionMillis}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={`${theme.colors.textMuted}30`}
          thumbTintColor={theme.colors.primary}
        />
      </View>

      <View style={styles.outputModeRow}>
        <TouchableOpacity
          onPress={handleToggleOutputMode}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Switch output mode. Current mode: ${outputMode === 'speaker' ? 'Speaker' : 'Earpiece'}`}
          hitSlop={10}
          style={[
            styles.outputModeToggle,
            {
              backgroundColor: `${theme.colors.surfaceCard}F2`,
              borderColor: `${theme.colors.textMuted}45`,
            },
          ]}>
          <Ionicons
            name={outputMode === 'speaker' ? 'volume-high' : 'phone-portrait'}
            size={16}
            color={theme.colors.textMuted}
          />
          <Text
            numberOfLines={1}
            style={[styles.outputModeToggleLabel, { color: theme.colors.textMuted }]}>
            {outputMode === 'speaker' ? 'Speaker' : 'Earpiece'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Controls */}
      <View style={styles.controlRow}>
        {/* Skip Back 15s */}
        <TouchableOpacity
          onPress={() => handleSkip(-15)}
          activeOpacity={0.75}
          accessibilityLabel="Seek backward 15 seconds"
          accessibilityRole="button"
          hitSlop={12}
          style={[
            styles.seekButton,
            {
              backgroundColor: `${theme.colors.surfaceCard}F2`,
              borderColor: `${theme.colors.textMuted}40`,
            },
          ]}>
          <Ionicons name="play-back" size={20} color={theme.colors.textMuted} />
          <Text style={[styles.seekLabel, { color: theme.colors.textMuted }]}>15s</Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          onPress={handleTogglePlayback}
          disabled={isTogglingPlayback}
          activeOpacity={0.85}
          accessibilityLabel={isPlaying ? 'Pause playback' : 'Play recording'}
          accessibilityRole="button"
          hitSlop={14}
          style={[
            styles.playButton,
            {
              opacity: isTogglingPlayback ? 0.7 : 1,
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              borderColor: `${theme.colors.primaryDeep}33`,
            },
          ]}>
          <View style={styles.playButtonInner}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.onPrimary} size="large" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={34}
                color={theme.colors.onPrimary}
                style={{ marginLeft: isPlaying ? 0 : 4 }}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Skip Forward 15s */}
        <TouchableOpacity
          onPress={() => handleSkip(15)}
          activeOpacity={0.75}
          accessibilityLabel="Seek forward 15 seconds"
          accessibilityRole="button"
          hitSlop={12}
          style={[
            styles.seekButton,
            {
              backgroundColor: `${theme.colors.surfaceCard}F2`,
              borderColor: `${theme.colors.textMuted}40`,
            },
          ]}>
          <Ionicons name="play-forward" size={20} color={theme.colors.textMuted} />
          <Text style={[styles.seekLabel, { color: theme.colors.textMuted }]}>15s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Default export for React.lazy() compatibility
export default AudioPlayer;

const styles = StyleSheet.create({
  controlRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 8,
  },
  seekButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 4,
  },
  seekLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  playButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 9,
  },
  playButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputModeRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  outputModeToggle: {
    minWidth: 146,
    height: 50,
    borderRadius: 999,
    borderWidth: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  outputModeToggleLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginLeft: 8,
    flexShrink: 0,
  },
});
