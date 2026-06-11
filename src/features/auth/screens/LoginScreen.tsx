import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { ZoomIn, FadeInDown } from 'react-native-reanimated';
import { Container } from '@/components/ui/Container';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import { useHeritageTheme } from '@/theme/heritage';
import { useLoginLogic } from '@/features/auth/hooks/useLoginLogic';
import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet, Pressable } from 'react-native';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function LoginScreen(): JSX.Element {
  const { t } = useTranslation();
  const { colors } = useHeritageTheme();
  const router = useRouter();

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
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('Auth.login.title', { defaultValue: 'Welcome Back' })}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('Auth.login.subtitle', { defaultValue: 'Sign in to continue your story journey.' })}
          </AppText>
        </View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.formSection}>
          <View style={styles.inputGap}>
            <HeritageInput
              label={t('Auth.login.email', { defaultValue: 'Email Address' })}
              value={email}
              onChangeText={actions.setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t('Auth.login.emailPlaceholder', { defaultValue: 'you@example.com' })}
              accessibilityLabel={t('Auth.login.email', { defaultValue: 'Email Address' })}
              accessibilityHint={t('Auth.login.emailAccessibilityHint', { defaultValue: 'Please enter your email address' })}
              leftIcon="mail-outline"
              maxLength={255}
            />
          </View>

          <View style={styles.inputGap}>
            <HeritageInput
              label={t('Auth.login.password', { defaultValue: 'Password' })}
              value={password}
              onChangeText={actions.setPassword}
              secureTextEntry
              placeholder={t('Auth.login.passwordPlaceholder', { defaultValue: '••••••••' })}
              accessibilityLabel={t('Auth.login.password', { defaultValue: 'Password' })}
              accessibilityHint={t('Auth.login.passwordAccessibilityHint', { defaultValue: 'Please enter your password' })}
              leftIcon="lock-closed-outline"
              showPasswordToggle
              maxLength={72}
            />
          </View>

          {error ? (
            <AppText style={[styles.statusText, { color: colors.error }]}>{error}</AppText>
          ) : null}
          {message ? (
            <AppText style={[styles.statusText, { color: colors.success }]}>{message}</AppText>
          ) : null}

          <View style={styles.buttonSection}>
            <HeritageButton
              title={loading ? t('Auth.login.signingIn', { defaultValue: 'Signing in...' }) : t('Auth.login.signIn', { defaultValue: 'Sign in' })}
              onPress={actions.handleSignIn}
              disabled={isSubmitDisabled}
              variant="primary"
            />

            <View style={styles.signUpLinkSection}>
              <AppText style={{ color: colors.textMuted, fontSize: 16 }}>
                {t('Auth.login.noAccount', { defaultValue: "Don't have an account? " })}
              </AppText>
              <Pressable onPress={() => router.push(APP_ROUTES.SIGNUP)}>
                <AppText style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
                  {t('Auth.login.signUp', { defaultValue: 'Sign Up' })}
                </AppText>
              </Pressable>
            </View>

            <HeritageButton
              title={t('Auth.loginRecovery.loginWithRecovery', { defaultValue: 'Login with Recovery Code' })}
              onPress={() => router.push(APP_ROUTES.LOGIN_RECOVERY)}
              variant="secondary"
            />

            <HeritageButton
              title={t('Auth.login.forgotPassword', { defaultValue: 'Forgot Password?' })}
              onPress={actions.handleResetPassword}
              disabled={isResetDisabled}
              variant="ghost"
            />
          </View>
        </Animated.View>

        <Link href={APP_ROUTES.TABS} asChild>
          <HeritageButton title={t('Auth.login.backToHome', { defaultValue: 'Back to Home' })} variant="secondary" onPress={() => {}} />
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
  signUpLinkSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
});
