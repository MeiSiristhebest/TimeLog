import React, { useState } from 'react';
import { Switch, ScrollView, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SettingsRow } from '../components/SettingsRow';
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useProfile } from '../hooks/useProfile';
import { getLanguageLabel, getSystemLocale } from '../utils/languageOptions';
import { AppText } from '@/components/ui/AppText';

type HeritageColors = ReturnType<typeof useHeritageTheme>['colors'];

export function DisplayAccessibilityScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { profile } = useProfile();

  // Local state for Landscape (mocked for now as per plan)
  const [landscape, setLandscape] = useState(false);

  const systemLocale = getSystemLocale();
  const languageValue = getLanguageLabel(profile?.language ?? systemLocale, systemLocale);

  return (
    <View style={[styles.flex1, { backgroundColor: colors.surfaceDim }]}>
      <HeritageHeader title="Interface & Display" showBack />
      <ScrollView
        style={[styles.flex1, { backgroundColor: colors.surfaceDim }]}
        contentContainerStyle={styles.scrollContent}>
        
        {/* 1. Interface Controls */}
        <SettingsSectionContainer colors={colors}>
          <SettingsRow
            label="Landscape Mode"
            isLast
            rightElement={
              <Switch
                value={landscape}
                onValueChange={setLandscape}
                trackColor={{ false: colors.border, true: '#34C759' }}
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
            onPress={NO_OP}
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
    <View style={[styles.section, { backgroundColor: colors.surfaceCard }]}>
      {children}
    </View>
  );
}

function NO_OP(): void {}

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
