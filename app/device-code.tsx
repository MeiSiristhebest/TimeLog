import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { DeviceCodeResult, generateDeviceCode } from '@/features/auth/services/deviceCodesService';
import { clearStoredRole, getStoredRole } from '@/features/auth/services/roleStorage';

export default function DeviceCodeScreen() {
  const [codeData, setCodeData] = useState<DeviceCodeResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  const handleSwitchRole = useCallback(async () => {
    await clearStoredRole();
    router.replace('/role');
  }, [router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleSwitchRole} className="px-3 py-2">
          <Text className="text-body font-semibold text-primary">Back</Text>
        </TouchableOpacity>
      ),
    });
  }, [handleSwitchRole, navigation]);

  useEffect(() => {
    getStoredRole().then((role) => {
      if (role !== 'storyteller') {
        router.replace('/role');
      }
    });
  }, [router]);

  const loadCode = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateDeviceCode();
      setCodeData(result);
      Alert.alert(
        'Device code generated',
        `Code: ${result.code}\nExpires at: ${new Date(result.expiresAt).toLocaleTimeString()}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to generate code right now.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCode();
  }, [loadCode]);

  return (
    <Container>
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <View className="items-center gap-3">
          <Text className="text-center text-headline font-bold text-onSurface">
            Share this device code
          </Text>
          <Text className="text-center text-body text-onSurface">
            Share this 6-digit code with your family to link this device. It expires in 15 minutes.
          </Text>
        </View>

        {codeData ? (
          <View className="items-center gap-2">
            <Text className="text-[48px] font-bold tracking-widest text-primary">
              {codeData.code}
            </Text>
            <Text className="text-body text-onSurface/80">
              Expires at: {new Date(codeData.expiresAt).toLocaleTimeString()}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View className="items-center gap-3">
            <Text className="text-center text-body text-error">{error}</Text>
            <Button
              title="Switch role"
              onPress={handleSwitchRole}
              className="bg-onSurface/10 text-onSurface"
            />
          </View>
        ) : null}

        <Button
          title={loading ? 'Generating…' : 'Regenerate code'}
          onPress={loadCode}
          disabled={loading}
        />
      </View>
    </Container>
  );
}
