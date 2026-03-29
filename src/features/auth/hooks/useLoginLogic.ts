import { useState } from 'react';
import { useRouter } from 'expo-router';
import { signInWithEmailPassword, sendResetEmail } from '@/features/auth/services/authService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { APP_ROUTES } from '@/features/app/navigation/routes';

export function useLoginLogic() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await signInWithEmailPassword(email, password);
      setMessage('Login successful.');
      router.replace(APP_ROUTES.FAMILY_TAB);
    } catch (err) {
      const friendly =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendResetEmail(email);
      setMessage('Password reset email sent. Check your inbox.');
      HeritageAlert.show({
        title: 'Check Your Email',
        message: "We've sent you a password reset link.",
        variant: 'success',
      });
    } catch (err) {
      const friendly = err instanceof Error ? err.message : 'Unable to send reset email right now.';
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
