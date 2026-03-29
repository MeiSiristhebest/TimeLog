import { useHeritageTheme } from '@/theme/heritage';
import { ActivityIndicator, Pressable, ViewStyle, StyleProp } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import * as Haptics from 'expo-haptics';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type AppButtonSize = 'md' | 'lg' | 'xl';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  haptic?: Haptics.ImpactFeedbackStyle | 'selection';
}

/**
 * Standardized "Elderly-First" Button System.
 * - 48dp minimum touch target for all sizes.
 * - High contrast (WCAG AAA) for maximum visibility.
 * - Tactile Feedback (Haptics) on every interaction.
 * - Minimalism + Heritage Parchment aesthetic.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className,
  style,
  haptic = Haptics.ImpactFeedbackStyle.Medium,
}: AppButtonProps): JSX.Element {
  const { colors, animation, isDark } = useHeritageTheme();
  const pressedScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedScale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    pressedScale.value = withSpring(0.96, animation.press);
    if (haptic === 'selection') {
      Haptics.selectionAsync();
    } else {
      Haptics.impactAsync(haptic);
    }
  };

  const handlePressOut = () => {
    pressedScale.value = withSpring(1, animation.press);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: colors.primary, borderColor: colors.primary },
          text: { color: colors.onPrimary },
          icon: colors.onPrimary,
        };
      case 'secondary':
        return {
          container: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
          text: { color: colors.primaryDeep },
          icon: colors.primaryDeep,
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 2 },
          text: { color: colors.primary },
          icon: colors.primary,
        };
      case 'destructive':
        return {
          container: { backgroundColor: colors.error, borderColor: colors.error },
          text: { color: colors.onPrimary },
          icon: colors.onPrimary,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent', borderColor: 'transparent' },
          text: { color: colors.primary },
          icon: colors.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xl':
        return { height: 64, borderRadius: 16, px: 32, fontSize: 22 };
      case 'lg':
        return { height: 56, borderRadius: 14, px: 24, fontSize: 20 };
      default:
        return { height: 48, borderRadius: 12, px: 20, fontSize: 18 };
    }
  };

  const vs = getVariantStyles();
  const sz = getSizeStyles();

  return (
    <Animated.View style={[animatedStyle, style]} className={className}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading }}
        className="flex-row items-center justify-center overflow-hidden border"
        style={[
          vs.container,
          { height: sz.height, borderRadius: sz.borderRadius, paddingHorizontal: sz.px },
          (disabled || loading) && { opacity: 0.5 },
        ]}>
        {loading ? (
          <ActivityIndicator color={vs.icon} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Icon name={icon} size={20} color={vs.icon} style={{ marginRight: 8 }} />
            )}
            <AppText
              style={[{ fontWeight: '700' }, vs.text]}
              variant="body">
              {label}
            </AppText>
            {icon && iconPosition === 'right' && (
              <Icon name={icon} size={20} color={vs.icon} style={{ marginLeft: 8 }} />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
