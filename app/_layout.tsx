import '../global.css';

import '@/lib/logger';
import { useDbMigrations } from '@/db/useMigrations';
import { Stack } from 'expo-router';
import { useDeepLinkHandler } from '@/features/auth/hooks/useDeepLinkHandler';
import { Text, View } from 'react-native';

export default function RootLayout() {
  const { success, error } = useDbMigrations();

  // Deep link and clipboard "TaoKouLing" handling extracted to hook
  useDeepLinkHandler();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Migration Error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Migrating database...</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="device-management" options={{ title: 'Device Management' }} />
      <Stack.Screen name="invite" options={{ title: 'Invite Member' }} />
      <Stack.Screen name="accept-invite" options={{ title: 'Accept Invite' }} />
      <Stack.Screen name="role" options={{ title: 'Choose Role' }} />
      <Stack.Screen name="device-code" options={{ title: 'Device Code' }} />
      <Stack.Screen name="splash" options={{ headerShown: false }} />
    </Stack>
  );
}
