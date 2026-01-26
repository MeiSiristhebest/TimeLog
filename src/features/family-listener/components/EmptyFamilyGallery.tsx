/**
 * EmptyFamilyGallery - Empty state for family story list.
 *
 * Displayed when the linked senior has no recorded stories yet.
 * Uses friendly, encouraging messaging.
 *
 * Story 4.1: Family Story List (AC: 1)
 */

import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';

export function EmptyFamilyGallery(): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}10` }]}>
        <Ionicons name="people-circle-outline" size={80} color={colors.primary} />
      </View>

      <AppText style={[styles.title, { color: colors.onSurface }]}>Waiting for stories</AppText>

      <AppText style={[styles.subtitle, { color: colors.textMuted }]}>
        When your family records a memory, it will appear here instantly.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
    height: 160,
    width: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 80,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Fraunces_600SemiBold',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
