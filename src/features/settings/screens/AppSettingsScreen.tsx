import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { getDefaultDailyGoalDurationMs } from '@/features/home/services/dailyGoalService';

import { useAccountSecurity } from '../hooks/useAccountSecurity';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AppSettingsScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { confirmSignOut } = useAccountSecurity();
  const { t, locale } = useTranslation();

  const handleSignOut = () => {
    confirmSignOut();
  };

  const STRINGS = SETTINGS_STRINGS.appSettings;
  const dailyGoalMinutes = Math.floor(getDefaultDailyGoalDurationMs() / 60_000);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={t('Settings.title')} showBack />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.surfaceDim }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Group 1: Account */}
        <SettingsSection title={t('Settings.sections.account')}>
          <Link href={APP_ROUTES.SETTINGS_ACCOUNT_SECURITY} asChild>
            <SettingsRow label={t('Settings.items.accountSecurity')} isLast />
          </Link>
        </SettingsSection>

        {/* Group 2: General */}
        <SettingsSection title={t('Settings.sections.general')}>
          <Link href={APP_ROUTES.SETTINGS_LANGUAGE} asChild>
            <SettingsRow label={t('Settings.language')} value={locale.toUpperCase()} />
          </Link>
          <Link href={APP_ROUTES.SETTINGS_NOTIFICATIONS} asChild>
            <SettingsRow label={t('Settings.items.notifications')} />
          </Link>
          <Link href={APP_ROUTES.SETTINGS_DAILY_GOAL} asChild>
            <SettingsRow label={t('Settings.items.dailyGoal')} value={`${dailyGoalMinutes} min`} />
          </Link>
          <Link href={APP_ROUTES.SETTINGS_DISPLAY_ACCESSIBILITY} asChild>
            <SettingsRow label={t('Settings.items.display')} />
          </Link>
          <Link href={APP_ROUTES.SETTINGS_DATA_STORAGE} asChild>
            <SettingsRow label={t('Settings.items.dataStorage')} isLast />
          </Link>
        </SettingsSection>

        {/* Group 3: About */}
        <SettingsSection title={t('Settings.sections.about')}>
          <Link href={APP_ROUTES.SETTINGS_ABOUT_HELP} asChild>
            <SettingsRow label={t('Settings.items.help')} />
          </Link>
          <Link href={APP_ROUTES.SETTINGS_ABOUT_TIMELOG} asChild>
            <SettingsRow label={t('Settings.items.about')} value="v1.0.0" isLast />
          </Link>
        </SettingsSection>

        {/* Group 4: Actions */}
        <View className="mb-6 mt-6 gap-3">
          <HeritageButton
            title={t('Settings.items.switchAccount')}
            onPress={handleSignOut}
            variant="secondary"
            fullWidth
          />

          <HeritageButton
            title={t('Settings.items.logOut')}
            onPress={handleSignOut}
            variant="ghost"
            fullWidth
          />
        </View>

        {/* Footer Links */}
        <View className="mb-5 flex-row items-center justify-center">
          <AppText className="text-xs font-medium text-[#576b95]">{t('Settings.items.privacy')}</AppText>
          <AppText className="mx-2 text-xs text-[#D1D1D6]">|</AppText>
          <AppText className="text-xs font-medium text-[#576b95]">{t('Settings.items.terms')}</AppText>
        </View>
      </ScrollView>
    </View>
  );
}
