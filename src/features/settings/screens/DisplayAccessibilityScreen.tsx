import React, { useState, useMemo } from 'react';
import { ScrollView, View, Switch, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

import { SettingsRow } from '../components/SettingsRow';
import { useHeritageTheme } from '@/theme/heritage';
import { useDisplaySettingsLogic } from '../hooks/useSettingsLogic';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';

export function DisplayAccessibilityScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state } = useDisplaySettingsLogic();
  const { themeMode } = state;

  // Local state for Landscape (mocked for now as per plan)
  const [landscape, setLandscape] = useState(false);

  // Memoize theme label to prevent re-calculations
  const themeLabel = useMemo(
    () =>
      themeMode === 'system' ? 'Follow System' : themeMode === 'dark' ? 'Dark Mode' : 'Light Mode',
    [themeMode]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="Interface & Display" showBack />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surfaceDim }}
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
          <SettingsRow
            label="Multi-language"
            value="Follow System"
            onPress={NO_OP} // Placeholder
          />
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

// Extracted Component (Fixing nested definition rule)
const SettingsSectionContainer = ({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: any;
}) => <View style={[styles.section, { backgroundColor: colors.surfaceCard }]}>{children}</View>;

const NO_OP = () => {};

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
  },
});
