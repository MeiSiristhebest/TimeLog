import React from 'react';
import { AppText } from '@/components/ui/AppText';
import { useHeritageTheme } from '@/theme/heritage';
import { View } from 'react-native';

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  footer?: string; // Optional footer text like "Data is stored locally"
}

export function SettingsSection({ title, children, footer }: SettingsSectionProps) {
  const { colors } = useHeritageTheme();

  return (
    <View className="mb-5">
      {title && (
        <AppText className="px-4 py-2 text-xs font-normal text-[#8E8E93]">
          {title.toUpperCase()}
        </AppText>
      )}

      <View
        className="w-full"
        style={{ backgroundColor: colors.surfaceCard }}>
        {children}
      </View>

      {footer && (
        <AppText className="px-4 pt-2 text-xs text-[#8E8E93]">
          {footer}
        </AppText>
      )}
    </View>
  );
}
