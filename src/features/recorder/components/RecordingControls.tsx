import { Icon } from '@/components/ui/Icon';
import { triggerHaptic } from '@/utils/haptics';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { View, Pressable } from 'react-native';
import { HoldToStopButton } from './HoldToStopButton';
import * as Haptics from 'expo-haptics';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
}

// Control sizing tuned for better touch targets and visual symmetry
const START_BUTTON_SIZE = 88;
const ACTION_BUTTON_SIZE = 88;
const ACTION_RING_PADDING = 12;
const ACTION_OUTER_SIZE = ACTION_BUTTON_SIZE + ACTION_RING_PADDING * 2;

export function RecordingControls({
  isRecording,
  isPaused,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled = false,
}: RecordingControlsProps): JSX.Element {
  const { colors, isDark } = useHeritageTheme();

  if (!isRecording) {
    // Idle State - Large, inviting Start button
    return (
      <View className="items-center justify-center">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onStart();
          }}
          disabled={disabled}
          className="items-center justify-center rounded-full elevation-10"
          style={({ pressed }) => [
            {
              width: START_BUTTON_SIZE,
              height: START_BUTTON_SIZE,
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOpacity: isDark ? 0.4 : 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          accessibilityLabel="Start Recording"
          accessibilityRole="button">
          <Icon name="mic" size={40} color={colors.onPrimary} />
        </Pressable>
        <AppText
          className="mt-4 text-[15px] font-semibold opacity-90"
          style={{ color: colors.primary }}
        >
          Tap to start
        </AppText>
      </View>
    );
  }

  // Active State - Pause + Hold to Finish
  return (
    <View className="flex-row items-center justify-center column-gap-[30px] pb-3">
      {/* 1. Pause / Resume */}
      <View className="items-center row-gap-3 min-w-[112px]">
        <View className="w-[112px] h-[112px] items-center justify-center">
          <Pressable
            onPress={() => {
              triggerHaptic.selection();
              if (isPaused) {
                onResume();
                return;
              }
              onPause();
            }}
            disabled={disabled}
            className="items-center justify-center border-2"
            style={({ pressed }) => [
              {
                width: ACTION_OUTER_SIZE,
                height: ACTION_OUTER_SIZE,
                borderRadius: ACTION_OUTER_SIZE / 2,
                borderColor: `${colors.primaryDeep}55`,
                backgroundColor: isDark ? `${colors.primaryDeep}1A` : `${colors.primaryDeep}0A`,
                opacity: disabled ? 0.4 : 1,
              },
            ]}>
            {({ pressed }) => (
              <View
                className="rounded-full items-center justify-center border-2 elevation-5"
                style={[
                  {
                    width: ACTION_BUTTON_SIZE,
                    height: ACTION_BUTTON_SIZE,
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primaryDeep,
                    transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
                    shadowColor: colors.primaryDeep,
                    shadowOpacity: isDark ? 0.4 : 0.18,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                  },
                ]}>
                <Icon
                  name={isPaused ? 'play' : 'pause'}
                  size={34}
                  color={colors.primaryDeep}
                  style={{ marginLeft: isPaused ? 4 : 0 }}
                />
              </View>
            )}
          </Pressable>
        </View>
        <AppText className="text-[15px] font-semibold tracking-[0.3px]" style={{ color: colors.primaryDeep }}>
          {isPaused ? 'Resume' : 'Pause'}
        </AppText>
      </View>

      {/* 2. Hold to Finish - Prominent */}
      <View className="items-center row-gap-3 min-w-[112px]">
        <View className="w-[112px] h-[112px] items-center justify-center">
          <HoldToStopButton
            onHoldComplete={() => {
              if (disabled) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onStop();
            }}
            size={ACTION_BUTTON_SIZE}
            holdDurationMs={700}
            buttonColor={isDark ? `${colors.surfaceCard}F0` : '#FFF8F5'}
            iconColor={colors.error}
            progressColor={colors.error}
            trackColor={isDark ? `${colors.error}66` : `${colors.error}4D`}
            ringStrokeWidth={6}
            ringPadding={ACTION_RING_PADDING}
            buttonBorderColor={colors.error}
            buttonBorderWidth={2}
            accessibilityLabel="Hold to finish recording"
            disabled={disabled}
          />
        </View>
        <AppText className="text-[15px] font-bold tracking-[0.3px]" style={{ color: colors.error }}>
          Hold to End
        </AppText>
      </View>
    </View>
  );
}
