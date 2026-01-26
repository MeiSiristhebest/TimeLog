/**
 * HeritageActionSheet - iOS-style action sheet.
 *
 * Features:
 * - Option rows with icons
 * - Destructive action highlight
 * - Cancel button
 * - Slide-up animation
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageActionSheet
 *   visible={showSheet}
 *   onClose={() => setShowSheet(false)}
 *   title="Choose an action"
 *   options={[
 *     { label: 'Edit', icon: 'pencil', onPress: handleEdit },
 *     { label: 'Delete', icon: 'trash', destructive: true, onPress: handleDelete },
 *   ]}
 * />
 */

import { AppText } from '@/components/ui/AppText';
import { useEffect, useCallback } from 'react';
import { View, Pressable, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';

// Heritage Memoir Design Tokens
const TOKENS = {
  surface: '#FFFCF7',
  surfaceSecondary: '#F9F3E8',
  onSurface: '#1E293B',
  textMuted: '#475569',
  primary: '#B85A3B',
  destructive: '#B84A4A',
  backdrop: 'rgba(30, 41, 59, 0.4)',
  border: '#E2E8F0',
  radius: 16,
} as const;

type ActionOption = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type HeritageActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionOption[];
  cancelLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeritageActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  cancelLabel = 'Cancel',
}: HeritageActionSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 25, stiffness: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(300, { duration: 200 });
    }
  }, [visible, backdropOpacity, translateY]);

  const handleOptionPress = useCallback(
    (option: ActionOption) => {
      if (option.disabled) return;
      Haptics.impactAsync(
        option.destructive ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
      onClose();
      // Delay action to allow animation
      setTimeout(() => option.onPress(), 150);
    },
    [onClose]
  );

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Backdrop */}
        <AnimatedPressable style={[styles.backdrop, backdropStyle]} onPress={handleCancel} />

        {/* Sheet */}
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }, sheetStyle]}>
          {/* Options Group */}
          <View style={styles.optionsGroup}>
            {/* Header */}
            {(title || message) && (
              <View style={styles.header}>
                {title && <AppText style={styles.title}>{title}</AppText>}
                {message && <AppText style={styles.message}>{message}</AppText>}
              </View>
            )}

            {/* Options */}
            {options.map((option, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.option,
                  index === 0 && !title && !message && styles.optionFirst,
                  index === options.length - 1 && styles.optionLast,
                  pressed && styles.optionPressed,
                  option.disabled && styles.optionDisabled,
                ]}
                onPress={() => handleOptionPress(option)}
                disabled={option.disabled}>
                {option.icon && (
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={option.destructive ? TOKENS.destructive : TOKENS.onSurface}
                    style={styles.optionIcon}
                  />
                )}
                <AppText
                  style={[
                    styles.optionLabel,
                    option.destructive && styles.optionLabelDestructive,
                    option.disabled && styles.optionLabelDisabled,
                  ]}>
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}
            onPress={handleCancel}>
            <AppText style={styles.cancelText}>{cancelLabel}</AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.backdrop,
  },
  sheet: {
    paddingHorizontal: 8,
  },
  optionsGroup: {
    backgroundColor: TOKENS.surface,
    borderRadius: TOKENS.radius,
    overflow: 'hidden',
    marginBottom: 8,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: TOKENS.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: TOKENS.textMuted,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: TOKENS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: TOKENS.border,
  },
  optionFirst: {
    borderTopWidth: 0,
  },
  optionLast: {},
  optionPressed: {
    backgroundColor: TOKENS.surfaceSecondary,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 20,
    color: TOKENS.primary,
    fontWeight: '500',
  },
  optionLabelDestructive: {
    color: TOKENS.destructive,
  },
  optionLabelDisabled: {
    color: TOKENS.textMuted,
  },
  cancelButton: {
    backgroundColor: TOKENS.surface,
    borderRadius: TOKENS.radius,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelPressed: {
    backgroundColor: TOKENS.surfaceSecondary,
  },
  cancelText: {
    fontSize: 20,
    fontWeight: '600',
    color: TOKENS.primary,
  },
});

export default HeritageActionSheet;
