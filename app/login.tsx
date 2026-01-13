import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { signInWithEmailPassword, sendResetEmail } from '@/features/auth/services/authService';

export default function LoginScreen() {
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
      router.replace('/(tabs)');
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
      Alert.alert('Reset email sent', 'Please check your inbox for the reset link.');
    } catch (err) {
      const friendly = err instanceof Error ? err.message : 'Unable to send reset email right now.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !email.trim() || !password || loading;

  return (
    <Container>
      <View className="flex-1 justify-center gap-10 px-2 lg:max-w-md lg:self-center">
        <View className="w-full gap-4">
          <Text className="text-center text-display font-medium text-primary">Welcome back</Text>
          <Text className="px-4 text-center text-body leading-relaxed text-onSurface opacity-80">
            Sign in with your family account to access TimeLog.
          </Text>
        </View>

        <View className="w-full gap-6">
          <View className="gap-2">
            <Text className="ml-2 text-body font-medium text-onSurface">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#C26B4A"
              className="min-h-[64px] w-full rounded-3xl border border-primary/20 bg-white/80 px-6 py-4 text-body text-onSurface"
            />
          </View>

          <View className="gap-2">
            <Text className="ml-2 text-body font-medium text-onSurface">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#C26B4A"
              className="min-h-[64px] w-full rounded-3xl border border-primary/20 bg-white/80 px-6 py-4 text-body text-onSurface"
            />
          </View>

          {error ? (
            <Text className="text-center text-body font-medium text-error">{error}</Text>
          ) : null}
          {message ? (
            <Text className="text-center text-body font-medium text-success">{message}</Text>
          ) : null}

          <View className="gap-4 pt-4">
            <Button
              title={loading ? 'Signing in…' : 'Sign in'}
              onPress={handleSignIn}
              disabled={isSubmitDisabled}
              className="h-16 rounded-full"
            />

            <Button
              title="Forgot Password?"
              onPress={handleResetPassword}
              disabled={!email.trim() || loading}
              className="min-h-[auto] bg-transparent py-2 shadow-none"
              textClassName="text-primary opacity-80"
            />
          </View>
        </View>

        <Link href="/(tabs)" asChild>
          <Button
            title="Back to Home"
            className="mt-4 bg-onSurface/5"
            textClassName="text-onSurface opacity-60"
          />
        </Link>
      </View>
    </Container>
  );
}
