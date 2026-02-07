import type { TouchableOpacityProps } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { forwardRef } from 'react';
import { TouchableOpacity, View } from 'react-native';

type ButtonProps = {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  textClassName?: string;
} & TouchableOpacityProps;

/**
 * Elderly-friendly Button Component
 *
 * Touch targets follow Apple HIG + elderly optimization:
 * - sm: 48dp (Apple minimum)
 * - md: 56dp (default - comfortable)
 * - lg: 64dp (large actions like Record button)
 */
export const Button = forwardRef<View, ButtonProps>(function Button(
  { title, variant = 'primary', size = 'md', icon, className, textClassName, ...touchableProps },
  ref
): JSX.Element {
  return (
    <TouchableOpacity
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={touchableProps.accessibilityLabel ?? title}
      activeOpacity={0.8}
      {...touchableProps}
      className={`rounded-button flex-row items-center justify-center ${getVariantStyle(variant)} ${getSizeStyle(size)} ${className ?? ''} `}>
      {icon && <View className="mr-2">{icon}</View>}
      <AppText
        className={`${getTextStyle(variant, size)} text-center font-semibold ${textClassName ?? ''}`}>
        {title}
      </AppText>
    </TouchableOpacity>
  );
});

Button.displayName = 'Button';

function getVariantStyle(variant: ButtonProps['variant']): string {
  switch (variant) {
    case 'secondary':
      return 'bg-surface border border-border shadow-sm';
    case 'outline':
      return 'bg-transparent border-[1.5px] border-primary';
    case 'ghost':
      return 'bg-transparent active:bg-primary/5';
    case 'primary':
    default:
      return 'bg-primary shadow-lg shadow-primary/30 active:shadow-sm elevation-4';
  }
}

/**
 * Elderly-friendly sizing:
 * - sm: 48dp minimum (Apple HIG)
 * - md: 56dp (comfortable default)
 * - lg: 64dp (large, prominent actions)
 */
function getSizeStyle(size: ButtonProps['size']): string {
  switch (size) {
    case 'sm':
      return 'px-5 py-3 min-h-[48px]';
    case 'lg':
      return 'px-8 py-4 min-h-[64px]';
    case 'md':
    default:
      return 'px-6 py-3.5 min-h-[56px]';
  }
}

function getTextSize(size: ButtonProps['size']): string {
  switch (size) {
    case 'sm':
      return 'text-base';
    case 'lg':
      return 'text-xl';
    case 'md':
    default:
      return 'text-lg';
  }
}

function getTextColor(variant: ButtonProps['variant']): string {
  switch (variant) {
    case 'outline':
    case 'ghost':
      return 'text-primary';
    case 'secondary':
      return 'text-onSurface';
    case 'primary':
    default:
      return 'text-onPrimary';
  }
}

/**
 * Text sizing follows UX spec:
 * - Body text: 24pt
 * - Caption: 18pt
 */
function getTextStyle(variant: ButtonProps['variant'], size: ButtonProps['size']): string {
  return `${getTextSize(size)} ${getTextColor(variant)}`;
}
