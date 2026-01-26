import { AppText } from '@/components/ui/AppText';
import { View, Pressable, StyleSheet } from 'react-native';

import { Ionicons } from '@/components/ui/Icon';
import { triggerHaptic } from '@/utils/haptics';
import { useHeritageTheme } from '@/theme/heritage';

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
      <View style={styles.centerContainer}>
        <Pressable
          onPress={() => {
            triggerHaptic.success();
            onStart();
          }}
          disabled={disabled}
          style={({ pressed }) => [
            styles.mainButton,
            {
              backgroundColor: colors.primary,
              opacity: disabled ? 0.5 : 1,
              transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            },
          ]}
          accessibilityLabel="Start Recording"
          accessibilityRole="button">
          <Ionicons name="mic" size={48} color={colors.onPrimary} />
        </Pressable>
        <AppText style={[styles.mainLabel, { color: colors.primary }]}>Tap to Record</AppText>
      </View>
    );
  }

  // Recording or Paused State
  return (
    <View style={styles.controlsRow}>
      {/* Stop Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={() => {
            triggerHaptic.success();
            onStop();
          }}
          disabled={disabled}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: disabled ? 0.5 : 1,
              transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
            },
          ]}
          accessibilityLabel="Stop and Save"
          accessibilityRole="button">
          <View style={[styles.stopIcon, { backgroundColor: colors.error }]} />
        </Pressable>
        <AppText style={[styles.buttonLabel, { color: colors.handle }]}>Stop</AppText>
      </View>

      {/* Pause/Resume Button */}
      <View style={styles.buttonContainer}>
        {isPaused ? (
          <Pressable
            onPress={() => {
              triggerHaptic.selection();
              onResume();
            }}
            disabled={disabled}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: colors.primary,
                opacity: disabled ? 0.5 : 1,
                transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
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
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: `${colors.primary}15`,
                borderWidth: 2,
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
        <AppText style={[styles.buttonLabel, { color: colors.handle }]}>
          {isPaused ? 'Resume' : 'Pause'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLabel: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Fraunces_600SemiBold',
    letterSpacing: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 40,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  secondaryButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  buttonLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
