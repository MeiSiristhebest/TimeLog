import { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '@/components/ui/Container';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getStoredRole } from '@/features/auth/services/roleStorage';
import { supabase } from '@/lib/supabase';
import { useHeritageTheme } from '@/theme/heritage';

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';

export default function SplashScreen() {
  const router = useRouter();
  const { setRestoring, setAuthenticated, setUnauthenticated } = useAuthStore();
  const { colors } = useHeritageTheme();

  useEffect(() => {
    const restore = async () => {
      setRestoring();

      const role = await getStoredRole();
      const { data, error } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;

      if (error || !data?.session) {
        setUnauthenticated(error?.message);
        if (role === ROLE_STORYTELLER) {
          router.replace('/device-code');
          return;
        }
        if (role === ROLE_FAMILY) {
          router.replace('/login');
          return;
        }
        router.replace('/role');
        return;
      }

      setAuthenticated(userId);

      if (role === ROLE_STORYTELLER) {
        router.replace('/device-code');
        return;
      }
      if (role === ROLE_FAMILY) {
        router.replace('/(tabs)');
        return;
      }

      // Fallback: no role stored but session exists -> assume family
      router.replace('/(tabs)');
    };

    restore();
  }, [router, setAuthenticated, setRestoring, setUnauthenticated]);

  return (
    <Container>
      <View style={styles.container}>
        {/* Heritage Logo */}
        <View
          style={[styles.logo, {
            backgroundColor: `${colors.primary}12`,
            borderColor: `${colors.primary}20`,
          }]}
        >
          <Ionicons name="book" size={48} color={colors.primary} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            TimeLog
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Restoring your session…
          </Text>
        </View>

        {/* Decorative accent */}
        <View style={[styles.accent, { backgroundColor: colors.warning }]} />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 40,
    fontFamily: 'Fraunces_600SemiBold',
  },
  subtitle: {
    fontSize: 16,
  },
  accent: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginTop: 16,
  },
});

