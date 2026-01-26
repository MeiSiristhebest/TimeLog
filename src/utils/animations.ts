import {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  WithSpringConfig,
} from 'react-native-reanimated';
import { ANIMATION_CONFIGS } from '../theme/heritage';

/**
 * Heritage Press Animation Hook
 *
 * Provides consistent press interactions (scale down).
 */
export function useHeritagePress(
  scaleDownTo: number = 0.96,
  config: WithSpringConfig = ANIMATION_CONFIGS.press
) {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(scaleDownTo, config);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, config);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { scale, onPressIn, onPressOut, animatedStyle };
}

/**
 * Heritage Entrance Animation Hook
 *
 * Fade in and slide up.
 */
export function useHeritageEntrance(
  delay: number = 0,
  slideDistance: number = 20,
  config: WithSpringConfig = ANIMATION_CONFIGS.modal
) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(slideDistance);

  const enter = () => {
    opacity.value = withTiming(1, { duration: 400 }); // Fade is usually timing
    translateY.value = withSpring(0, config);
  };

  const exit = (callback?: () => void) => {
    opacity.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(slideDistance, { duration: 300 }, (finished) => {
      if (finished && callback) callback();
    });
  };

  // Auto-enter if needed, but usually controlled by useEffect

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { opacity, translateY, enter, exit, animatedStyle };
}

/**
 * Re-export configs for convenience
 */
export const H_ANIMATION = ANIMATION_CONFIGS;
