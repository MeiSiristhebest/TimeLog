import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { FadeInDown } from 'react-native-reanimated';
import { Container } from '@/components/ui/Container';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import { useHeritageTheme } from '@/theme/heritage';
import { useSignUpLogic } from '@/features/auth/hooks/useSignUpLogic';
import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function SignUpScreen(): JSX.Element {
  const { t } = useTranslation();
  const { colors } = useHeritageTheme();
  const router = useRouter();

  // Logic Separation
  const { state, actions } = useSignUpLogic();
  const { email, password, confirmPassword, displayName, loading, error, isSubmitDisabled } = state;

  return (
    <Container>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            style={[
              styles.iconWrapper,
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}25`,
              },
            ]}>
            <Ionicons name="person-add" size={40} color={colors.primary} />
          </Animated.View>
          <AppText
            style={[styles.title, { color: colors.onSurface }]}>
            {t('Auth.signup.title', { defaultValue: 'Create Account' })}
          </AppText>
          <AppText
            style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('Auth.signup.subtitle', { defaultValue: 'Join TimeLog to preserve your family legacy.' })}
          </AppText>
        </View>

        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formSection}>
          <View style={styles.inputGap}>
            <HeritageInput
              label={t('Auth.signup.displayName', { defaultValue: 'Display Name' })}
              value={displayName}
              onChangeText={actions.setDisplayName}
              autoCapitalize="words"
              placeholder={t('Auth.signup.displayNamePlaceholder', { defaultValue: 'Your Name' })}
              leftIcon="person-outline"
            />
          </View>

          <View style={styles.inputGap}>
            <HeritageInput
              label={t('Auth.signup.email', { defaultValue: 'Email Address' })}
              value={email}
              onChangeText={actions.setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t('Auth.signup.emailPlaceholder', { defaultValue: 'you@example.com' })}
              leftIcon="mail-outline"
            />
          </View>

          <View style={styles.inputGap}>
            <HeritageInput
              label={t('Auth.signup.password', { defaultValue: 'Password' })}
              value={password}
              onChangeText={actions.setPassword}
              secureTextEntry
              placeholder={t('Auth.signup.passwordPlaceholder', { defaultValue: '••••••••' })}
              leftIcon="lock-closed-outline"
              showPasswordToggle
            />
          </View>

          <View style={styles.inputGap}>
            <HeritageInput
              label={t('Auth.signup.confirmPassword', { defaultValue: 'Confirm Password' })}
              value={confirmPassword}
              onChangeText={actions.setConfirmPassword}
              secureTextEntry
              placeholder={t('Auth.signup.confirmPasswordPlaceholder', { defaultValue: '••••••••' })}
              leftIcon="shield-checkmark-outline"
              showPasswordToggle
            />
          </View>

          {error ? (
            <AppText style={[styles.statusText, { color: colors.error }]}>
              {error}
            </AppText>
          ) : null}

          <View style={styles.buttonSection}>
            <HeritageButton
              title={loading ? t('Auth.signup.creating', { defaultValue: 'Creating Account...' }) : t('Auth.signup.signUp', { defaultValue: 'Sign Up' })}
              onPress={actions.handleSignUp}
              disabled={isSubmitDisabled}
              variant="primary"
            />

            <View style={styles.loginLinkSection}>
              <AppText style={{ color: colors.textMuted, fontSize: 16 }}>
                {t('Auth.signup.alreadyAccount', { defaultValue: 'Already have an account? ' })}
              </AppText>
              <Pressable onPress={() => router.replace(APP_ROUTES.LOGIN)}>
                <AppText style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
                  {t('Auth.signup.signIn', { defaultValue: 'Sign In' })}
                </AppText>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <HeritageButton
            title={t('Auth.signup.back', { defaultValue: 'Back' })}
            variant="ghost"
            onPress={() => router.back()}
            style={{ marginTop: 8 }}
        />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  iconWrapper: {
    marginBottom: 8,
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
  },
  subtitle: {
    paddingHorizontal: 32,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  formSection: {
    width: '100%',
    gap: 20,
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
    gap: 24,
    paddingTop: 16,
  },
  loginLinkSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
