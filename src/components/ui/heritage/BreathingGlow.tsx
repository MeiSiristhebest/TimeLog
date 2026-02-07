import React, { useEffect, useMemo, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useReducedMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useHeritageTheme } from '@/theme/heritage';

interface BreathingGlowProps {
  color?: string;
  size?: number;
  profile?: BreathingProfile;
  style?: ViewStyle;
}

export type BreathingProfile = 'home' | 'recording';

type BreathingProfileConfig = {
  warmupMs: number;
  durationMs: number;
  baseOpacity: number;
  pulseMinOpacity: number;
  pulseMaxOpacity: number;
  minScale: number;
  maxScale: number;
  outerMinOpacity: number;
  outerMaxOpacity: number;
  outerMinScale: number;
  outerMaxScale: number;
};

export function resolveBreathingProfile(
  profile: BreathingProfile,
  alphaStrength: number
): BreathingProfileConfig {
  if (profile === 'recording') {
    return {
      warmupMs: 160,
      durationMs: 3000,
      baseOpacity: 0.15 * alphaStrength,
      pulseMinOpacity: 0.24 * alphaStrength,
      pulseMaxOpacity: 0.58 * alphaStrength,
      minScale: 0.94,
      maxScale: 1.18,
      outerMinOpacity: 0.08 * alphaStrength,
      outerMaxOpacity: 0.22 * alphaStrength,
      outerMinScale: 1.02,
      outerMaxScale: 1.3,
    };
  }

  return {
    warmupMs: 140,
    durationMs: 2400,
    baseOpacity: 0.1 * alphaStrength,
    pulseMinOpacity: 0.18 * alphaStrength,
    pulseMaxOpacity: 0.42 * alphaStrength,
    minScale: 0.97,
    maxScale: 1.1,
    outerMinOpacity: 0.05 * alphaStrength,
    outerMaxOpacity: 0.14 * alphaStrength,
    outerMinScale: 1,
    outerMaxScale: 1.14,
  };
}

function splitHexAlpha(input: string): { color: string; alpha: number } {
  const long = /^#([0-9a-fA-F]{8})$/;
  const short = /^#([0-9a-fA-F]{4})$/;

  const longMatch = input.match(long);
  if (longMatch) {
    const hex = longMatch[1];
    const alpha = parseInt(hex.slice(6, 8), 16) / 255;
    return { color: `#${hex.slice(0, 6)}`, alpha };
  }

  const shortMatch = input.match(short);
  if (shortMatch) {
    const hex = shortMatch[1];
    const alpha = parseInt(`${hex[3]}${hex[3]}`, 16) / 255;
    return { color: `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`, alpha };
  }

  return { color: input, alpha: 1 };
}

export function BreathingGlow({
  color,
  size = 130,
  profile = 'home',
  style,
}: BreathingGlowProps) {
  const { colors } = useHeritageTheme();
  const shouldReduceMotion = useReducedMotion();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.2);
  const outerScale = useSharedValue(1.02);
  const outerOpacity = useSharedValue(0.08);
  const [isWarm, setIsWarm] = useState(false);
  const ringSize = Math.round(size * 1.04);
  const { glowColor, glowAlpha } = useMemo(() => {
    const parsed = splitHexAlpha(color || colors.primary);
    return { glowColor: parsed.color, glowAlpha: parsed.alpha };
  }, [color, colors.primary]);
  const alphaStrength = 0.45 + glowAlpha * 0.55;
  const profileConfig = useMemo(
    () => resolveBreathingProfile(profile, alphaStrength),
    [profile, alphaStrength]
  );

  useEffect(() => {
    // Keep nodes mounted from frame 1, only reveal after warm-up.
    // This avoids Android first-visible-frame polygon artifacts.
    setIsWarm(false);
    const timer = setTimeout(() => setIsWarm(true), profileConfig.warmupMs);
    return () => clearTimeout(timer);
  }, [profileConfig.warmupMs]);

  useEffect(() => {
    pulseOpacity.value = profileConfig.pulseMinOpacity;
    pulseScale.value = 1;
    outerOpacity.value = profileConfig.outerMinOpacity;
    outerScale.value = 1;

    if (shouldReduceMotion || !isWarm) {
      pulseOpacity.value = profileConfig.pulseMinOpacity;
      pulseScale.value = 1;
      outerOpacity.value = profileConfig.outerMinOpacity;
      outerScale.value = 1;
      return;
    }

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(profileConfig.pulseMaxOpacity, {
          duration: profileConfig.durationMs,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(profileConfig.pulseMinOpacity, {
          duration: profileConfig.durationMs,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(profileConfig.maxScale, {
          duration: profileConfig.durationMs,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(profileConfig.minScale, {
          duration: profileConfig.durationMs,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    outerOpacity.value = withRepeat(
      withSequence(
        withTiming(profileConfig.outerMaxOpacity, {
          duration: profileConfig.durationMs,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(profileConfig.outerMinOpacity, {
          duration: profileConfig.durationMs,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    outerScale.value = withRepeat(
      withSequence(
        withTiming(profileConfig.outerMaxScale, {
          duration: profileConfig.durationMs,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(profileConfig.outerMinScale, {
          duration: profileConfig.durationMs,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [isWarm, outerOpacity, outerScale, profileConfig, pulseOpacity, pulseScale, shouldReduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));
  const outerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: outerOpacity.value,
    transform: [{ scale: outerScale.value }],
  }));

  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: ringSize,
          height: ringSize,
          alignSelf: 'center',
          borderRadius: ringSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
          zIndex: 0,
          opacity: isWarm ? 1 : 0,
        },
        style,
      ]}>
      <View
        key="base"
        style={{
          position: 'absolute',
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          backgroundColor: glowColor,
          opacity: profileConfig.baseOpacity,
        }}
      />
      <Animated.View
        key="outer-pulse"
        style={[
          {
            position: 'absolute',
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            overflow: 'hidden',
          },
          styles.pulseSurfaceStabilizer,
          outerAnimatedStyle,
        ]}>
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: glowColor,
          }}
        />
      </Animated.View>
      <Animated.View
        key="pulse"
        style={[
          {
            position: 'absolute',
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            overflow: 'hidden',
          },
          styles.pulseSurfaceStabilizer,
          animatedStyle,
        ]}>
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: glowColor,
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pulseSurfaceStabilizer: {
    // Improves Android edge rasterization for scaled rounded surfaces.
    renderToHardwareTextureAndroid: true,
    needsOffscreenAlphaCompositing: true,
  },
});

export default BreathingGlow;
