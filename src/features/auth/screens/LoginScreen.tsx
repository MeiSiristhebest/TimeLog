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
import { View } from 'react-native';

export default function LoginScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useLoginLogic();
  const { email, password, loading, message, error, isSubmitDisabled, isResetDisabled } = state;

  return (
    <Container>
      <View className="flex-1 justify-center gap-10 px-6">
        <View className="w-full items-center gap-4">
          <Animated.View
            entering={ZoomIn.delay(300).springify()}
            className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border-[1.5px]"
            style={{
              backgroundColor: `${colors.primary}15`,
              borderColor: `${colors.primary}25`,
            }}>
            <Ionicons name="book" size={40} color={colors.primary} />
          </Animated.View>
          <AppText
            className="text-center font-serif text-4xl font-semibold"
            style={{ color: colors.onSurface }}>
            Welcome Back
          </AppText>
          <AppText
            className="px-8 text-center text-base leading-6"
            style={{ color: colors.textMuted }}>
            Sign in to continue your story journey.
          </AppText>
        </View>

        <Animated.View entering={FadeInDown.delay(400).springify()} className="w-full gap-4">
          <View className="gap-2">
            <HeritageInput
              label="Email"
              value={email}
              onChangeText={actions.setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              accessibilityLabel="Email Address"
              accessibilityHint="Please enter your email address"
            />
          </View>

          <View className="gap-2">
            <HeritageInput
              label="Password"
              value={password}
              onChangeText={actions.setPassword}
              secureTextEntry
              placeholder="••••••••"
              accessibilityLabel="Password"
              accessibilityHint="Please enter your password"
            />
          </View>

          {error ? (
            <AppText className="text-center text-sm font-medium" style={{ color: colors.error }}>
              {error}
            </AppText>
          ) : null}
          {message ? (
            <AppText className="text-center text-sm font-medium" style={{ color: colors.success }}>
              {message}
            </AppText>
          ) : null}

          <View className="gap-4 pt-4">
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
