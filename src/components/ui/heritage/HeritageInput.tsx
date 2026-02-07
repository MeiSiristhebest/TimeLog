/**
 * HeritageInput - Premium text input with animations.
 *
 * Features:
 * - Floating label animation
 * - Focus border glow
 * - Error shake animation
 * - Character counter
 * - Clear button
 * - 64dp height for elderly accessibility
 *
 * @example
 * <HeritageInput
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 *   error={emailError}
 * />
 */

import { AppText } from '@/components/ui/AppText';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';

type HeritageInputProps = Omit<TextInputProps, 'style'> & {
  /** Floating label text */
  label: string;
  /** Error message (shows error state if provided) */
  error?: string;
  /** Max character count for counter */
  maxLength?: number;
  /** Show character counter */
  showCounter?: boolean;
  /** Show clear button when has text */
  showClear?: boolean;
  /** Left icon name */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Container style */
  containerStyle?: object;
  /** Custom input style */
  inputStyle?: object;
};

type HeritageColors = ReturnType<typeof useHeritageTheme>['colors'];

function getInputIconColor(hasError: boolean, isFocused: boolean, colors: HeritageColors): string {
  if (hasError) return colors.error;
  if (isFocused) return colors.primary;
  return colors.textMuted;
}

export function HeritageInput({
  label,
  value,
  onChangeText,
  error,
  maxLength,
  showCounter = false,
  showClear = true,
  leftIcon,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}: HeritageInputProps): JSX.Element {
  const theme = useHeritageTheme();
  const { colors, typography } = theme;
  const scale = typography.body / 24;
  const labelFontSize = Math.round(18 * scale);

  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  // Animation values
  const focusProgress = useSharedValue(0);
  const labelPosition = useSharedValue(value ? 1 : 0);
  const shakeX = useSharedValue(0);
  const borderWidth = useSharedValue(1);

  const hasValue = !!value && value.length > 0;
  const hasError = !!error;

  // Update label position when value changes
  useEffect(() => {
    if (hasValue || isFocused) {
      labelPosition.value = withTiming(1, { duration: 150 });
    } else {
      labelPosition.value = withTiming(0, { duration: 150 });
    }
  }, [hasValue, isFocused, labelPosition]);

  // Trigger shake animation on error
  useEffect(() => {
    if (hasError) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [hasError, error, shakeX]);

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      focusProgress.value = withTiming(1, { duration: 200 });
      borderWidth.value = withTiming(2, { duration: 150 });
      onFocus?.(e);
    },
    [focusProgress, borderWidth, onFocus]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      focusProgress.value = withTiming(0, { duration: 200 });
      borderWidth.value = withTiming(1, { duration: 150 });
      onBlur?.(e);
    },
    [focusProgress, borderWidth, onBlur]
  );

  const handleClear = useCallback(() => {
    onChangeText?.('');
    inputRef.current?.focus();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onChangeText]);

  const handleContainerPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
    borderWidth: borderWidth.value,
    borderColor: hasError
      ? colors.error
      : interpolateColor(
        focusProgress.value,
        [0, 1],
        [colors.border, colors.handleActive] // Use handleActive (primary) for focus
      ),
    backgroundColor: colors.surface,
  }));

  // Re-eval styles when theme changes
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(labelPosition.value, [0, 1], [0, -28]),
      },
      {
        scale: interpolate(labelPosition.value, [0, 1], [1, 0.85]),
      },
    ],
    color: hasError
      ? colors.error
      : interpolateColor(focusProgress.value, [0, 1], [colors.textMuted, colors.primary]),
    backgroundColor: colors.surface,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: focusProgress.value * 0.15,
    transform: [{ scale: interpolate(focusProgress.value, [0, 1], [0.98, 1]) }],
    backgroundColor: colors.primary,
  }));

  return (
    <View style={[containerStyle]} className={`${styles.wrapper} ${props.className || ''}`}>
      <Pressable onPress={handleContainerPress}>
        {/* Focus glow */}
        <Animated.View style={[glowStyle]} className={styles.glow} />

        <Animated.View style={[containerAnimatedStyle]} className={styles.container}>
          {/* Left icon */}
          {leftIcon && (
            <View className={styles.leftIconContainer}>
              <Ionicons
                name={leftIcon}
                size={22}
                color={getInputIconColor(hasError, isFocused, colors)}
              />
            </View>
          )}

          {/* Input area */}
          <View className={styles.inputArea}>
            {/* Floating label */}
            {/* @ts-ignore */}
            <Animated.TextInput
              ref={inputRef}
              style={[
                { color: colors.onSurface, fontSize: labelFontSize },
                props.inputStyle,
              ]}
              className={styles.input}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              maxLength={maxLength}
              {...props}
              // Only show placeholder when label is lifted (focused or has value)
              placeholder={isFocused || hasValue ? props.placeholder : ''}
            />
          </View>

          {/* Clear button */}
          {showClear && hasValue && (
            <Pressable className={styles.clearButton} onPress={handleClear} hitSlop={12}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </Animated.View>
      </Pressable>

      {/* Bottom row: error or counter */}
      <View className={styles.bottomRow}>
        {hasError && <AppText style={{ color: colors.error }} className={styles.errorText}>{error}</AppText>}
        {showCounter && maxLength && (
          <AppText style={{ color: colors.textMuted }} className={styles.counter}>
            {value?.length || 0}/{maxLength}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = {
  wrapper: 'mb-4',
  glow: 'absolute -top-1 -left-1 -right-1 -bottom-1 rounded-[20px]',
  container: 'flex-row items-center rounded-2xl min-h-[64px] px-4',
  leftIconContainer: 'mr-3',
  inputArea: 'flex-1 justify-center py-5',
  label: 'absolute left-0 text-lg font-medium px-1',
  input: 'text-lg p-0 m-0',
  clearButton: 'p-1',
  bottomRow: 'flex-row justify-between mt-1 px-1',
  errorText: 'text-sm flex-1',
  counter: 'text-sm',
} as const;

export default HeritageInput;
