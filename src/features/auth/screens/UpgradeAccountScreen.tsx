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
import { useTranslation } from '@/lib/i18n/useTranslation';
import { supabase } from '@/lib/supabase';
import { addRememberedAccount, saveSessionTokens } from '../services/rememberedAccountsService';

/**
 * Validates email address format.
 */
const isValidEmailCase = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function UpgradeAccountScreen(): JSX.Element {
  const { t } = useTranslation();
  const theme = useHeritageTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const storytellerName = typeof params.name === 'string' ? params.name : t('Auth.upgrade.lovedOne', { defaultValue: 'your loved one' });
  const nextParam = typeof params.next === 'string' ? params.next : null;
  const nextRoute = nextParam ? decodeURIComponent(nextParam) : '/(tabs)';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(storytellerName);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = useCallback(async () => {
    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedDisplayName) {
      HeritageAlert.show({
        title: t('Auth.signup.displayNameRequired', { defaultValue: 'Name Required' }),
        message: t('Auth.upgrade.displayNamePlaceholder', { defaultValue: 'Please enter a name' }),
        variant: 'warning',
      });
      return;
    }

    if (trimmedDisplayName.length > 100) {
      HeritageAlert.show({
        title: t('Auth.signup.displayNameTooLong', { defaultValue: 'Name Too Long' }),
        message: t('Auth.signup.displayNameTooLong', { defaultValue: 'Display name must be 100 characters or less.' }),
        variant: 'warning',
      });
      return;
    }

    if (!trimmedEmail) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertEmailRequired', { defaultValue: 'Email Required' }),
        message: t('Auth.upgrade.alertEmailRequiredMsg', { defaultValue: 'Please enter an email address' }),
        variant: 'warning',
      });
      return;
    }

    if (!isValidEmailCase(trimmedEmail)) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertInvalidEmail', { defaultValue: 'Invalid Email' }),
        message: t('Auth.upgrade.alertInvalidEmailMsg', { defaultValue: 'Please enter a valid email address (e.g., name@example.com)' }),
        variant: 'warning',
      });
      return;
    }

    if (!trimmedPassword) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertPasswordRequired', { defaultValue: 'Password Required' }),
        message: t('Auth.upgrade.alertPasswordRequiredMsg', { defaultValue: 'Please enter a password' }),
        variant: 'warning',
      });
      return;
    }

    if (password !== confirmPassword) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertPasswordMismatch', { defaultValue: "Passwords Don't Match" }),
        message: t('Auth.upgrade.alertPasswordMismatchMsg', { defaultValue: 'Please make sure both passwords are the same' }),
        variant: 'warning',
      });
      return;
    }

    if (trimmedPassword.length < 6) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertPasswordTooShort', { defaultValue: 'Password Too Short' }),
        message: t('Auth.upgrade.alertPasswordTooShortMsg', { defaultValue: 'Password must be at least 6 characters' }),
        variant: 'warning',
      });
      return;
    }

    if (trimmedPassword.length > 72) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertPasswordTooLong', { defaultValue: 'Password Too Long' }),
        message: t('Auth.upgrade.alertPasswordTooLongMsg', { defaultValue: 'Password must be 72 characters or less' }),
        variant: 'warning',
      });
      return;
    }

    setIsUpgrading(true);

    try {
      const { recoveryCode } = await upgradeAnonymousAccount(
        trimmedEmail,
        trimmedPassword,
        trimmedDisplayName
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Cache the upgraded account details for Switch Account
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (session) {
        addRememberedAccount({
          userId: session.user.id,
          email: trimmedEmail,
          displayName: trimmedDisplayName,
          role: 'storyteller',
          isAnonymous: false,
        });
        await saveSessionTokens(session.user.id, {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        });
      }

      const message = recoveryCode
        ? t('Auth.upgrade.alertCreatedWithRecovery', {
            name: trimmedDisplayName,
            recoveryCode,
            defaultValue: `${trimmedDisplayName}'s account has been created!\n\nRecovery Code:\n${recoveryCode}\n\nIMPORTANT: Save this code in a safe place. You will need it if you forget your password.\n\nNext Step: We have sent a confirmation link to your email. Please check your inbox (and spam folder) and click the link to verify your account.`
          })
        : t('Auth.upgrade.alertCreatedNoRecovery', {
            name: trimmedDisplayName,
            defaultValue: `${trimmedDisplayName}'s account has been created!\n\nNext Step: We have sent a confirmation link to your email. Please check your inbox (and spam folder) and click the link to verify your account.`
          });

      HeritageAlert.show({
        title: t('Auth.upgrade.alertCreatedTitle', { defaultValue: 'Account Created!' }),
        message,
        variant: 'success',
        primaryAction: {
          label: t('Auth.upgrade.alertGotIt', { defaultValue: 'Got it, Continue' }),
          onPress: () => {
            router.replace(nextRoute as Href);
          },
        },
      });
    } catch (error) {
      devLog.error('[UpgradeAccountScreen] Upgrade failed:', error);
      HeritageAlert.show({
        title: t('Auth.upgrade.alertFailedTitle', { defaultValue: 'Upgrade Failed' }),
        message:
          error instanceof Error ? error.message : t('Auth.upgrade.alertFailedDefault', { defaultValue: 'Failed to upgrade account. Please try again.' }),
        variant: 'error',
      });
    } finally {
      setIsUpgrading(false);
    }
  }, [confirmPassword, displayName, email, nextRoute, password, router, t]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader title={t('Auth.upgrade.title', { defaultValue: 'Setup Account' })} showBack />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.infoCard, { backgroundColor: `${theme.colors.primary}08` }]}>
          <Ionicons name="person-circle" size={48} color={theme.colors.primary} />
          <AppText style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
            {t('Auth.upgrade.header', { defaultValue: 'Complete Account Setup' })}
          </AppText>
          <AppText style={[styles.infoText, { color: theme.colors.textMuted }]}>
            {t('Auth.upgrade.description', { defaultValue: 'Set up an email and password to secure this account. This will allow logging in on other devices and prevent data loss.' })}
          </AppText>
        </View>

        <View style={styles.form}>
          <HeritageInput
            label={t('Auth.upgrade.displayName', { defaultValue: 'Display Name' })}
            placeholder={t('Auth.upgrade.displayNamePlaceholder', { defaultValue: 'Enter name' })}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            leftIcon="person-outline"
            maxLength={100}
          />

          <HeritageInput
            label={t('Auth.upgrade.email', { defaultValue: 'Email Address' })}
            placeholder={t('Auth.upgrade.emailPlaceholder', { defaultValue: 'elder@example.com' })}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon="mail-outline"
            maxLength={255}
          />

          <HeritageInput
            label={t('Auth.upgrade.password', { defaultValue: 'Create Password' })}
            placeholder={t('Auth.upgrade.passwordPlaceholder', { defaultValue: 'Minimum 6 characters' })}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            leftIcon="lock-closed-outline"
            showPasswordToggle
            maxLength={72}
          />

          <HeritageInput
            label={t('Auth.upgrade.confirmPassword', { defaultValue: 'Confirm Password' })}
            placeholder={t('Auth.upgrade.confirmPasswordPlaceholder', { defaultValue: 'Re-enter password' })}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
            leftIcon="shield-checkmark-outline"
            showPasswordToggle
            maxLength={72}
          />
        </View>

        <View style={[styles.warningBox, { backgroundColor: `${theme.colors.warning}15` }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
          <AppText style={[styles.warningText, { color: theme.colors.warning }]}>
            {t('Auth.upgrade.warning', { defaultValue: 'Make sure to save these credentials securely. They will be needed to login on other devices.' })}
          </AppText>
        </View>

        <HeritageButton
          title={isUpgrading ? t('Auth.upgrade.creating', { defaultValue: 'Creating Account...' }) : t('Auth.upgrade.complete', { defaultValue: 'Complete Setup' })}
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
