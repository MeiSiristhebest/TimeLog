import { AppText } from '@/components/ui/AppText';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@/components/ui/Icon';
import { usePlayerStore } from '../store/usePlayerStore';
import { useHeritageTheme } from '@/theme/heritage';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface AudioPlayerProps {
  uri: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatTime(millis: number): string {
  const totalSeconds = millis / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ uri }: AudioPlayerProps): JSX.Element {
  const theme = useHeritageTheme();
  const {
    load,
    togglePlayback,
    seek,
    isPlaying,
    positionMillis,
    durationMillis,
    isLoading,
    error,
  } = usePlayerStore();

  const scale = useSharedValue(1);

  useEffect(() => {
    load(uri);
  }, [uri, load]);

  const handleSeek = (value: number) => {
    seek(value);
  };

  const handleSkip = (seconds: number) => {
    const newPosition = positionMillis + seconds * 1000;
    seek(Math.max(0, Math.min(newPosition, durationMillis || 0)));
  };

  const playButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, theme.animation.press);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animation.press);
  };

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}15` }]}>
        <AppText style={[styles.errorText, { color: theme.colors.error }]}>{error}</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Waveform Visual (Simulated for aesthetics) */}
      <View style={styles.waveformContainer}>
        {[0.4, 0.7, 1.0, 0.6, 0.4].map((h, i) => (
          <View
            key={i}
            style={[
              styles.waveformBar,
              {
                height: 40 * h,
                backgroundColor:
                  i === 2 && isPlaying ? theme.colors.primary : `${theme.colors.primary}50`,
                opacity: isPlaying ? 1 : 0.8,
              },
            ]}
          />
        ))}
      </View>

      {/* Scrubber */}
      <View style={styles.progressContainer}>
        <View style={styles.timeContainer}>
          <AppText style={[styles.timeText, { color: theme.colors.primary }]}>
            {formatTime(positionMillis)}
          </AppText>
          <AppText style={[styles.timeText, { color: theme.colors.textMuted }]}>
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

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Skip Back 15s */}
        <Pressable
          onPress={() => handleSkip(-15)}
          style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="replay-10" size={36} color={theme.colors.textMuted} />
          <AppText style={[styles.skipText, { color: theme.colors.textMuted }]}>15s</AppText>
        </Pressable>

        {/* Play/Pause */}
        <AnimatedPressable
          onPress={togglePlayback}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.playButton,
            playButtonStyle,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
          ]}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.onPrimary} size="large" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color={theme.colors.onPrimary}
              style={{ marginLeft: isPlaying ? 0 : 4 }}
            />
          )}
        </AnimatedPressable>

        {/* Skip Forward 15s */}
        <Pressable
          onPress={() => handleSkip(15)}
          style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="forward-10" size={36} color={theme.colors.textMuted} />
          <AppText style={[styles.skipText, { color: theme.colors.textMuted }]}>15s</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 6,
    marginBottom: 24,
    opacity: 0.8,
  },
  waveformBar: {
    width: 6,
    borderRadius: 999,
  },
  progressContainer: {
    marginBottom: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: -8, // Pull closer to slider
  },
  timeText: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Spread out skip buttons from center
    paddingHorizontal: 20,
  },
  skipButton: {
    alignItems: 'center',
    gap: 2,
  },
  skipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});

// Default export for React.lazy() compatibility
export default AudioPlayer;
