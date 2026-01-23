import { useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '@/components/ui/Container';
import { signInWithEmailPassword, sendResetEmail } from '@/features/auth/services/authService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { colors, radius, spacing } = useHeritageTheme();

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
      HeritageAlert.show({
        title: 'Check Your Email',
        message: 'We\'ve sent you a password reset link.',
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

  return (
    <Container>
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={[styles.logoContainer, {
              backgroundColor: `${colors.primary}15`,
              borderColor: `${colors.primary}25`,
            }]}
          >
            <Ionicons name="book" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sign in to continue your story journey.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.handle}
              accessibilityLabel="Email Address"
              accessibilityHint="Please enter your email address"
              style={[styles.input, {
                backgroundColor: colors.surface,
                borderColor: `${colors.primary}30`,
                color: colors.onSurface,
              }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.handle}
              accessibilityLabel="Password"
              accessibilityHint="Please enter your password"
              style={[styles.input, {
                backgroundColor: colors.surface,
                borderColor: `${colors.primary}30`,
                color: colors.onSurface,
              }]}
            />
          </View>

          {error ? (
            <Text style={[styles.message, { color: colors.error }]}>{error}</Text>
          ) : null}
          {message ? (
            <Text style={[styles.message, { color: colors.success }]}>{message}</Text>
          ) : null}

          <View style={styles.buttons}>
            <HeritageButton
              title={loading ? 'Signing in…' : 'Sign in'}
              onPress={handleSignIn}
              disabled={isSubmitDisabled}
              variant="primary"
            />

            <HeritageButton
              title="Forgot Password?"
              onPress={handleResetPassword}
              disabled={!email.trim() || loading}
              variant="ghost"
            />
          </View>
        </View>

        <Link href="/(tabs)" asChild>
          <HeritageButton
            title="Back to Home"
            variant="secondary"
            onPress={() => { }}
          />
        </Link>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontFamily: 'Fraunces_600SemiBold',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  form: {
    width: '100%',
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    minHeight: 64,
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
  buttons: {
    gap: 16,
    paddingTop: 16,
  },
});

