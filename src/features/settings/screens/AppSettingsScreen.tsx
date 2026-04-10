import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useHeritageTheme } from '@/theme/heritage';
import { useAuthStore } from '@/features/auth/store/authStore';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';
import { APP_ROUTES } from '@/features/app/navigation/routes';

export function AppSettingsScreen(): JSX.Element {
  const router = useRouter();
  const { colors } = useHeritageTheme();
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  const handleSignOut = async () => {
    HeritageAlert.show({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      variant: 'warning',
      primaryAction: {
        label: 'Log Out',
        destructive: true,
        onPress: () => {
          setUnauthenticated();
          router.replace(APP_ROUTES.ROOT);
        },
      },
      secondaryAction: {
        label: 'Cancel',
      },
    });
  };

  const STRINGS = SETTINGS_STRINGS.appSettings;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={STRINGS.title} showBack />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.surfaceDim }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Group 1: Account */}
        <SettingsSection title={STRINGS.sections.account}>
          <Link href={APP_ROUTES.SETTINGS_ACCOUNT_SECURITY} asChild>
            <SettingsRow label={STRINGS.items.accountSecurity} isLast />
          </Link>
        </SettingsSection>

        {/* Group 2: General */}
        <SettingsSection title={STRINGS.sections.general}>
          <Link href={APP_ROUTES.SETTINGS_DISPLAY_ACCESSIBILITY} asChild>
            <SettingsRow label={STRINGS.items.display} />
          </Link>
          <Link href={APP_ROUTES.SETTINGS_DATA_STORAGE} asChild>
            <SettingsRow label={STRINGS.items.dataStorage} isLast />
          </Link>
        </SettingsSection>

        {/* Group 3: About */}
        <SettingsSection title={STRINGS.sections.about}>
          <Link href={APP_ROUTES.SETTINGS_ABOUT_HELP} asChild>
            <SettingsRow label={STRINGS.items.help} />
          </Link>
          <Link href={APP_ROUTES.SETTINGS_ABOUT_TIMELOG} asChild>
            <SettingsRow label={STRINGS.items.about} value="v1.0.0" isLast />
          </Link>
        </SettingsSection>

        {/* Group 4: Actions */}
        <View className="mt-6 mb-6 gap-3">
          <HeritageButton
            title={STRINGS.items.switchAccount}
            onPress={handleSignOut}
            variant="secondary"
            fullWidth
          />

          <HeritageButton
            title={STRINGS.items.logOut}
            onPress={handleSignOut}
            variant="ghost"
            fullWidth
          />
        </View>

        {/* Footer Links */}
        <View className="flex-row justify-center items-center mb-5">
          <AppText className="text-xs font-medium text-[#576b95]">
            {STRINGS.items.privacy}
          </AppText>
          <AppText className="mx-2 text-xs text-[#D1D1D6]">|</AppText>
          <AppText className="text-xs font-medium text-[#576b95]">
            {STRINGS.items.terms}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
