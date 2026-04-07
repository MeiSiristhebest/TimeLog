import { Link } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { ZoomIn, FadeInDown } from 'react-native-reanimated';
import { Container } from '@/components/ui/Container';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import { useHeritageTheme } from '@/theme/heritage';
import { useLoginLogic } from '@/features/auth/hooks/useLoginLogic';
import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet } from 'react-native';

export default function LoginScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useLoginLogic();
  const { email, password, loading, message, error, isSubmitDisabled, isResetDisabled } = state;

  return (
    <Container>
      <View style={styles.mainContainer}>
        <View style={styles.headerSection}>
          <Animated.View
            entering={ZoomIn.delay(300).springify()}
            style={[
              styles.iconWrapper,
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}25`,
              },
            ]}>
            <Ionicons name="book" size={40} color={colors.primary} />
          </Animated.View>
          <AppText
            style={[styles.title, { color: colors.onSurface }]}>
            Welcome Back
          </AppText>
          <AppText
            style={[styles.subtitle, { color: colors.textMuted }]}>
            Sign in to continue your story journey.
          </AppText>
        </View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.formSection}>
          <View style={styles.inputGap}>
            <HeritageInput
              label="Email Address"
              value={email}
              onChangeText={actions.setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              accessibilityLabel="Email Address"
              accessibilityHint="Please enter your email address"
              leftIcon="mail-outline"
            />
          </View>

          <View style={styles.inputGap}>
            <HeritageInput
              label="Password"
              value={password}
              onChangeText={actions.setPassword}
              secureTextEntry
              placeholder="••••••••"
              accessibilityLabel="Password"
              accessibilityHint="Please enter your password"
              leftIcon="lock-closed-outline"
              showPasswordToggle
            />
          </View>

          {error ? (
            <AppText style={[styles.statusText, { color: colors.error }]}>
              {error}
            </AppText>
          ) : null}
          {message ? (
            <AppText style={[styles.statusText, { color: colors.success }]}>
              {message}
            </AppText>
          ) : null}

          <View style={styles.buttonSection}>
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
        </Animated.View>

        <Link href="/(tabs)" asChild>
          <HeritageButton title="Back to Home" variant="secondary" onPress={() => {}} />
        </Link>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 24,
  },
  headerSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    marginBottom: 16,
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
  },
  title: {
    textAlign: 'center',
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    fontWeight: '600',
  },
  subtitle: {
    paddingHorizontal: 32,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  formSection: {
    width: '100%',
    gap: 16,
  },
  inputGap: {
    gap: 8,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonSection: {
    gap: 16,
    paddingTop: 16,
  },
});
