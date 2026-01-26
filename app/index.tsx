import { AppText } from '@/components/ui/AppText';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Container } from '@/components/ui/Container';
import { getStoredRole, setStoredRole } from '@/features/auth/services/roleStorage';

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';

export default function Index(): JSX.Element {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedRole = await getStoredRole();
      if (storedRole === ROLE_STORYTELLER || storedRole === ROLE_FAMILY) {
        router.replace('/splash');
        return;
      }
      router.replace('/welcome');
    };
    bootstrap().finally(() => setLoading(false));
  }, []);

  // Optional: allow deep link to force role (dev utility)
  const setRoleAndRoute = async (role: string) => {
    await setStoredRole(role);
    if (role === ROLE_STORYTELLER) {
      router.replace('/device-code');
    } else {
      router.replace('/(tabs)');
    }
  };

  if (loading) {
    return (
      <Container>
        <View className="flex-1 items-center justify-center">
          <AppText className="text-body text-onSurface">Loading…</AppText>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View className="flex-1 items-center justify-center gap-4">
        <AppText className="text-headline text-onSurface font-bold">Redirecting…</AppText>
        <View className="flex-row gap-2">
          <AppText
            className="text-body text-onSurface/60"
            onPress={() => setRoleAndRoute(ROLE_STORYTELLER)}>
            (Dev) Storyteller
          </AppText>
          <AppText
            className="text-body text-onSurface/60"
            onPress={() => setRoleAndRoute(ROLE_FAMILY)}>
            (Dev) Family
          </AppText>
        </View>
      </View>
    </Container>
  );
}
