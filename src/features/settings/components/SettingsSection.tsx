import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useHeritageTheme } from '@/theme/heritage';

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  footer?: string; // Optional footer text like "Data is stored locally"
}

export function SettingsSection({ title, children, footer }: SettingsSectionProps) {
  const { colors } = useHeritageTheme();

  return (
    <View style={styles.sectionWrapper}>
      {title && <AppText style={styles.sectionTitle}>{title.toUpperCase()}</AppText>}

      <View style={[styles.section, { backgroundColor: colors.surfaceCard }]}>{children}</View>

      {footer && <AppText style={styles.sectionFooter}>{footer}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrapper: {
    marginBottom: 20, // More breathing room
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    color: '#8E8E93', // WeChat Gray for Section Headers
    fontWeight: '400',
  },
  sectionFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 12,
    color: '#8E8E93',
  },
  section: {
    width: '100%',
    // No borderRadius in WeChat lists usually, or minimal?
    // Usually full bleed on small screens, but preserving card style for Heritage if desired.
    // Keeping it simple flat for now to match AppSettingsScreen.
  },
});
