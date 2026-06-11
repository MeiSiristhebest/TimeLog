import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { signInWithEmailPassword, sendResetEmail } from '@/features/auth/services/authService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { supabase } from '@/lib/supabase';
import { addRememberedAccount, saveSessionTokens } from '../services/rememberedAccountsService';

export function useLoginLogic() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { t } = useTranslation();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.email) {
      setEmail(decodeURIComponent(params.email));
    }
  }, [params.email]);

  const handleSignIn = async () => {
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
    setMessage('');
    try {
      const user = await signInWithEmailPassword(trimmedEmail, password);
      if (user) {
        setAuthenticated(user.id);
        
        // Cache user credentials for Switch Account
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (session) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, role')
            .eq('id', user.id)
            .single();

          addRememberedAccount({
            userId: user.id,
            email: user.email,
            displayName: profileData?.display_name || undefined,
            role: profileData?.role || 'storyteller',
            isAnonymous: false,
          });

          await saveSessionTokens(user.id, {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          });
        }
      }
      setMessage(t('Auth.login.success', { defaultValue: 'Login successful.' }));
      router.replace(APP_ROUTES.TABS);
    } catch (err) {
      const friendly =
        err instanceof Error ? err.message : t('Auth.login.error', { defaultValue: 'Something went wrong. Please try again.' });
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
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

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendResetEmail(trimmedEmail);
      setMessage(t('Auth.login.resetSuccess', { defaultValue: 'Password reset email sent. Check your inbox.' }));
      HeritageAlert.show({
        title: t('Auth.login.resetSuccess', { defaultValue: 'Check Your Email' }),
        message: t('Auth.login.resetSuccessMsg', { defaultValue: "We've sent you a password reset link." }),
        variant: 'success',
      });
    } catch (err) {
      const friendly = err instanceof Error ? err.message : t('Auth.login.resetError', { defaultValue: 'Unable to send reset email right now.' });
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !email.trim() || !password || loading;
  const isResetDisabled = !email.trim() || loading;

  return {
    state: {
      email,
      password,
      loading,
      message,
      error,
      isSubmitDisabled,
      isResetDisabled,
    },
    actions: {
      setEmail,
      setPassword,
      handleSignIn,
      handleResetPassword,
    },
  };
}
