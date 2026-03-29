import { useHeritageTheme } from '@/theme/heritage';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface AppPressableProps {
  children: React.ReactNode;
  onPress: () => void;
  haptic?: Haptics.ImpactFeedbackStyle | 'selection' | boolean;
  scale?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  role?: 'button' | 'link' | 'tab' | 'radio';
}

/**
 * Standardized High-Level Pressable Wrapper.
 * - Minimalism + Heritage Parchment aesthetic.
 * - Haptic focus for tactile confirmation.
 * - Consistent "Soft" scale and shadow states.
 * - Accessibility-first for elderly users.
 */
export function AppPressable({
  children,
  onPress,
  haptic = Haptics.ImpactFeedbackStyle.Light,
  scale = 0.98,
  className,
  style,
  disabled = false,
  accessibilityLabel,
  role = 'button',
}: AppPressableProps): JSX.Element {
  const { animation } = useHeritageTheme();
  const pressedScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedScale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    pressedScale.value = withSpring(scale, animation.press);
    if (haptic) {
      if (haptic === 'selection') {
        Haptics.selectionAsync();
      } else if (typeof haptic === 'string') {
        Haptics.impactAsync(haptic);
      } else {
        Haptics.selectionAsync();
      }
    }
  };

  const handlePressOut = () => {
    pressedScale.value = withSpring(1, animation.press);
  };

  return (
    <Animated.View style={[animatedStyle, style]} className={className}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole={role}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        className="active:opacity-75">
        {children}
      </Pressable>
    </Animated.View>
  );
}
