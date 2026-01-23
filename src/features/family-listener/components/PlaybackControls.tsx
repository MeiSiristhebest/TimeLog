/**
 * PlaybackControls - Audio playback control component.
 *
 * Provides large, accessible controls for audio playback:
 * - Play/Pause button (72dp per UX spec)
 * - Seek bar with position indicator
 * - Time display (current / total)
 *
 * Story 4.2: Secure Streaming Player (AC: 2)
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useHeritageTheme } from '@/theme/heritage';

type PlaybackControlsProps = {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether audio is buffering */
  isBuffering?: boolean;
  /** Whether playback has completed */
  isCompleted?: boolean;
  /** Current playback position in milliseconds */
  positionMs: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Called when play/pause button is pressed */
  onPlayPause: () => void;
  /** Called when seek bar position changes */
  onSeek: (positionMs: number) => void;
};

/**
 * Formats milliseconds to MM:SS string.
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const PlaybackControls = ({
  isPlaying,
  isBuffering = false,
  isCompleted = false,
  positionMs,
  durationMs,
  onPlayPause,
  onSeek,
}: PlaybackControlsProps) => {
  const { colors } = useHeritageTheme();

  // Determine button icon
  const getButtonIcon = (): 'play' | 'pause' | 'refresh' => {
    if (isCompleted) return 'refresh';
    if (isPlaying) return 'pause';
    return 'play';
  };

  // Determine button label for accessibility
  const getButtonLabel = (): string => {
    if (isCompleted) return 'Replay';
    if (isPlaying) return 'Pause';
    return 'Play';
  };

  return (
    <View style={styles.container}>
      {/* Time Display */}
      <View style={styles.timeRow}>
        <Text
          style={[styles.timeText, { color: colors.onSurface }]}
          accessibilityLabel={`Current time ${formatTime(positionMs)}`}
        >
          {formatTime(positionMs)}
        </Text>
        <Text
          style={[styles.timeText, { color: colors.textMuted }]}
          accessibilityLabel={`Total duration ${formatTime(durationMs)}`}
        >
          {formatTime(durationMs)}
        </Text>
      </View>

      {/* Seek Bar */}
      <View style={styles.sliderContainer}>
        <Slider
          value={positionMs}
          minimumValue={0}
          maximumValue={durationMs || 1}
          onSlidingComplete={onSeek}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          style={styles.slider}
          accessibilityLabel={`Playback progress ${formatTime(positionMs)} / ${formatTime(durationMs)}`}
          accessibilityRole="adjustable"
        />
      </View>

      {/* Play/Pause Button - 72dp per UX spec */}
      <TouchableOpacity
        onPress={onPlayPause}
        disabled={isBuffering}
        style={[styles.playButton, {
          backgroundColor: isBuffering ? colors.border : colors.primary,
        }]}
        accessibilityRole="button"
        accessibilityLabel={isBuffering ? 'Loading' : getButtonLabel()}
        accessibilityState={{ disabled: isBuffering }}
      >
        {isBuffering ? (
          <Ionicons name="hourglass" size={32} color={colors.onSurface} />
        ) : (
          <Ionicons
            name={getButtonIcon()}
            size={32}
            color={colors.onPrimary}
          />
        )}
      </TouchableOpacity>

      {/* Buffering indicator text */}
      {isBuffering && (
        <Text style={[styles.statusText, { color: colors.textMuted }]}>
          Loading...
        </Text>
      )}

      {/* Completion message */}
      {isCompleted && !isBuffering && (
        <Text style={[styles.statusText, { color: colors.textMuted }]}>
          Playback completed
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  timeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
  },
  sliderContainer: {
    width: '100%',
    marginBottom: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  playButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
  },
});

