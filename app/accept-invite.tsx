import { useMemo, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { acceptFamilyInvite } from '@/features/family/services/inviteService';
import { setStoredRole } from '@/features/auth/services/roleStorage';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';

export default function AcceptInviteScreen() {
  const theme = useHeritageTheme();
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
      HeritageAlert.show({
        title: 'Welcome!',
        message: 'You have successfully joined the family account.',
        variant: 'success',
        primaryAction: {
          label: 'Continue',
          onPress: () => router.replace('/(tabs)'),
        },
      });
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
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader
        title="Join Family"
        showBack={false}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 60 }}>
        <View style={{ gap: 32, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
          {/* Header Text */}
          <View style={{ gap: 12 }}>
            <Text style={{ textAlign: 'center', fontSize: 32, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface }}>
              Accept Invitation
            </Text>
            <Text style={{ textAlign: 'center', fontSize: 16, lineHeight: 24, color: theme.colors.textMuted, paddingHorizontal: 16 }}>
              Confirm to join this family account. You need to be signed in with the correct email before accepting.
            </Text>
          </View>

          {/* Token Card */}
          <View style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceDim,
            padding: 24,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
            gap: 12
          }}>
            <Text style={{ fontSize: 16, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface }}>
              Invite Token
            </Text>
            <View style={{
              backgroundColor: `${theme.colors.primary}08`,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${theme.colors.primary}15`,
              padding: 16
            }}>
              <Text selectable style={{ fontFamily: 'System', fontSize: 14, color: theme.colors.onSurface }}>
                {token || 'No token found in the link.'}
              </Text>
            </View>
          </View>

          {error ? (
            <Text style={{ textAlign: 'center', fontSize: 15, fontWeight: '500', color: theme.colors.error }}>
              {error}
            </Text>
          ) : null}

          {/* Actions */}
          <View style={{ gap: 16 }}>
            <HeritageButton
              title={loading ? 'Joining…' : 'Accept Invite'}
              onPress={handleAccept}
              disabled={missingToken || loading}
              variant="primary"
              size="large"
              fullWidth
            />
            <HeritageButton
              title="Go to Home"
              onPress={handleBackHome}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
