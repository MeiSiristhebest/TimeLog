import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme, PALETTE } from '@/theme/heritage';
import { useDeviceCodeLogic } from '@/features/auth/hooks/useAuthLogic';
import { AUTH_STRINGS } from '@/features/auth/data/mockAuthData';

export default function DeviceCodeScreen(): JSX.Element {
  const { colors, typography } = useHeritageTheme();
  const scale = typography.body / 24;

  // Logic Separation
  const { state, actions } = useDeviceCodeLogic();
  const { codeData, error, loading, formattedCode } = state;
  const { loadCode, handleReady, handleBack } = actions;
  const STRINGS = AUTH_STRINGS.deviceCode;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeritageHeader title={STRINGS.title} showBack onBack={handleBack} />

      {/* Main Content */}
      <View style={styles.main}>
        {/* Icon Anchor */}
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="phone-portrait-sharp" size={40} color={colors.primary} />
        </View>

        {/* Headline */}
        <Animated.Text
          entering={FadeInDown.duration(600).delay(200)}
          style={[
            styles.headline,
            {
              color: colors.onSurface,
              fontSize: Math.round(36 * scale),
              lineHeight: Math.round(43.2 * scale),
            },
          ]}>
          {STRINGS.headline}
        </Animated.Text>

        {/* Code Container */}
        <Animated.View
          entering={ZoomIn.duration(600).delay(400)}
          style={[
            styles.codeContainer,
            { backgroundColor: colors.surfaceDim, borderColor: colors.border },
          ]}>
          <AppText style={[styles.codeLabel, { color: colors.textMuted }]}>
            {STRINGS.codeLabel}
          </AppText>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : error ? (
            <AppText style={{ color: colors.error, fontSize: 16 }}>{STRINGS.error}</AppText>
          ) : (
            <View style={styles.codeTextContainer}>
              <AppText style={[styles.codeDigit, { color: colors.onSurface }]}>
                {formattedCode.part1}
              </AppText>
              <AppText style={[styles.codeSeparator, { color: `${colors.primary}80` }]}>-</AppText>
              <AppText style={[styles.codeDigit, { color: colors.onSurface }]}>
                {formattedCode.part2}
              </AppText>
            </View>
          )}
        </Animated.View>

        {/* Helper Text */}
        <AppText style={[styles.helperText, { color: `${colors.onSurface}CC` }]}>
          {STRINGS.helperText}
        </AppText>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.footer}>
        {/* Primary Action Button */}
        <HeritageButton
          title={STRINGS.readyButton}
          onPress={handleReady}
          variant="primary"
          size="large"
          iconRight="arrow-forward"
          fullWidth
          style={styles.readyButton}
        />

        <TouchableOpacity style={styles.troubleLink} onPress={() => loadCode()}>
          <AppText style={[styles.troubleText, { color: colors.textMuted }]}>
            {loading ? STRINGS.regenerate.loading : STRINGS.regenerate.idle}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    width: '100%',
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  iconContainer: {
    padding: 16,
    borderRadius: 9999,
    marginBottom: 32,
  },
  headline: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 36,
    lineHeight: 43.2, // 1.2
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  codeContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 32,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: PALETTE.shadowNeutral,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  codeLabel: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2, // tracking-widest
    fontWeight: '700',
    marginBottom: 16,
  },
  codeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // sm:gap-4 equivalent
  },
  codeDigit: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), // Monospace
    fontSize: 42, // sm:text-[56px] might be too big for some screens, stick to safe large
    fontWeight: '700',
    letterSpacing: 2,
  },
  codeSeparator: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontSize: 42,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 22,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 32, // More breathing room (approx 1.45x)
  },
  footer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  readyButton: {
    width: '100%',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  troubleLink: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  troubleText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
