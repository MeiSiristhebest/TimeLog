import React from 'react';
import { View, ScrollView } from 'react-native';
import { SettingsRow } from '../components/SettingsRow';
import { useHeritageTheme } from '@/theme/heritage';
import { useDisplaySettingsLogic } from '../hooks/useSettingsLogic';
import { Icon } from '@/components/ui/Icon';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';

export function ThemeScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { state, actions } = useDisplaySettingsLogic();
  const { themeMode, themeOptions } = state;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="Dark Mode" showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16 }}>
        <View style={{ backgroundColor: colors.surfaceCard }}>
          {themeOptions.map((option, index) => (
            <SettingsRow
              key={option.value}
              label={option.label}
              onPress={() => actions.setThemeMode(option.value)}
              showChevron={false}
              isLast={index === themeOptions.length - 1}
              rightElement={
                themeMode === option.value ? (
                  <Icon name="checkmark" size={20} color={colors.primary} />
                ) : null
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
