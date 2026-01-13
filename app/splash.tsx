import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Container } from '@/components/ui/Container';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getStoredRole } from '@/features/auth/services/roleStorage';
import { supabase } from '@/lib/supabase';

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';

export default function SplashScreen() {
  const router = useRouter();
  const { setRestoring, setAuthenticated, setUnauthenticated } = useAuthStore();

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
      <View className="flex-1 items-center justify-center">
        <Text className="text-headline font-bold text-onSurface">TimeLog</Text>
        <Text className="text-body text-onSurface/80">Restoring your session…</Text>
      </View>
    </Container>
  );
}
