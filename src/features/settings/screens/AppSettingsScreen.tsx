import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useHeritageTheme } from '@/theme/heritage';
import { useAuthStore } from '@/features/auth/store/authStore';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';

export function AppSettingsScreen(): JSX.Element {
  const router = useRouter();
  const { colors } = useHeritageTheme();
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  const handleSignOut = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setUnauthenticated();
          router.replace('/');
        },
      },
    ]);
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
          <Link href="/(tabs)/settings/account-security" asChild>
            <SettingsRow label={STRINGS.items.accountSecurity} />
          </Link>
          <Link href="/(tabs)/settings/family-sharing" asChild>
            <SettingsRow label={STRINGS.items.familySharing} isLast />
          </Link>
        </SettingsSection>

        {/* Group 2: General */}
        <SettingsSection title={STRINGS.sections.general}>
          <Link href="/(tabs)/settings/notifications" asChild>
            <SettingsRow label={STRINGS.items.notifications} />
          </Link>
          <Link href="/(tabs)/settings/display-accessibility" asChild>
            <SettingsRow label={STRINGS.items.display} />
          </Link>
          <Link href="/(tabs)/settings/data-storage" asChild>
            <SettingsRow label={STRINGS.items.dataStorage} isLast />
          </Link>
        </SettingsSection>

        {/* Group 3: About */}
        <SettingsSection title={STRINGS.sections.about}>
          <Link href="/(tabs)/settings/about-help" asChild>
            <SettingsRow label={STRINGS.items.help} />
          </Link>
          <Link href="/(tabs)/settings/about-help" asChild>
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
