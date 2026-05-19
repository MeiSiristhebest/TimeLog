import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SettingsRow } from '../components/SettingsRow';
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useProfile } from '../hooks/useProfile';
import { getLanguageLabel, getSystemLocale } from '../utils/languageOptions';
import { useTranslation } from '@/lib/i18n/useTranslation';

type HeritageColors = ReturnType<typeof useHeritageTheme>['colors'];

export function DisplayAccessibilityScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { profile } = useProfile();
  const { t } = useTranslation();

  const systemLocale = getSystemLocale();
  const languageValue = getLanguageLabel(profile?.language ?? systemLocale, systemLocale);

  return (
    <View style={[styles.flex1, { backgroundColor: colors.surfaceDim }]}>
      <HeritageHeader title={t('Settings.items.display')} showBack />
      <ScrollView
        style={[styles.flex1, { backgroundColor: colors.surfaceDim }]}
        contentContainerStyle={styles.scrollContent}>
        {/* Display Group */}
        <SettingsSectionContainer colors={colors}>
          <Link href="/(tabs)/settings/font-size" asChild>
            <SettingsRow label={t('Settings.displayAccessibility.fontSize')} />
          </Link>
          <Link href="/(tabs)/settings/language" asChild>
            <SettingsRow label={t('Settings.language')} value={languageValue} isLast />
          </Link>
        </SettingsSectionContainer>
      </ScrollView>
    </View>
  );
}

function SettingsSectionContainer({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: HeritageColors;
}): JSX.Element {
  return (
    <View style={[styles.section, { backgroundColor: colors.surfaceCard }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    gap: 16,
  },
  section: {
    marginBottom: 0,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderRadius: 8,
  },
});
