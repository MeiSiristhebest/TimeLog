import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getStoredRole, setStoredRole } from '@/features/auth/services/roleStorage';

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';

export default function RoleScreen() {
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <Container>
        <View className="flex-1 items-center justify-center">
          <Text className="text-body text-onSurface">Loading…</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <View className="gap-3">
          <Text className="text-center text-headline font-bold text-onSurface">
            Who is using TimeLog?
          </Text>
          <Text className="text-center text-body text-onSurface">
            Choose your role to start. This choice is remembered for future launches.
          </Text>
        </View>
        <View className="w-full gap-3">
          <Button
            title="I’m the Storyteller (senior)"
            onPress={() => handleSelect(ROLE_STORYTELLER)}
          />
          <Button
            title="I’m Family"
            onPress={() => handleSelect(ROLE_FAMILY)}
            className="bg-onSurface/10 text-onSurface"
          />
        </View>
      </View>
    </Container>
  );
}
