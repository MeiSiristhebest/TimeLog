import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/AppText';
import { useHeritageTheme } from '@/theme/heritage';

type DailyGoalChipProps = {
  goalDurationMs: number;
  completedDurationMs: number;
  progressRatio: number;
  isCompleted: boolean;
  onPress: () => void;
};

function formatMinutes(durationMs: number): string {
  return String(Math.floor(durationMs / 60_000));
}

export function DailyGoalChip({
  goalDurationMs,
  completedDurationMs,
  progressRatio,
  isCompleted,
  onPress,
}: DailyGoalChipProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const completedMinutes = formatMinutes(completedDurationMs);
  const goalMinutes = formatMinutes(goalDurationMs);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Daily goal: ${completedMinutes} of ${goalMinutes} minutes recorded`}
      style={[
        styles.container,
        {
          backgroundColor: isCompleted ? `${colors.success}14` : `${colors.primary}12`,
          borderColor: isCompleted ? `${colors.success}55` : `${colors.primary}35`,
        },
      ]}>
      <View style={styles.contentRow}>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'time-outline'}
          size={16}
          color={isCompleted ? colors.success : colors.primary}
        />
        <AppText style={[styles.text, { color: isCompleted ? colors.success : colors.onSurface }]}>
          {completedMinutes}/{goalMinutes}
        </AppText>
      </View>
      <View style={[styles.track, { backgroundColor: `${colors.textMuted}20` }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: isCompleted ? colors.success : colors.primary,
              width: `${Math.round(progressRatio * 100)}%`,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  track: {
    borderRadius: 999,
    height: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
    minWidth: 3,
  },
});
