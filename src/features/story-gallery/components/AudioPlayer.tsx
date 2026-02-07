import { AppText } from '@/components/ui/AppText';
import { useEffect } from 'react';
import { View, ActivityIndicator, Pressable, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@/components/ui/Icon';
import { usePlayerStore } from '../store/usePlayerStore';
import { useHeritageTheme } from '@/theme/heritage';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PlaybackWaveform } from './PlaybackWaveform';

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

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, theme.animation.press);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animation.press);
  };

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

      {/* Controls */}
      <View className="flex-row items-center justify-between px-6" style={{ marginTop: -18 }}>
        {/* Skip Back 15s */}
        <Pressable
          onPress={() => handleSkip(-15)}
          className="items-center gap-0.5"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Ionicons name="play-back" size={12} color={theme.colors.textMuted} />
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: 10,
              fontWeight: '600',
              letterSpacing: 0,
              textTransform: 'uppercase',
            }}>
            15s
          </Text>
        </Pressable>

        {/* Play/Pause */}
        <AnimatedPressable
          onPress={togglePlayback}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="w-[56px] h-[56px] items-center justify-center rounded-full shadow-lg elevation-8"
          style={[
            playButtonStyle,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            },
          ]}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.onPrimary} size="large" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={theme.colors.onPrimary}
              style={{ marginLeft: isPlaying ? 0 : 4 }}
            />
          )}
        </AnimatedPressable>

        {/* Skip Forward 15s */}
        <Pressable
          onPress={() => handleSkip(15)}
          className="items-center gap-0.5"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Ionicons name="play-forward" size={12} color={theme.colors.textMuted} />
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: 10,
              fontWeight: '600',
              letterSpacing: 0,
              textTransform: 'uppercase',
            }}>
            15s
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Default export for React.lazy() compatibility
export default AudioPlayer;
