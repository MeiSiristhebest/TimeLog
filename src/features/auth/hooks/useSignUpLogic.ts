import { useState } from 'react';
import { useRouter } from 'expo-router';
import { signUpWithEmailPassword } from '@/features/auth/services/authService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { APP_ROUTES } from '@/features/app/navigation/routes';

export function useSignUpLogic() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signUpWithEmailPassword(email, password, displayName);
      HeritageAlert.show({
        title: 'Registration Successful',
        message: 'Please check your email to verify your account.',
        variant: 'success',
        primaryAction: {
          label: 'OK',
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
