import { Link } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { ZoomIn, FadeInDown } from 'react-native-reanimated';
import { Container } from '@/components/ui/Container';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useHeritageTheme } from '@/theme/heritage';
import { useLoginLogic } from '@/features/auth/hooks/useLoginLogic';
import { AppText } from '@/components/ui/AppText';
import { View } from 'react-native';

export default function LoginScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useLoginLogic();
  const { email, password, loading, message, error, isSubmitDisabled, isResetDisabled } = state;

  return (
    <Container safe scrollable={false}>
      <View className="flex-1 justify-center gap-10 px-6">
        <View className="w-full items-center gap-4">
          <Animated.View
            entering={ZoomIn.delay(300).springify()}
            className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border-[2px]"
            style={{
              backgroundColor: `${colors.primary}10`,
              borderColor: `${colors.primary}25`,
            }}>
            <Icon name="book" size={44} color={colors.primary} />
          </Animated.View>
          <AppText
            variant="headline"
            className="text-center">
            Welcome Back
          </AppText>
          <AppText
            variant="body"
            className="px-8 text-center text-textMuted leading-relaxed">
            Sign in to continue your story journey.
          </AppText>
        </View>

        <Animated.View entering={FadeInDown.delay(400).springify()} className="w-full gap-4">
          <AppInput
            label="Email"
            value={email}
            onChangeText={actions.setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            accessibilityLabel="Email Address"
            leftIcon="mail"
            error={error ? ' ' : undefined} // Keep spacing consistent if we have error
          />

          <AppInput
            label="Password"
            value={password}
            onChangeText={actions.setPassword}
            secureTextEntry
            placeholder="••••••••"
            accessibilityLabel="Password"
            leftIcon="lock-closed"
          />

          {error ? (
            <AppText variant="small" className="text-center font-bold" style={{ color: colors.error }}>
              {error}
            </AppText>
          ) : null}
          {message ? (
            <AppText variant="small" className="text-center font-bold" style={{ color: colors.success }}>
              {message}
            </AppText>
          ) : null}

          <View className="gap-5 pt-4">
            <AppButton
              onPress={actions.handleSignIn}
              disabled={isSubmitDisabled}
              variant="primary"
              label={loading ? 'Signing in…' : 'Sign in'}
            />

            <AppButton
              onPress={actions.handleResetPassword}
              disabled={isResetDisabled}
              variant="ghost"
              className="mt-2"
              label="Forgot Password?"
            />
          </View>
        </Animated.View>

        <Link href="/(tabs)" asChild>
          <AppButton variant="secondary" label="Back to Home" onPress={() => {}} />
        </Link>
      </View>
    </Container>
  );
}
