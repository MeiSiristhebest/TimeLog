/**
 * EmptyGallery - Empty state for story gallery.
 *
 * Displays when no stories have been recorded yet.
 * Uses same background color pattern as Record screen (inline style).
 * Icon shadow uses warm terracotta tone matching the icon color.
 */

import { Ionicons } from '@/components/ui/Icon';
import { Link } from 'expo-router';
import { HeritageButton } from '../../../components/ui/heritage/HeritageButton';
import { AppText } from '@/components/ui/AppText';
import { useHeritageTheme } from '@/theme/heritage';
import React from 'react';
import { View } from 'react-native';

export function EmptyGallery(): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: colors.surface,
      }}>
      {/* Illustration Circle - with subtle warm shadow like Record screen */}
      <View
        style={{
          width: 192,
          height: 192,
          borderRadius: 96,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          backgroundColor: colors.surfaceAccent,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 24,
          elevation: 4,
        }}>
        <Ionicons name="book-outline" size={80} color={colors.primaryDeep} />
      </View>

      <AppText
        style={{
          fontSize: 28,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 12,
          letterSpacing: -0.5,
          fontFamily: 'Fraunces_600SemiBold',
          color: colors.onSurface,
        }}>
        Your first story is waiting
      </AppText>

      <AppText
        style={{
          fontSize: 17,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 40,
          paddingHorizontal: 16,
          color: colors.textMuted,
        }}>
        Capture a memory today to keep it safe forever.
      </AppText>

      <Link href="/(tabs)" asChild>
        <HeritageButton
          title="Record a Story"
          variant="primary"
          icon="mic"
          style={{
            width: '100%',
            maxWidth: 320,
            height: 56,
            borderRadius: 16,
            backgroundColor: colors.primary,
          }}
          onPress={() => { }}
        />
      </Link>
    </View>
  );
}
