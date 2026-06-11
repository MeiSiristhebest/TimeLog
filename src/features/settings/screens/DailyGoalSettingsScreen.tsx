import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/AppText';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { useHeritageTheme } from '@/theme/heritage';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  getDefaultDailyGoalDurationMs,
  setDailyGoalDurationForDate,
} from '@/features/home/services/dailyGoalService';
import { devLog } from '@/lib/devLogger';
import { useTranslation } from '@/lib/i18n/useTranslation';

const GOAL_OPTIONS_MINUTES = [1, 3, 5, 10, 15] as const;

export function DailyGoalSettingsScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.sessionUserId);
  const [selectedMinutes, setSelectedMinutes] = useState(
    Math.floor(getDefaultDailyGoalDurationMs() / 60_000)
  );

  const handleSelect = (minutes: number): void => {
    setSelectedMinutes(minutes);
    void setDailyGoalDurationForDate({
      userId,
      goalDurationMs: minutes * 60_000,
    }).catch((error) => {
      devLog.warn('[DailyGoalSettingsScreen] Failed to save daily goal', error);
    });
  };

  const getGoalDescription = (minutes: number) => {
    return minutes <= 3
      ? t('Settings.dailyGoal.gentleHabit', { defaultValue: 'Gentle daily habit' })
      : t('Settings.dailyGoal.deeperStories', { defaultValue: 'More time for deeper stories' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceDim }]}>
      <HeritageHeader title={t('Settings.items.dailyGoal')} showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.surfaceDim }}>
        <View style={styles.summary}>
          <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
            {t('Settings.dailyGoal.minutesValue', { minutes: selectedMinutes, defaultValue: `${selectedMinutes} min` })}
          </AppText>
          <AppText style={[styles.summaryLabel, { color: colors.textMuted }]}>
            {t('Settings.dailyGoal.summaryLabel', { defaultValue: 'Target recording time per day' })}
          </AppText>
        </View>

        <SettingsSection
          title={t('Settings.dailyGoal.chooseGoal', { defaultValue: 'Choose a goal' })}
          footer={t('Settings.dailyGoal.footer', {
            defaultValue:
              "The home screen shows today's progress beside the weather. Changing this target also updates today's goal.",
          })}>
          {GOAL_OPTIONS_MINUTES.map((minutes, index) => {
            const isSelected = minutes === selectedMinutes;

            return (
              <SettingsRow
                key={minutes}
                label={t('Settings.dailyGoal.optionLabel', { minutes, defaultValue: `${minutes} minutes` })}
                value={getGoalDescription(minutes)}
                onPress={() => handleSelect(minutes)}
                showChevron={false}
                isLast={index === GOAL_OPTIONS_MINUTES.length - 1}
                rightElement={
                  isSelected ? (
                    <Ionicons
                      name="checkmark"
                      size={24}
                      color={colors.primary}
                      style={{ marginLeft: 8 }}
                    />
                  ) : (
                    <View style={{ width: 24, marginLeft: 8 }} />
                  )
                }
              />
            );
          })}
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 48,
    paddingTop: 8,
  },
  summary: {
    alignItems: 'center',
    paddingBottom: 22,
    paddingTop: 18,
  },
  summaryValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 44,
    lineHeight: 52,
  },
  summaryLabel: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 4,
  },
});
