import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View, Animated } from 'react-native';

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
export const Button = forwardRef<View, ButtonProps>(
  ({ title, variant = 'primary', size = 'md', icon, className, textClassName, ...touchableProps }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={touchableProps.accessibilityLabel ?? title}
        activeOpacity={0.8}
        {...touchableProps}
        className={`
          flex-row items-center justify-center rounded-button
          ${getVariantStyle(variant)} 
          ${getSizeStyle(size)} 
          ${className ?? ''}
        `}
      >
        {icon && <View className="mr-2">{icon}</View>}
        <Text className={`${getTextStyle(variant, size)} font-semibold text-center ${textClassName ?? ''}`}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const getVariantStyle = (variant: string) => {
  switch (variant) {
    case 'secondary': return 'bg-surface border border-border shadow-sm';
    case 'outline': return 'bg-transparent border-[1.5px] border-primary';
    case 'ghost': return 'bg-transparent active:bg-primary/5';
    case 'primary':
    default: return 'bg-primary shadow-lg shadow-primary/30 active:shadow-sm elevation-4';
  }
};

/**
 * Elderly-friendly sizing:
 * - sm: 48dp minimum (Apple HIG)
 * - md: 56dp (comfortable default)
 * - lg: 64dp (large, prominent actions)
 */
const getSizeStyle = (size: string) => {
  switch (size) {
    case 'sm': return 'px-5 py-3 min-h-[48px]';
    case 'lg': return 'px-8 py-4 min-h-[64px]';
    case 'md':
    default: return 'px-6 py-3.5 min-h-[56px]';
  }
};

/**
 * Text sizing follows UX spec:
 * - Body text: 24pt
 * - Caption: 18pt
 */
const getTextStyle = (variant: string, size: string) => {
  const baseSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';
  const color = variant === 'outline' || variant === 'ghost' ? 'text-primary' :
    variant === 'secondary' ? 'text-onSurface' : 'text-onPrimary';
  return `${baseSize} ${color}`;
};

