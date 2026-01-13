import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { captureError, isSentryEnabled } from '@/lib/logger';
import { clearStoredRole } from '@/features/auth/services/roleStorage';
import { signOut } from '@/features/auth/services/authService';
import { signInTestUser, testSupabaseConnection } from '@/features/auth/services/supabaseTest';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { count } from 'drizzle-orm';

export default function SettingsTab() {
  const router = useRouter();
  const [manualToken, setManualToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleSendTestError = useCallback(() => {
    if (!isSentryEnabled()) {
      Alert.alert('Sentry disabled', 'Set EXPO_PUBLIC_SENTRY_DSN before sending test errors.');
      return;
    }

    captureError(new Error('Sentry test error from Settings tab'), { screen: 'settings' });
    Alert.alert('Sent', 'Test error dispatched to Sentry (check dashboard).');
  }, []);

  const handleTestSupabase = useCallback(async () => {
    try {
      const { profilesCount, sessionUserId } = await testSupabaseConnection();
      const userInfo = sessionUserId ? `User: ${sessionUserId}` : 'No session';
      Alert.alert('Supabase OK', `${userInfo}\nProfiles rows (self): ${profilesCount}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Supabase error', message);
    }
  }, []);

  const handleSignInTestUser = useCallback(async () => {
    try {
      const userId = await signInTestUser();
      Alert.alert('Signed in', userId ? `User: ${userId}` : 'Signed in (no user id)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Sign-in failed', message);
    }
  }, []);

  const handleSwitchRole = useCallback(async () => {
    await clearStoredRole();
    router.replace('/role');
  }, [router]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      Alert.alert('Signed out', 'You are now signed out.');
      router.replace('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Sign-out failed', message);
    }
  }, [router]);

  const handleVerifyRecordings = useCallback(async () => {
    try {
      const result = await db.select({ count: count() }).from(audioRecordings);
      const total = result[0]?.count ?? 0;
      Alert.alert('Audio DB Check', `Total local recordings: ${total}`);
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  }, []);

  const handleManualAcceptInvite = useCallback(() => {
    const token = manualToken.trim();
    if (!token) {
      Alert.alert('No token', 'Please paste the invite token or link first.');
      return;
    }
    // Extract token if user pasted full link
    const match = token.match(/token=([a-zA-Z0-9]+)/);
    const extractedToken = match ? match[1] : token;

    router.push(`/accept-invite?token=${encodeURIComponent(extractedToken)}`);
    setManualToken('');
    setShowTokenInput(false);
  }, [manualToken, router]);

  return (
    <Container>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-2">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-headline font-bold text-onSurface">Settings</Text>
          <Text className="text-center text-body text-onSurface">
            Account, device binding, and preferences will be configured here later.
          </Text>
          <Button title="Send test error to Sentry" onPress={handleSendTestError} />
          <Button title="Test Supabase connection" onPress={handleTestSupabase} />
          <Button title="Sign in test user" onPress={handleSignInTestUser} />
          <Button title="Verify Local Recordings (DB)" onPress={handleVerifyRecordings} />
          <Link href="/login" asChild>
            <Button title="Go to login screen" />
          </Link>
          <Link href="/invite" asChild>
            <Button title="Invite family member" />
          </Link>
          <Link href="/device-management" asChild>
            <Button title="Device management" />
          </Link>

          {/* Manual invite acceptance fallback */}
          <Button
            title={showTokenInput ? 'Hide token input' : 'Accept invite (manual)'}
            onPress={() => setShowTokenInput(!showTokenInput)}
            className="bg-primary/80"
          />
          {showTokenInput && (
            <View className="w-full gap-3 rounded-2xl border border-primary/20 bg-white/90 p-4">
              <Text className="text-body font-medium text-onSurface">
                Paste invite link or token:
              </Text>
              <TextInput
                value={manualToken}
                onChangeText={setManualToken}
                placeholder="timelog://accept-invite?token=... or just the token"
                placeholderTextColor="#C26B4A80"
                multiline
                className="min-h-[56px] w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-body text-onSurface"
              />
              <Button title="Accept invite" onPress={handleManualAcceptInvite} />
            </View>
          )}

          <Button
            title="Sign out"
            onPress={handleSignOut}
            className="bg-onSurface/10 text-onSurface"
          />
          <Button
            title="Switch role"
            onPress={handleSwitchRole}
            className="bg-onSurface/10 text-onSurface"
          />
        </View>
      </ScrollView>
    </Container>
  );
}
