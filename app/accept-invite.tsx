import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { acceptFamilyInvite } from '@/features/family/services/inviteService';
import { setStoredRole } from '@/features/auth/services/roleStorage';

export default function AcceptInviteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const token = useMemo(() => {
    const value = params.token;
    return Array.isArray(value) ? value[0] : value;
  }, [params.token]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await acceptFamilyInvite(token);
      await setStoredRole('family');
      Alert.alert('Joined', 'You have joined the family account.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to accept invite right now.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackHome = () => {
    router.replace('/(tabs)');
  };

  const missingToken = !token;

  return (
    <Container>
      <View className="flex-1 justify-center gap-8 px-2 lg:max-w-xl lg:self-center">
        <View className="gap-3">
          <Text className="text-center text-display font-semibold text-onSurface">
            Accept invitation
          </Text>
          <Text className="text-center text-body leading-relaxed text-onSurface/80">
            Confirm to join this family account. You need to be signed in with the correct email
            before accepting.
          </Text>
        </View>

        <View className="gap-3 rounded-3xl border border-primary/10 bg-white/90 p-5 shadow-sm">
          <Text className="text-body font-semibold text-onSurface">Invite token</Text>
          <Text selectable className="break-words text-body text-onSurface/90">
            {token || 'No token found in the link.'}
          </Text>
        </View>

        {error ? (
          <Text className="text-center text-body font-medium text-error">{error}</Text>
        ) : null}

        <View className="gap-4">
          <Button
            title={loading ? 'Joining…' : 'Accept invite'}
            onPress={handleAccept}
            disabled={missingToken || loading}
            className="h-14 rounded-full"
          />
          <Button
            title="Back to Home"
            onPress={handleBackHome}
            className="bg-onSurface/10 text-onSurface"
            textClassName="text-onSurface"
          />
        </View>
      </View>
    </Container>
  );
}
