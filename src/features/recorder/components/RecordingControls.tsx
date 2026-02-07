
import { Ionicons } from '@/components/ui/Icon';
import { triggerHaptic } from '@/utils/haptics';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { View, Pressable } from 'react-native';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
}

export function RecordingControls({
  isRecording,
  isPaused,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled = false,
}: RecordingControlsProps): JSX.Element {
  const { colors } = useHeritageTheme();

  if (!isRecording) {
    // Idle State - Big Start Button with premium design
    return (
      <View className="items-center justify-center">
        <Pressable
          onPress={() => {
            triggerHaptic.success();
            onStart();
          }}
          disabled={disabled}
          className="w-24 h-24 rounded-full items-center justify-center shadow-lg elevation-8"
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              opacity: disabled ? 0.5 : 1,
              transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              borderRadius: 999,
              overflow: 'hidden',
            },
          ]}
          accessibilityLabel="Start Recording"
          accessibilityRole="button">
          <Ionicons name="mic" size={48} color={colors.onPrimary} />
        </Pressable>
        <AppText
          className="mt-4 text-[22px] font-semibold tracking-wide"
          style={{ fontFamily: 'Fraunces_600SemiBold', color: colors.primary }}>
          Tap to Record
        </AppText>
      </View>
    );
  }

  // Recording or Paused State
  return (
    <View className="flex-row items-start justify-center gap-10">
      {/* Stop Button */}
      <View className="items-center">
        <Pressable
          onPress={() => {
            triggerHaptic.success();
            onStop();
          }}
          disabled={disabled}
          className="w-20 h-20 rounded-full items-center justify-center border-[3px]"
          style={({ pressed }) => [
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: disabled ? 0.5 : 1,
              transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
            },
          ]}
          accessibilityLabel="Stop and Save"
          accessibilityRole="button">
          <View className="w-8 h-8 rounded-md" style={{ backgroundColor: colors.error }} />
        </Pressable>
        <AppText className="mt-2 text-sm font-semibold" style={{ color: colors.handle }}>Stop</AppText>
      </View>

      {/* Pause/Resume Button */}
      <View className="items-center">
        {isPaused ? (
          <Pressable
            onPress={() => {
              triggerHaptic.selection();
              onResume();
            }}
            disabled={disabled}
            className="w-20 h-20 rounded-full items-center justify-center border-[3px] shadow-sm elevation-4"
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                // Although not explicitly bordered in paused state in original, keeping consistent sizing is good.
                // But original didn't have border here. It had shadow.
                borderColor: colors.primary, // Implicit or handled by background
                borderWidth: 0, // Reset border for filled button
                opacity: disabled ? 0.5 : 1,
                transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              },
            ]}
            accessibilityLabel="Resume Recording"
            accessibilityRole="button">
            <Ionicons name="play" size={40} color={colors.onPrimary} style={{ marginLeft: 4 }} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              triggerHaptic.selection();
              onPause();
            }}
            disabled={disabled}
            className="w-20 h-20 rounded-full items-center justify-center border-2"
            style={({ pressed }) => [
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: colors.primary,
                opacity: disabled ? 0.5 : 1,
                transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
              },
            ]}
            accessibilityLabel="Pause Recording"
            accessibilityRole="button">
            <Ionicons name="pause" size={40} color={colors.primary} />
          </Pressable>
        )}
        <AppText className="mt-2 text-sm font-semibold" style={{ color: colors.handle }}>
          {isPaused ? 'Resume' : 'Pause'}
        </AppText>
      </View>
    </View>
  );
}
