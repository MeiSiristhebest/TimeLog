import { useEffect, useState } from 'react';
import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getStoredRole, setStoredRole } from '@/features/auth/services/roleStorage';
import { useHeritageTheme } from '@/theme/heritage';
import { PALETTE } from '@/theme/heritage';

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';

export default function RoleScreen() {
  const [loading, setLoading] = useState(true);
  const { colors, spacing } = useHeritageTheme();

  useEffect(() => {
    getStoredRole()
      .then((role) => {
        if (role === ROLE_STORYTELLER) {
          router.replace('/device-code');
          return;
        }
        if (role === ROLE_FAMILY) {
          router.replace('/(tabs)');
          return;
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (role: string) => {
    await setStoredRole(role);
    if (role === ROLE_STORYTELLER) {
      router.replace('/device-code');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if accessed directly (though unlikely in this flow)
      router.replace('/welcome');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: colors.textMuted }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Who is using{'\n'}this phone?
          </Text>
        </Animated.View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Storyteller Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ width: '100%' }}>
            <Pressable
              onPress={() => handleSelect(ROLE_STORYTELLER)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && [styles.cardPressed, { backgroundColor: colors.surfaceDim, borderColor: colors.primary }]
              ]}
              accessibilityRole="button"
              accessibilityLabel="I am a Storyteller"
            >
              <View style={styles.iconContainer}>
                <Ionicons name="mic" size={84} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                I am a Storyteller
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                I want to record memories
              </Text>
            </Pressable>
          </Animated.View>

          {/* Listener Card */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ width: '100%' }}>
            <Pressable
              onPress={() => handleSelect(ROLE_FAMILY)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && [styles.cardPressed, { backgroundColor: colors.surfaceDim, borderColor: colors.primary }]
              ]}
              accessibilityRole="button"
              accessibilityLabel="I am a Listener"
            >
              <View style={styles.iconContainer}>
                {/* Using headset as equivalent to standard headphones */}
                <Ionicons name="headset" size={84} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                I am a Listener
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                I want to hear stories
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: PALETTE.overlayLight,
  },
  backButtonPressed: {
    backgroundColor: PALETTE.overlayMedium,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  titleContainer: {
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 32,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 42,
    lineHeight: 48, // Tight leading
    letterSpacing: -0.5,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    width: '100%',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderRadius: 20, // Approx 'xl' in tailwind
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow isn't on the original request but makes it pop slightly in RN
    shadowColor: PALETTE.shadowNeutral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    marginBottom: 24,
    // Add optional hover/scale effect logic here if using Reanimated, 
    // but simple press scale on parent is usually enough for native feels.
  },
  cardTitle: {
    fontSize: 24, // 3xl approx
    fontFamily: 'Inter', // Display font
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '500',
    textAlign: 'center',
  }
});
