import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Animated } from '@/tw/animated';
import { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme, PALETTE } from '@/theme/heritage';
import { useDeviceCodeLogic } from '@/features/auth/hooks/useAuthLogic';
import { AUTH_STRINGS } from '@/features/auth/data/mockAuthData';

export default function DeviceCodeScreen() {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useDeviceCodeLogic();
  const { error, loading, formattedCode } = state;
  const { loadCode, handleReady, handleBack } = actions;
  const STRINGS = AUTH_STRINGS.deviceCode;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <HeritageHeader title={STRINGS.title} showBack onBack={handleBack} />

      {/* Main Content */}
      <View className="flex-1 w-full max-w-[420px] self-center items-center pt-10 px-6">
        {/* Icon Anchor */}
        <View
          className="p-4 rounded-full mb-8"
          style={{ backgroundColor: `${colors.primary}20` }}>
          <Ionicons name="phone-portrait-sharp" size={40} color={colors.primary} />
        </View>

        {/* Headline */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <AppText variant="display" className="text-center mb-8 -tracking-[0.5px]">
            {STRINGS.headline}
          </AppText>
        </Animated.View>

        {/* Code Container */}
        <Animated.View
          entering={ZoomIn.duration(600).delay(400)}
          className="w-full rounded-xl p-8 mb-8 items-center justify-center border shadow-sm"
          style={{ backgroundColor: colors.surfaceDim, borderColor: colors.border }}>
          <AppText
            variant="small"
            className="uppercase tracking-widest font-bold mb-4"
            style={{ color: colors.textMuted }}>
            {STRINGS.codeLabel}
          </AppText>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} className="my-3" />
          ) : error ? (
            <AppText className="text-base" style={{ color: colors.error }}>
              {STRINGS.error}
            </AppText>
          ) : (
            <View className="flex-row items-center gap-4">
              <AppText
                className="text-[42px] font-bold tracking-widest"
                style={{
                  fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
                  color: colors.onSurface,
                }}>
                {formattedCode.part1}
              </AppText>
              <AppText
                className="text-[42px] font-bold"
                style={{
                  fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
                  color: `${colors.primary}80`,
                }}>
                -
              </AppText>
              <AppText
                className="text-[42px] font-bold tracking-widest"
                style={{
                  fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
                  color: colors.onSurface,
                }}>
                {formattedCode.part2}
              </AppText>
            </View>
          )}
        </Animated.View>

        {/* Helper Text */}
        <AppText
          className="text-[22px] text-center max-w-[280px] leading-8"
          style={{ color: `${colors.onSurface}CC` }}>
          {STRINGS.helperText}
        </AppText>
      </View>

      {/* Bottom Action Area */}
      <View className="w-full max-w-[420px] self-center px-6 pb-12 pt-6">
        {/* Primary Action Button */}
        <HeritageButton
          title={STRINGS.readyButton}
          onPress={handleReady}
          variant="primary"
          size="large"
          iconRight="arrow-forward"
          fullWidth
          className="h-16"
        />

        <TouchableOpacity className="w-full mt-6 items-center" onPress={() => loadCode()}>
          <AppText variant="small" className="font-medium" style={{ color: colors.textMuted }}>
            {loading ? STRINGS.regenerate.loading : STRINGS.regenerate.idle}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

