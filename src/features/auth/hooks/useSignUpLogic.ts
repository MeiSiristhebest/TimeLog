import { useState } from 'react';
import { useRouter } from 'expo-router';
import { signUpWithEmailPassword } from '@/features/auth/services/authService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function useSignUpLogic() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError(t('Auth.signup.displayNameRequired', { defaultValue: 'Display name is required.' }));
      return;
    }
    if (trimmedName.length > 100) {
      setError(t('Auth.signup.displayNameTooLong', { defaultValue: 'Display name must be 100 characters or less.' }));
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t('Auth.upgrade.alertEmailRequired', { defaultValue: 'Email Required' }));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(t('Auth.upgrade.alertInvalidEmailMsg', { defaultValue: 'Please enter a valid email address' }));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('Auth.upgrade.alertPasswordMismatchMsg', { defaultValue: 'Passwords do not match.' }));
      return;
    }

    if (password.length < 6) {
      setError(t('Auth.upgrade.alertPasswordTooShortMsg', { defaultValue: 'Password must be at least 6 characters.' }));
      return;
    }

    if (password.length > 72) {
      setError(t('Auth.upgrade.alertPasswordTooLongMsg', { defaultValue: 'Password is too long.' }));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signUpWithEmailPassword(trimmedEmail, password, trimmedName);
      HeritageAlert.show({
        title: t('Auth.signup.successTitle', { defaultValue: 'Registration Successful' }),
        message: t('Auth.signup.successMsg', { defaultValue: 'Please check your email to verify your account.' }),
        variant: 'success',
        primaryAction: {
          label: t('Common.ok', { defaultValue: 'OK' }),
          onPress: () => router.replace(APP_ROUTES.LOGIN),
        },
      });
    } catch (err) {
      const friendly =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !email.trim() || !password || !confirmPassword || !displayName.trim() || loading;

  return {
    state: {
      email,
      password,
      confirmPassword,
      displayName,
      loading,
      error,
      isSubmitDisabled,
    },
    actions: {
      setEmail,
      setPassword,
      setConfirmPassword,
      setDisplayName,
      handleSignUp,
    },
  };
}
