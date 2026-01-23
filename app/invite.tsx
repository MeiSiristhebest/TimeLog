import { useState } from 'react';
import { View, Text, Share } from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { createFamilyInvite } from '@/features/family/services/inviteService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import { useHeritageTheme } from '@/theme/heritage';

export default function InviteScreen() {
  const theme = useHeritageTheme();
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleCreateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createFamilyInvite(email);
      setInviteLink(result.inviteLink ?? null);
      HeritageAlert.show({
        title: 'Invite Ready!',
        message: 'Tap "Share link" to send it to your family member.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create invite right now.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    try {
      await Share.share({
        message: `Join my family on TimeLog!\n\nCopy this entire message and open the TimeLog app to accept: ${inviteLink}`,
        url: inviteLink,
      });
    } catch {
      // User cancelled or share failed, ignore
    }
  };

  const handleOpen = async () => {
    if (!inviteLink) return;
    try {
      await Linking.openURL(inviteLink);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open the invite link.';
      HeritageAlert.show({
        title: 'Could Not Open',
        message: message,
        variant: 'error',
      });
    }
  };

  const isSubmitDisabled = !email.trim() || loading;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader
        title="Invite Family"
        showBack
        scrollY={scrollY}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
      />

      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: 100 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View className="flex-1 justify-center gap-8 lg:max-w-xl lg:self-center">
          <View className="gap-3">
            <Text
              className="text-center font-semibold"
              style={{
                fontSize: 28,
                color: theme.colors.onSurface,
                fontFamily: 'Fraunces_600SemiBold',
              }}
            >
              Invite a family member
            </Text>
            <Text
              className="text-center text-base leading-relaxed"
              style={{ color: `${theme.colors.onSurface}99` }}
            >
              Enter their email to generate a shareable link. They will join your family account
              after accepting the invite.
            </Text>
          </View>

          <View className="gap-6">
            <HeritageInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="sibling@example.com"
              leftIcon="mail-outline"
            />

            {error ? (
              <View
                className="p-3 rounded-lg flex-row items-center"
                style={{ backgroundColor: `${theme.colors.error}15` }}
              >
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <Text className="ml-2 flex-1" style={{ color: theme.colors.error }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <HeritageButton
              title={loading ? 'Generating...' : 'Generate Invite'}
              onPress={handleCreateInvite}
              disabled={isSubmitDisabled}
              loading={loading}
              variant="primary"
            />
          </View>

          {inviteLink ? (
            <View
              className="gap-4 rounded-3xl p-5 border shadow-sm"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
                shadowOpacity: 0.1,
                shadowRadius: 10,
              }}
            >
              <Text
                className="font-semibold text-lg"
                style={{ color: theme.colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}
              >
                Invite Ready
              </Text>

              <View
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: `${theme.colors.primary}08`,
                  borderColor: `${theme.colors.primary}20`,
                }}
              >
                <Text
                  selectable
                  className="font-mono text-sm"
                  style={{ color: theme.colors.onSurface }}
                >
                  {inviteLink}
                </Text>
              </View>

              {__DEV__ ? (
                <Text className="text-xs text-center" style={{ color: `${theme.colors.onSurface}60` }}>
                  Dev builds use the exp+timelog scheme. Open the link from another device or tap
                  “Open link” to test.
                </Text>
              ) : null}

              <View className="gap-3">
                <HeritageButton
                  title="Share Link"
                  onPress={handleShare}
                  variant="primary"
                  icon="share-outline"
                />
                <HeritageButton
                  title="Open Link"
                  onPress={handleOpen}
                  variant="outline"
                  icon="open-outline"
                />
              </View>
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
