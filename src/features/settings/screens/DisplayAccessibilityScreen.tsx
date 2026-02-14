import React, { useState, useMemo } from 'react';
import { Switch, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { SettingsRow } from '../components/SettingsRow';
import { useHeritageTheme } from '@/theme/heritage';
import { useDisplaySettingsLogic } from '../hooks/useSettingsLogic';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useProfile } from '../hooks/useProfile';
import { getLanguageLabel, getSystemLocale } from '../utils/languageOptions';

type HeritageColors = ReturnType<typeof useHeritageTheme>['colors'];

function getThemeLabel(themeMode: 'system' | 'dark' | 'light'): string {
  if (themeMode === 'system') {
    return 'Follow System';
  }
  if (themeMode === 'dark') {
    return 'Dark Mode';
  }
  return 'Light Mode';
}

export function DisplayAccessibilityScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { profile } = useProfile();

  // Logic Separation
  const { state } = useDisplaySettingsLogic();
  const { themeMode } = state;

  // Local state for Landscape (mocked for now as per plan)
  const [landscape, setLandscape] = useState(false);

  // Memoize theme label to prevent re-calculations
  const themeLabel = useMemo(() => getThemeLabel(themeMode), [themeMode]);

  const systemLocale = getSystemLocale();
  const languageValue = getLanguageLabel(profile?.language ?? systemLocale, systemLocale);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="Interface & Display" showBack />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.surfaceDim }}
        contentContainerStyle={{ paddingTop: 16, gap: 16 }}>
        {/* 1. Appearance Group */}
        <SettingsSectionContainer colors={colors}>
          <Link href="/(tabs)/settings/theme-select" asChild>
            <SettingsRow label="Dark Mode" value={themeLabel} showChevron={true} />
          </Link>
          <SettingsRow
            label="Landscape Mode"
            isLast
            rightElement={
              <Switch
                value={landscape}
                onValueChange={setLandscape}
                trackColor={{ false: '#767577', true: '#34C759' }} // WeChat Green
              />
            }
          />
        </SettingsSectionContainer>

        {/* 2. Display Group */}
        <SettingsSectionContainer colors={colors}>
          <Link href="/(tabs)/settings/font-size" asChild>
            <SettingsRow label="Font Size" />
          </Link>
          <Link href="/(tabs)/settings/language" asChild>
            <SettingsRow label="Multi-language" value={languageValue} />
          </Link>
          <SettingsRow
            label="Translate"
            onPress={NO_OP} // Placeholder
            isLast
          />
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
    <View className="mb-0 mx-4 overflow-hidden rounded-lg" style={{ backgroundColor: colors.surfaceCard }}>
      {children}
    </View>
  );
}

function NO_OP(): void {}
