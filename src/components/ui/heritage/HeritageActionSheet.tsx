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
import { useHeritageTheme } from '@/theme/heritage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const { colors } = useHeritageTheme();

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
      <View className={styles.container}>
        {/* Backdrop */}
        <AnimatedPressable
          className="absolute inset-0"
          style={[{ backgroundColor: colors.backdrop }, backdropStyle]}
          onPress={handleCancel}
        />

        {/* Sheet */}
        <Animated.View
          style={[
            sheetStyle,
            { paddingBottom: insets.bottom + 8 }
          ]}
          className={styles.sheet}
        >
          {/* Options Group */}
          <View className={styles.optionsGroup} style={{ backgroundColor: colors.surface }}>
            {/* Header */}
            {(title || message) && (
              <View className={styles.header} style={{ borderBottomColor: colors.border }}>
                {title && <AppText className={styles.title} style={{ color: colors.textMuted }}>{title}</AppText>}
                {message && <AppText className={styles.message} style={{ color: colors.textMuted }}>{message}</AppText>}
              </View>
            )}

            {/* Options */}
            {options.map((option, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  {
                    borderTopWidth: index === 0 && !title && !message ? 0 : 0.5,
                    borderTopColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceAccent : 'transparent'
                  },
                  option.disabled && { opacity: 0.4 }
                ]}
                className={`${styles.option} ${index === 0 && !title && !message ? 'border-t-0' : ''}`}
                onPress={() => handleOptionPress(option)}
                disabled={option.disabled}>
                {option.icon && (
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={option.destructive ? colors.error : colors.onSurface}
                    style={{ marginRight: 12 }}
                  />
                )}
                <AppText
                  className={styles.optionLabel}
                  style={{
                    color: option.destructive ? colors.error : colors.primary
                  }}>
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [{ backgroundColor: pressed ? colors.surfaceAccent : colors.surface }]}
            className={styles.cancelButton}
            onPress={handleCancel}>
            <AppText className={styles.cancelText} style={{ color: colors.primary }}>{cancelLabel}</AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = {
  container: 'flex-1 justify-end',
  sheet: 'px-2',
  optionsGroup: 'rounded-xl overflow-hidden mb-2',
  header: 'p-4 items-center border-b-[0.5px]',
  title: 'text-sm font-semibold text-center',
  message: 'text-xs text-center mt-1',
  option: 'flex-row items-center justify-center py-[18px] px-4',
  optionLabel: 'text-xl font-medium',
  cancelButton: 'rounded-xl py-[18px] items-center',
  cancelText: 'text-xl font-semibold',
} as const;

export default HeritageActionSheet;
