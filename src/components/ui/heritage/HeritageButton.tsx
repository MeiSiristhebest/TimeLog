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
import { ActivityIndicator, ViewStyle, TextStyle, Pressable } from 'react-native';
import { Animated } from '@/tw/animated';
import { useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion, } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';

type ButtonSize = 'small' | 'medium' | 'large';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

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
    <Animated.View
      style={[
        sizeStyles.container,
        variantStyles.container,
        variant === 'primary' && { boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)', shadowColor: theme.colors.shadow },
        animatedStyle,
        style,
      ]}
      // Apply className to the View, not the Pressable, to ensure styles render
      className={`${styles.container} ${fullWidth ? styles.fullWidth : ''} ${props.className || ''}`}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        style={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      >
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
                style={[{ marginRight: 8 }]}
              />
            )}
            <AppText
              variant="caption"
              style={[sizeStyles.text, variantStyles.text, textStyle]}
              className={styles.text}>
              {title}
            </AppText>
            {iconRight && (
              <Ionicons
                name={iconRight}
                size={sizeStyles.iconSize}
                color={variantStyles.iconColor}
                style={[{ marginLeft: 8 }]}
              />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = {
  container: 'flex-row items-center justify-center',
  fullWidth: 'w-full',
  // Using inline style for specific shadow until NativeWind shadow classes are fully verified
  text: 'font-semibold',
  iconLeft: 'mr-2',
  iconRight: 'ml-2',
} as const;

export default HeritageButton;
