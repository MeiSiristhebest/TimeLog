/**
 * HeritageButton - Enhanced button with micro-interactions.
 *
 * Features:
 * - Scale down to 0.96 on press
 * - Haptic feedback
 * - Shadow depth change on press
 * - Loading state with spinner
 * - Icon support
 * - Multiple variants
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageButton
 *   title="Save Story"
 *   onPress={handleSave}
 *   icon="checkmark"
 * />
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'small' | 'medium' | 'large';

type HeritageButtonProps = {
  /** Button text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Left icon */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Right icon */
  iconRight?: keyof typeof Ionicons.glyphMap;
  /** Custom icon element */
  iconElement?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** NativeWind class name */
  className?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeritageButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconRight,
  iconElement,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  ...props
}: HeritageButtonProps) {
  const theme = useHeritageTheme();
  const shouldReduceMotion = useReducedMotion();

  // Animation values
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.25);

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    // Skip scale animation if user prefers reduced motion
    if (!shouldReduceMotion) {
      scale.value = withSpring(0.96, theme.animation.press);
    }
    shadowOpacity.value = withTiming(0.15, { duration: 100 });
  }, [disabled, loading, scale, shadowOpacity, theme.animation.press, shouldReduceMotion]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, theme.animation.press);
    shadowOpacity.value = withTiming(0.25, { duration: 100 });
  }, [scale, shadowOpacity, theme.animation.press]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, loading, onPress]);

  // Get variant styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; iconColor: string } => {
    const isDisabled = disabled || loading;
    const { colors } = theme;

    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isDisabled ? colors.disabled : colors.primary,
          },
          text: {
            color: colors.onPrimary,
          },
          iconColor: colors.onPrimary,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDisabled ? colors.disabled : `${colors.primary}15`,
          },
          text: {
            color: isDisabled ? colors.textMuted : colors.primary,
          },
          iconColor: isDisabled ? colors.textMuted : colors.primary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: isDisabled ? colors.disabled : colors.primary,
          },
          text: {
            color: isDisabled ? colors.textMuted : colors.primary,
          },
          iconColor: isDisabled ? colors.textMuted : colors.primary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: isDisabled ? colors.textMuted : colors.primary,
          },
          iconColor: isDisabled ? colors.textMuted : colors.primary,
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: isDisabled ? colors.disabled : colors.error,
          },
          text: {
            color: colors.onPrimary,
          },
          iconColor: colors.onPrimary,
        };
      default:
        return {
          container: { backgroundColor: colors.primary },
          text: { color: colors.onPrimary },
          iconColor: colors.onPrimary,
        };
    }
  };

  // Get size styles
  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; iconSize: number } => {
    const scale = theme.typography.body / 24;
    switch (size) {
      case 'small':
        return {
          container: {
            height: 48, // Increased from 40 for 48dp Android minimum touch target
            paddingHorizontal: theme.spacing.md,
            borderRadius: 12,
          },
          text: {
            fontSize: Math.round(14 * scale),
          },
          iconSize: 18,
        };
      case 'medium':
        return {
          container: {
            height: 56,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.md,
          },
          text: {
            fontSize: Math.round(16 * scale),
          },
          iconSize: 20,
        };
      case 'large':
        return {
          container: {
            height: 64,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.radius.lg,
          },
          text: {
            fontSize: Math.round(18 * scale),
          },
          iconSize: 24,
        };
      default:
        return {
          container: {
            height: 56,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.md,
          },
          text: { fontSize: Math.round(16 * scale) },
          iconSize: 20,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: variant === 'primary' ? shadowOpacity.value : 0,
  }));

  return (
    <AnimatedPressable
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        variant === 'primary' && { ...styles.shadow, shadowColor: theme.colors.shadow },
        animatedStyle,
        style,
      ]}
      className={props.className}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}>
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.text.color as string} />
      ) : (
        <>
          {iconElement}
          {icon && !iconElement && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.iconColor}
              style={styles.iconLeft}
            />
          )}
          <AppText
            variant="label"
            style={[styles.text, sizeStyles.text, variantStyles.text, textStyle]}>
            {title}
          </AppText>
          {iconRight && (
            <Ionicons
              name={iconRight}
              size={sizeStyles.iconSize}
              color={variantStyles.iconColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  shadow: {
    // shadowColor: 'black',
    // shadowOffset: { width: 0, height: 6 },
    // shadowRadius: 12,
    // elevation: 8,
    // @ts-ignore - React Native 0.76+ / Expo 52+ supports boxShadow
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default HeritageButton;
