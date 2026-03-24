import { Ionicons } from '@/components/ui/Icon';
import { triggerHaptic } from '@/utils/haptics';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { View, Pressable, StyleSheet } from 'react-native';
import { HoldToStopButton } from './HoldToStopButton';

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
      <View style={styles.idleContainer}>
        <Pressable
          onPress={() => {
            triggerHaptic.success();
            onStart();
          }}
          disabled={disabled}
          style={({ pressed }) => [
            styles.roundButton,
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
          <Ionicons name="mic" size={40} color={colors.onPrimary} />
        </Pressable>
        <AppText
          style={[
            styles.label,
            { color: colors.primary, opacity: 0.9, marginTop: 16, fontSize: 15, fontWeight: '600' },
          ]}
        >
          Tap to start
        </AppText>
      </View>
    );
  }

  // Active State - Pause + Hold to Finish
  return (
    <View style={styles.controlsRow}>
      {/* 1. Pause / Resume */}
      <View style={styles.controlItem}>
        <View style={styles.buttonWrapper}>
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
            style={({ pressed }) => [
              styles.actionOuterRing,
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
                style={[
                  styles.roundButton,
                  {
                    width: ACTION_BUTTON_SIZE,
                    height: ACTION_BUTTON_SIZE,
                    backgroundColor: colors.primarySoft,
                    borderWidth: 2,
                    borderColor: colors.primaryDeep,
                    transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
                    shadowColor: colors.primaryDeep,
                    shadowOpacity: isDark ? 0.4 : 0.18,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                  },
                ]}>
                <Ionicons
                  name={isPaused ? 'play' : 'pause'}
                  size={34}
                  color={colors.primaryDeep}
                  style={{ marginLeft: isPaused ? 4 : 0 }}
                />
              </View>
            )}
          </Pressable>
        </View>
        <AppText style={[styles.label, { color: colors.primaryDeep }]}>
          {isPaused ? 'Resume' : 'Pause'}
        </AppText>
      </View>

      {/* 2. Hold to Finish - Prominent */}
      <View style={styles.controlItem}>
        <View style={styles.buttonWrapper}>
          <HoldToStopButton
            onHoldComplete={() => {
              if (disabled) return;
              triggerHaptic.success();
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
        <AppText style={[styles.label, { color: colors.error, fontWeight: '700' }]}>
          Hold to End
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  idleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 30,
    paddingBottom: 12,
  },
  controlItem: {
    alignItems: 'center',
    rowGap: 12,
    minWidth: ACTION_OUTER_SIZE + 8,
  },
  buttonWrapper: {
    width: ACTION_OUTER_SIZE,
    height: ACTION_OUTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOuterRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  roundButton: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
