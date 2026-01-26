import React from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
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
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={STRINGS.title} showBack />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.surfaceDim }]}
        contentContainerStyle={styles.contentContainer}
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
        <View style={styles.actionGroup}>
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
        <View style={styles.footerLinks}>
          <AppText style={styles.footerLinkText}>{STRINGS.items.privacy}</AppText>
          <AppText style={styles.footerDivider}>|</AppText>
          <AppText style={styles.footerLinkText}>{STRINGS.items.terms}</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  actionGroup: {
    marginTop: 24,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#576b95', // Link blue
    fontWeight: '500',
  },
  footerDivider: {
    marginHorizontal: 8,
    color: '#D1D1D6',
    fontSize: 12,
  },
});
