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

import { Ionicons } from '@/components/ui/Icon';
import Slider from '@react-native-community/slider';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity } from 'react-native';

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

export function PlaybackControls({
  isPlaying,
  isBuffering = false,
  isCompleted = false,
  positionMs,
  durationMs,
  onPlayPause,
  onSeek,
}: PlaybackControlsProps): JSX.Element {
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
    <View className="w-full items-center">
      {/* Time Display */}
      <View className="w-full flex-row justify-between px-2 mb-2">
        <AppText
          className="text-base"
          style={{ color: colors.onSurface }}
          accessibilityLabel={`Current time ${formatTime(positionMs)}`}>
          {formatTime(positionMs)}
        </AppText>
        <AppText
          className="text-base"
          style={{ color: colors.textMuted }}
          accessibilityLabel={`Total duration ${formatTime(durationMs)}`}>
          {formatTime(durationMs)}
        </AppText>
      </View>

      {/* Seek Bar */}
      <View className="w-full mb-8">
        <Slider
          value={positionMs}
          minimumValue={0}
          maximumValue={durationMs || 1}
          onSlidingComplete={onSeek}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          style={{ width: '100%', height: 40 }}
          accessibilityLabel={`Playback progress ${formatTime(positionMs)} / ${formatTime(durationMs)}`}
          accessibilityRole="adjustable"
        />
      </View>

      {/* Play/Pause Button - 72dp per UX spec */}
      <TouchableOpacity
        onPress={onPlayPause}
        disabled={isBuffering}
        className="w-[72px] h-[72px] items-center justify-center rounded-full"
        style={{
          backgroundColor: isBuffering ? colors.border : colors.primary,
        }}
        accessibilityRole="button"
        accessibilityLabel={isBuffering ? 'Loading' : getButtonLabel()}
        accessibilityState={{ disabled: isBuffering }}>
        {isBuffering ? (
          <Ionicons name="hourglass" size={32} color={colors.onSurface} />
        ) : (
          <Ionicons name={getButtonIcon()} size={32} color={colors.onPrimary} />
        )}
      </TouchableOpacity>

      {/* Buffering indicator text */}
      {isBuffering && (
        <AppText className="mt-3 text-base" style={{ color: colors.textMuted }}>Loading...</AppText>
      )}

      {/* Completion message */}
      {isCompleted && !isBuffering && (
        <AppText className="mt-3 text-base" style={{ color: colors.textMuted }}>
          Playback completed
        </AppText>
      )}
    </View>
  );
}
