import { useState } from 'react';
import { Alert, ScrollView, Share, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { createFamilyInvite } from '@/features/family/services/inviteService';

export default function InviteScreen() {
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createFamilyInvite(email);
      setInviteLink(result.inviteLink ?? null);
      Alert.alert('Invite ready', 'Tap "Share link" to send it to family.');
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
      Alert.alert('Open failed', message);
    }
  };

  const isSubmitDisabled = !email.trim() || loading;

  return (
    <Container>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-2">
        <View className="flex-1 justify-center gap-8 lg:max-w-xl lg:self-center">
          <View className="gap-3">
            <Text className="text-center text-display font-semibold text-onSurface">
              Invite a family member
            </Text>
            <Text className="text-center text-body leading-relaxed text-onSurface/80">
              Enter their email to generate a shareable link. They will join your family account
              after accepting the invite.
            </Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="ml-1 text-body font-medium text-onSurface">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="sibling@example.com"
                placeholderTextColor="#C26B4A"
                className="min-h-[56px] w-full rounded-2xl border border-primary/20 bg-white/90 px-5 py-3 text-body text-onSurface"
              />
            </View>

            {error ? <Text className="text-body font-medium text-error">{error}</Text> : null}

            <Button
              title={loading ? 'Generating…' : 'Generate invite'}
              onPress={handleCreateInvite}
              disabled={isSubmitDisabled}
              className="h-14 rounded-full"
            />
          </View>

          {inviteLink ? (
            <View className="gap-3 rounded-3xl border border-primary/10 bg-white/90 p-5 shadow-sm">
              <Text className="text-body font-semibold text-onSurface">Invite link</Text>
              <Text selectable className="break-words text-body text-onSurface/90">
                {inviteLink}
              </Text>
              {__DEV__ ? (
                <Text className="text-body text-onSurface/60">
                  Dev builds use the exp+timelog scheme. Open the link from another device or tap
                  “Open link” to test.
                </Text>
              ) : null}
              <View className="gap-3">
                <Button title="Share link" onPress={handleShare} />
                <Button
                  title="Open link"
                  onPress={handleOpen}
                  className="bg-onSurface/10 text-onSurface"
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Container>
  );
}
