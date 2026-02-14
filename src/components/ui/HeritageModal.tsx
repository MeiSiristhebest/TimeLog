/**
 * HeritageModal - Base modal component with Heritage Memoir styling.
 *
 * Features:
 * - Terracotta-tinted backdrop blur
 * - Elevated parchment background
 * - Smooth enter/exit animations
 * - Accessibility: focus trap, screen reader support
 *
 * @example
 * <HeritageModal visible={isOpen} onClose={() => setIsOpen(false)}>
 *   <AppText>Modal content</AppText>
 * </HeritageModal>
 */
import { useEffect, ReactNode } from 'react';
import {
  View,
  Modal,
  Pressable,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { Animated } from '@/tw/animated';
import { useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing, } from 'react-native-reanimated';
import { useHeritageTheme } from '@/theme/heritage';

const ANIMATION = {
  enterDuration: 200,
  exitDuration: 150,
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HeritageModalProps = {
  /** Whether modal is visible */
  visible: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Whether to close on backdrop press (default: true) */
  closeOnBackdrop?: boolean;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label for the modal */
  accessibilityLabel?: string;
};

export function HeritageModal({
  visible,
  onClose,
  children,
  closeOnBackdrop = true,
  testID = 'heritage-modal',
  accessibilityLabel = 'Modal dialog',
}: HeritageModalProps) {
  const { width } = useWindowDimensions();
  const { colors } = useHeritageTheme();
  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);
  const contentOpacity = useSharedValue(0);

  // Animate in when visible
  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: ANIMATION.enterDuration });
      contentScale.value = withSpring(1, { damping: 20, stiffness: 300 });
      contentOpacity.value = withTiming(1, { duration: ANIMATION.enterDuration });

      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(accessibilityLabel);
    } else {
      backdropOpacity.value = withTiming(0, { duration: ANIMATION.exitDuration });
      contentScale.value = withTiming(0.95, {
        duration: ANIMATION.exitDuration,
        easing: Easing.in(Easing.ease),
      });
      contentOpacity.value = withTiming(0, { duration: ANIMATION.exitDuration });
    }
  }, [visible, backdropOpacity, contentScale, contentOpacity, accessibilityLabel]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      testID={testID}>
      <View className="flex-1 items-center justify-center p-6">
        {/* Backdrop */}
        <AnimatedPressable
          className="absolute inset-0"
          style={[{ backgroundColor: colors.backdrop }, backdropStyle]}
          onPress={handleBackdropPress}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
        />

        {/* Content */}
        <Animated.View
          className="w-full overflow-hidden rounded-3xl"
          style={[
            contentStyle,
            {
              maxWidth: width - 48,
              backgroundColor: colors.surface,
              shadowColor: '#B85A3B',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 32,
              elevation: 24,
            }
          ]}
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export default HeritageModal;
