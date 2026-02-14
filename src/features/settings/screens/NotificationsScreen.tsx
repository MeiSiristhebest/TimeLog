import { AppText } from '@/components/ui/AppText';
import { View, Switch } from 'react-native';
import { Animated } from '@/tw/animated';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageTimePicker } from '@/components/ui/HeritageTimePicker';
import { HeritageSkeleton } from '@/components/ui/heritage/HeritageSkeleton';
import { useHeritageTheme } from '@/theme/heritage';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useNotificationsLogic } from '../hooks/useSettingsLogic';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';

export function NotificationsScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useNotificationsLogic();
  const {
    enabled,
    gentleReminders,
    quietStart,
    quietEnd,
    isLoading,
    isSaving,
    scrollY,
    showStartPicker,
    showEndPicker,
    formatTime,
  } = state;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surfaceDim,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View style={{ width: '82%', alignItems: 'center', gap: 14 }}>
          <AppText style={{ color: colors.onSurface, fontSize: 18, fontWeight: '600' }}>
            {SETTINGS_STRINGS.notifications.loading}
          </AppText>
          <HeritageSkeleton variant="title" width="60%" />
          <HeritageSkeleton variant="text" width="90%" />
          <HeritageSkeleton variant="text" width="78%" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader
        title={SETTINGS_STRINGS.notifications.title}
        showBack
        scrollY={scrollY}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
      />

      <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 48, gap: 8 }}
        onScroll={actions.scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <SettingsSection title={SETTINGS_STRINGS.notifications.general.title}>
          <View style={{ backgroundColor: colors.surfaceCard }}>
            <SettingsRow
              label={SETTINGS_STRINGS.notifications.general.enableNotifications}
              value=""
              onPress={() => {
                void actions.setEnabled(!enabled);
              }}
              showChevron={false}
              iconName="notifications-outline"
              iconColor={colors.primaryMuted}
              rightElement={
                <Switch
                  value={enabled}
                  onValueChange={(value) => {
                    void actions.setEnabled(value);
                  }}
                />
              }
            />
            <View
              style={{
                height: 0.5,
                backgroundColor: colors.border,
                marginLeft: 56,
              }}
            />
            <SettingsRow
              label={SETTINGS_STRINGS.notifications.general.gentleReminders}
              iconName="hand-left-outline"
              iconColor={colors.sageGreen}
              onPress={() => actions.setGentleReminders(!gentleReminders)}
              showChevron={false}
              isLast
              rightElement={
                <Switch value={gentleReminders} onValueChange={actions.setGentleReminders} />
              }
            />
          </View>
        </SettingsSection>

        {/* Quiet Hours */}
        <SettingsSection title={SETTINGS_STRINGS.notifications.quietHours.title}>
          <View style={{ backgroundColor: colors.surfaceCard }}>
            <SettingsRow
              label={SETTINGS_STRINGS.notifications.quietHours.startTime}
              iconName="moon-outline"
              iconColor={colors.blueAccent}
              value={formatTime(quietStart)}
              onPress={() => actions.setShowStartPicker(true)}
            />
            <View
              style={{
                height: 0.5,
                backgroundColor: colors.border,
                marginLeft: 56,
              }}
            />
            <SettingsRow
              label={SETTINGS_STRINGS.notifications.quietHours.endTime}
              iconName="sunny-outline"
              iconColor={colors.amberCustom}
              value={formatTime(quietEnd)}
              onPress={() => actions.setShowEndPicker(true)}
              isLast
            />
          </View>
        </SettingsSection>

        <View style={{ padding: 16 }}>
          <HeritageButton
            title={isSaving ? 'Saving...' : SETTINGS_STRINGS.notifications.save.button}
            onPress={actions.saveSettings}
            fullWidth
            loading={isSaving}
            disabled={isSaving}
          />
        </View>
      </Animated.ScrollView>

      {/* Time Pickers */}
      <HeritageTimePicker
        visible={showStartPicker}
        onCancel={() => actions.setShowStartPicker(false)}
        value={quietStart}
        onConfirm={(nextDate) => {
          actions.setQuietStart(nextDate);
          actions.setShowStartPicker(false);
        }}
      />
      <HeritageTimePicker
        visible={showEndPicker}
        onCancel={() => actions.setShowEndPicker(false)}
        value={quietEnd}
        onConfirm={(nextDate) => {
          actions.setQuietEnd(nextDate);
          actions.setShowEndPicker(false);
        }}
      />
    </View>
  );
}
