import { Icon } from '@/components/ui/Icon';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Animated } from '@/tw/animated';
import {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface HoldToStopButtonProps {
  onHoldComplete: () => void;
  size: number;
  holdDurationMs?: number;
  buttonColor: string;
  iconColor?: string;
  progressColor?: string;
  trackColor?: string;
  ringPadding?: number;
  ringStrokeWidth?: number;
  buttonBorderColor?: string;
  buttonBorderWidth?: number;
  accessibilityLabel?: string;
  disabled?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function HoldToStopButton({
  onHoldComplete,
  size,
  holdDurationMs = 700,
  buttonColor,
  iconColor = '#FFFFFF',
  progressColor = '#FBBF24',
  trackColor = 'rgba(255,255,255,0.2)',
  ringPadding = 10,
  ringStrokeWidth = 5,
  buttonBorderColor = 'transparent',
  buttonBorderWidth = 0,
  accessibilityLabel = 'Hold to stop recording',
  disabled = false,
}: HoldToStopButtonProps): JSX.Element {
  const ringSize = size + ringPadding * 2;
  const strokeWidth = ringStrokeWidth;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  const lastHapticMilestone = useRef(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCompletedRef = useRef(false);

  // Animated props for the progress ring
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // Incremental haptic feedback during hold
  useAnimatedReaction(
    () => progress.value,
    (current) => {
      const milestone = Math.floor(current * 5); // 0, 1, 2, 3, 4, 5
      if (milestone > lastHapticMilestone.current && milestone < 5) {
        lastHapticMilestone.current = milestone;
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  );

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    if (disabled) return;

    clearHoldTimer();
    holdCompletedRef.current = false;
    lastHapticMilestone.current = 0;
    progress.value = 0;
    
    // Provide initial feedback on press start
    Haptics.selectionAsync();

    progress.value = withTiming(1, {
      duration: holdDurationMs,
      easing: Easing.linear,
    });

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      if (disabled || holdCompletedRef.current) return;
      holdCompletedRef.current = true;
      onHoldComplete();
    }, holdDurationMs);
  }, [clearHoldTimer, disabled, holdDurationMs, onHoldComplete, progress]);

  const resetProgress = useCallback(() => {
    clearHoldTimer();
    if (!holdCompletedRef.current) {
      cancelAnimation(progress);
      progress.value = withTiming(0, {
        duration: 140,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [clearHoldTimer, progress]);

  useEffect(() => {
    return () => {
      clearHoldTimer();
    };
  }, [clearHoldTimer]);

  return (
    <Pressable
      onPressIn={startProgress}
      onPressOut={resetProgress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="items-center justify-center"
      style={{ width: ringSize, height: ringSize }}>
      {({ pressed }) => (
        <>
          {pressed && !disabled && (
            <Svg
              width={ringSize}
              height={ringSize}
              className="absolute top-0 left-0 rotate-[-90deg]">
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <AnimatedCircle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={progressColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                animatedProps={animatedProps}
              />
            </Svg>
          )}

          <View
            className="items-center justify-center elevation-5"
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: buttonColor,
              borderColor: buttonBorderColor,
              borderWidth: buttonBorderWidth,
              opacity: disabled ? 0.6 : 1,
              transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
            }}>
            <Icon name="square" size={Math.round(size * 0.42)} color={iconColor} />
          </View>
        </>
      )}
    </Pressable>
  );
}
