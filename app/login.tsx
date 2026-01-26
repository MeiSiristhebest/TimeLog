import { AppText } from '@/components/ui/AppText';
import { TextInput, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';

import { Container } from '@/components/ui/Container';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { useLoginLogic } from '@/features/auth/hooks/useLoginLogic';

export default function LoginScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useLoginLogic();
  const { email, password, loading, message, error, isSubmitDisabled, isResetDisabled } = state;

  return (
    <Container>
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.logoContainer,
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}25`,
              },
            ]}>
            <Ionicons name="book" size={40} color={colors.primary} />
          </View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>Welcome Back</AppText>
          <AppText style={[styles.subtitle, { color: colors.textMuted }]}>
            Sign in to continue your story journey.
          </AppText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <AppText style={[styles.label, { color: colors.onSurface }]}>Email</AppText>
            <TextInput
              value={email}
              onChangeText={actions.setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.handle}
              accessibilityLabel="Email Address"
              accessibilityHint="Please enter your email address"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: `${colors.primary}30`,
                  color: colors.onSurface,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={[styles.label, { color: colors.onSurface }]}>Password</AppText>
            <TextInput
              value={password}
              onChangeText={actions.setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.handle}
              accessibilityLabel="Password"
              accessibilityHint="Please enter your password"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: `${colors.primary}30`,
                  color: colors.onSurface,
                },
              ]}
            />
          </View>

          {error ? (
            <AppText style={[styles.message, { color: colors.error }]}>{error}</AppText>
          ) : null}
          {message ? (
            <AppText style={[styles.message, { color: colors.success }]}>{message}</AppText>
          ) : null}

          <View style={styles.buttons}>
            <HeritageButton
              title={loading ? 'Signing in…' : 'Sign in'}
              onPress={actions.handleSignIn}
              disabled={isSubmitDisabled}
              variant="primary"
            />

            <HeritageButton
              title="Forgot Password?"
              onPress={actions.handleResetPassword}
              disabled={isResetDisabled}
              variant="ghost"
            />
          </View>
        </View>

        <Link href="/(tabs)" asChild>
          <HeritageButton title="Back to Home" variant="secondary" onPress={() => {}} />
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
