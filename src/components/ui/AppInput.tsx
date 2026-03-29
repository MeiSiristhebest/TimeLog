import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Animated } from '@/tw/animated';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { AppText } from './AppText';
import { useHeritageTheme } from '@/theme/heritage';
import * as Haptics from 'expo-haptics';

export type AppInputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  leftIcon?: string;
  className?: string;
  onClear?: () => void;
  showClear?: boolean;
};

/**
 * Atomic Input Component for TimeLog.
 * - 64dp height for elderly-first accessibility.
 * - High contrast typography and borders.
 * - Built-in focus state and haptic feedback.
 * - "Heritage Parchment" aesthetic.
 */
export function AppInput({
  label,
  error,
  leftIcon,
  className,
  value,
  onChangeText,
  onFocus,
  onBlur,
  showClear = true,
  onClear,
  ...props
}: AppInputProps): JSX.Element {
  const { colors, radius } = useHeritageTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  const focusProgress = useSharedValue(0);
  const hasValue = !!value && value.length > 0;

  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const handleClear = useCallback(() => {
    onChangeText?.('');
    onClear?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    inputRef.current?.focus();
  }, [onChangeText, onClear]);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: error 
      ? colors.error 
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [colors.border, colors.primary]
        ),
    borderWidth: isFocused || error ? 2 : 1.5,
  }));

  return (
    <View className={`mb-4 w-full ${className || ''}`}>
      {label && (
        <AppText variant="small" className="font-bold mb-2 ml-1" style={{ color: error ? colors.error : colors.textMuted }}>
          {label.toUpperCase()}
        </AppText>
      )}

      <Animated.View 
        style={containerStyle}
        className="flex-row items-center h-16 px-4 bg-surface rounded-2xl"
      >
        {leftIcon && (
          <View className="mr-3">
            <Icon 
              name={leftIcon as any} 
              size={24} 
              color={error ? colors.error : isFocused ? colors.primary : colors.textMuted} 
            />
          </View>
        )}

        <RNTextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 h-full text-lg font-medium"
          style={{ color: colors.onSurface }}
          placeholderTextColor={`${colors.onSurface}55`}
          selectionColor={colors.primary}
          {...props}
        />

        {showClear && hasValue && (
          <Pressable onPress={handleClear} className="p-2 -mr-2">
            <Icon name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </Animated.View>

      {error && (
        <AppText variant="small" className="mt-1.5 ml-1 font-medium" style={{ color: colors.error }}>
          {error}
        </AppText>
      )}
    </View>
  );
}

export default AppInput;
