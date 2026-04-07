import { Ionicons } from '@/components/ui/Icon';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Animated } from '@/tw/animated';
import { cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming, } from 'react-native-reanimated';

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
  holdDurationMs = 500,
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
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCompletedRef = useRef(false);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    if (disabled) {
      return;
    }

    clearHoldTimer();
    holdCompletedRef.current = false;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: holdDurationMs,
      easing: Easing.linear,
    });

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      if (disabled || holdCompletedRef.current) {
        return;
      }
      holdCompletedRef.current = true;
      onHoldComplete();
    }, holdDurationMs);
  }, [clearHoldTimer, disabled, holdDurationMs, onHoldComplete, progress]);

  const resetProgress = useCallback(() => {
    clearHoldTimer();
    holdCompletedRef.current = false;
    cancelAnimation(progress);
    progress.value = withTiming(0, {
      duration: 140,
      easing: Easing.out(Easing.quad),
    });
  }, [clearHoldTimer, progress]);

  useEffect(() => {
    return () => {
      clearHoldTimer();
    };
  }, [clearHoldTimer]);

  return (
    <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={ringSize}
        height={ringSize}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
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

      <Pressable
        onPressIn={startProgress}
        onPressOut={resetProgress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: buttonColor,
          borderColor: buttonBorderColor,
          borderWidth: buttonBorderWidth,
          transform: [{ scale: pressed ? 0.94 : 1 }],
          opacity: pressed ? 0.92 : 1,
        })}>
        <Ionicons name="close" size={Math.round(size * 0.46)} color={iconColor} />
      </Pressable>
    </View>
  );
}
