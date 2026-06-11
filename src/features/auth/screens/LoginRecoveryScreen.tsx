import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Ionicons } from '@/components/ui/Icon';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { supabase } from '@/lib/supabase';
import { signInWithEmailPassword } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { setStoredRole } from '../services/roleStorage';
import * as Haptics from 'expo-haptics';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginRecoveryScreen(): JSX.Element {
  const { t } = useTranslation();
  const theme = useHeritageTheme();
  const router = useRouter();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanCode) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertEmailRequired', { defaultValue: 'Required Field' }),
        message: t('Auth.loginRecovery.codeLabel'),
        variant: 'warning',
      });
      return;
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertInvalidEmail'),
        message: t('Auth.upgrade.alertInvalidEmailMsg'),
        variant: 'warning',
      });
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertPasswordTooShort'),
        message: t('Auth.upgrade.alertPasswordTooShortMsg'),
        variant: 'warning',
      });
      return;
    }

    if (cleanPassword.length > 72) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertPasswordTooLong', { defaultValue: 'Password Too Long' }),
        message: t('Auth.upgrade.alertPasswordTooLongMsg', { defaultValue: 'Password must be 72 characters or less' }),
        variant: 'warning',
      });
      return;
    }

    if (password !== confirmPassword) {
      HeritageAlert.show({
        title: t('Auth.upgrade.alertPasswordMismatch'),
        message: t('Auth.upgrade.alertPasswordMismatchMsg'),
        variant: 'warning',
      });
      return;
    }

    setLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      devLog.info('[LoginRecoveryScreen] Calling RPC recover_account_with_code for:', cleanCode);
      const { data, error } = await supabase.rpc('recover_account_with_code', {
        p_code: cleanCode,
        p_email: cleanEmail,
        p_password: cleanPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(t('Auth.loginRecovery.errorInvalid'));
      }

      // Success! Credentials updated in auth.users. Now sign in.
      devLog.info('[LoginRecoveryScreen] RPC success, logging in...');
      const user = await signInWithEmailPassword(cleanEmail, cleanPassword);

      if (user) {
        setAuthenticated(user.id);
        await setStoredRole('storyteller');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        HeritageAlert.show({
          title: t('Auth.loginRecovery.successTitle'),
          message: t('Auth.loginRecovery.successMsg'),
          variant: 'success',
          primaryAction: {
            label: t('Auth.upgrade.alertGotIt'),
            onPress: () => {
              router.replace(APP_ROUTES.TABS);
            },
          },
        });
      } else {
        throw new Error('Failed to start session after recovery.');
      }
    } catch (error) {
      devLog.error('[LoginRecoveryScreen] Recovery failed:', error);
      HeritageAlert.show({
        title: t('Auth.upgrade.alertFailedTitle'),
        message: error instanceof Error ? error.message : t('Auth.upgrade.alertFailedDefault'),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader title={t('Auth.loginRecovery.title')} showBack />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.infoCard, { backgroundColor: `${theme.colors.primary}08` }]}>
          <Ionicons name="key" size={48} color={theme.colors.primary} />
          <AppText style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
            {t('Auth.loginRecovery.title')}
          </AppText>
          <AppText style={[styles.infoText, { color: theme.colors.textMuted }]}>
            {t('Auth.loginRecovery.warning')}
          </AppText>
        </View>

        <View style={styles.form}>
          <HeritageInput
            label={t('Auth.loginRecovery.codeLabel')}
            placeholder={t('Auth.loginRecovery.codePlaceholder')}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            leftIcon="key-outline"
            maxLength={24}
          />

          <HeritageInput
            label={t('Auth.loginRecovery.emailLabel')}
            placeholder={t('Auth.loginRecovery.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            maxLength={255}
          />

          <HeritageInput
            label={t('Auth.loginRecovery.passwordLabel')}
            placeholder={t('Auth.loginRecovery.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
            showPasswordToggle
            maxLength={72}
          />

          <HeritageInput
            label={t('Auth.loginRecovery.confirmPasswordLabel')}
            placeholder={t('Auth.loginRecovery.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon="shield-checkmark-outline"
            showPasswordToggle
            maxLength={72}
          />
        </View>

        <HeritageButton
          title={loading ? t('Auth.role.loading') : t('Auth.loginRecovery.buttonLabel')}
          icon="checkmark-circle"
          variant="primary"
          fullWidth
          onPress={handleRecover}
          disabled={loading}
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
    marginBottom: 32,
  },
  button: {
    marginBottom: 40,
  },
});
