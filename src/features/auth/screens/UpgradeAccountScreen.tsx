/**
 * Account Upgrade Screen
 *
 * Shown to family members after accepting a device code from an anonymous storyteller.
 * Allows setting up email/password to upgrade anonymous account to permanent.
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';
import { upgradeAnonymousAccount } from '@/features/auth/services/anonymousAuthService';
import { devLog } from '@/lib/devLogger';

export default function UpgradeAccountScreen(): JSX.Element {
  const theme = useHeritageTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const storytellerName = typeof params.name === 'string' ? params.name : 'your loved one';
  const nextParam = typeof params.next === 'string' ? params.next : null;
  const nextRoute = nextParam ? decodeURIComponent(nextParam) : '/(tabs)';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(storytellerName);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = useCallback(async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      HeritageAlert.show({
        title: 'Email Required',
        message: 'Please enter an email address',
        variant: 'warning',
      });
      return;
    }

    if (!trimmedPassword) {
      HeritageAlert.show({
        title: 'Password Required',
        message: 'Please enter a password',
        variant: 'warning',
      });
      return;
    }

    if (password !== confirmPassword) {
      HeritageAlert.show({
        title: "Passwords Don't Match",
        message: 'Please make sure both passwords are the same',
        variant: 'warning',
      });
      return;
    }

    if (trimmedPassword.length < 6) {
      HeritageAlert.show({
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters',
        variant: 'warning',
      });
      return;
    }

    setIsUpgrading(true);

    try {
      const { recoveryCode } = await upgradeAnonymousAccount(
        trimmedEmail,
        trimmedPassword,
        displayName
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const message = recoveryCode
        ? `${displayName}'s account has been set up successfully!\n\n` +
          `Recovery Code:\n${recoveryCode}\n\n` +
          'IMPORTANT: Save this code in a safe place. You can use it to login on other devices or if you forget your password.'
        : `${displayName}'s account has been set up successfully!`;

      HeritageAlert.show({
        title: 'Account Created!',
        message,
        variant: 'success',
        primaryAction: {
          label: recoveryCode ? "I've Saved It" : 'Continue',
          onPress: () => {
            router.replace(nextRoute as Href);
          },
        },
      });
    } catch (error) {
      devLog.error('[UpgradeAccountScreen] Upgrade failed:', error);
      HeritageAlert.show({
        title: 'Upgrade Failed',
        message:
          error instanceof Error ? error.message : 'Failed to upgrade account. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsUpgrading(false);
    }
  }, [confirmPassword, displayName, email, nextRoute, password, router]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader title="Setup Account" showBack />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.infoCard, { backgroundColor: `${theme.colors.primary}08` }]}>
          <Ionicons name="person-circle" size={48} color={theme.colors.primary} />
          <AppText style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
            Complete Account Setup
          </AppText>
          <AppText style={[styles.infoText, { color: theme.colors.textMuted }]}>
            Set up an email and password to secure this account. This will allow logging in on other
            devices and prevent data loss.
          </AppText>
        </View>

        <View style={styles.form}>
          <HeritageInput
            label="Display Name"
            placeholder="Enter name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />

          <HeritageInput
            label="Email"
            placeholder="elder@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <HeritageInput
            label="Password"
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />

          <HeritageInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
          />
        </View>

        <View style={[styles.warningBox, { backgroundColor: `${theme.colors.warning}15` }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
          <AppText style={[styles.warningText, { color: theme.colors.warning }]}>
            Make sure to save these credentials securely. They will be needed to login on other
            devices.
          </AppText>
        </View>

        <HeritageButton
          title={isUpgrading ? 'Creating Account...' : 'Complete Setup'}
          icon="checkmark-circle"
          variant="primary"
          fullWidth
          onPress={handleUpgrade}
          disabled={isUpgrading}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 16,
  },
  infoCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 22,
    fontFamily: 'Fraunces_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginBottom: 40,
  },
});
