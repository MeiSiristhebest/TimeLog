import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

type ButtonProps = {
  title: string;
  textClassName?: string;
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
  ({ title, className, textClassName, ...touchableProps }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        {...touchableProps}
        className={`${styles.button} ${className ?? ''}`}>
        <Text className={`${styles.buttonText} ${textClassName ?? ''}`}>{title}</Text>
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = {
  button: 'items-center justify-center bg-primary rounded-[28px] shadow-md px-6 py-3 min-h-[48px]',
  buttonText: 'text-onPrimary text-body font-semibold text-center',
};
