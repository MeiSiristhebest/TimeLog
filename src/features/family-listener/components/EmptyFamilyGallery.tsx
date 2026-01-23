/**
 * EmptyFamilyGallery - Empty state for family story list.
 *
 * Displayed when the linked senior has no recorded stories yet.
 * Uses friendly, encouraging messaging.
 *
 * Story 4.1: Family Story List (AC: 1)
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeritageTheme } from '@/theme/heritage';

export const EmptyFamilyGallery = () => {
  const { colors } = useHeritageTheme();

  return (
    <View style={styles.container}>
      {/* Illustration placeholder - mic icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}10` }]}>
        <Ionicons
          name="people-circle-outline"
          size={80}
          color={colors.primary}
        />
      </View>

      {/* Empty state message */}
      <Text style={[styles.title, { color: colors.onSurface }]}>
        Waiting for stories
      </Text>

      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        When your family records a memory, it will appear here instantly.
      </Text>
    </View>
  );
};

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

