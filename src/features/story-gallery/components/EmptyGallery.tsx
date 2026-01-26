/**
 * EmptyGallery - Empty state for story gallery.
 *
 * Displays when no stories have been recorded yet.
 * Uses same background color pattern as Record screen (inline style).
 * Icon shadow uses warm terracotta tone matching the icon color.
 */

import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View } from '@/tw';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Link } from 'expo-router';
import { HeritageButton } from '../../../components/ui/heritage/HeritageButton';

// Background color constant - matches Record screen
const BG_COLOR = '#FFFAF5';
// Icon color - warm terracotta
const ICON_COLOR = '#C2410C';
// Circle background - warm terracotta soft (surfaceAccent) to avoid grey
const CIRCLE_BG = '#FDF2EE';

export function EmptyGallery(): JSX.Element {
  return (
    <View style={[styles.container, { backgroundColor: BG_COLOR }]}>
      {/* Illustration Circle - with subtle warm shadow like Record screen */}
      <View style={styles.iconCircle}>
        <Ionicons name="book-outline" size={80} color={ICON_COLOR} />
      </View>

      <AppText style={styles.title}>Your first story is waiting</AppText>

      <AppText style={styles.subtitle}>Capture a memory today to keep it safe forever.</AppText>

      <Link href="/(tabs)" asChild>
        <HeritageButton
          title="Record a Story"
          variant="primary"
          icon="mic"
          style={styles.button}
          onPress={() => {}}
        />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    // Warm shadow matching icon color
    shadowColor: ICON_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1917',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#C05621',
  },
});
