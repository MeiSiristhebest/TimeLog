import { AppText } from '@/components/ui/AppText';
import React, { useEffect } from 'react';
import { Modal, View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming, } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';
import { HeritageButton } from '../../../components/ui/heritage/HeritageButton';

interface DeleteConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  storyTitle?: string;
}

/**
 * Delete confirmation modal - Heritage Final Design.
 * Features:
 * - Large Danger Icon
 * - Clear Reassurance Copy ("Bin", "30 days")
 * - Vertical Button Stack (HFE optimized)
 * - Pop-in Animation
 */
export function DeleteConfirmModal({
  visible,
  onCancel,
  onConfirm,
  storyTitle,
}: DeleteConfirmModalProps) {
  const theme = useHeritageTheme();

  // Animation Values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      // 2026 UX: Warning haptic when destructive modal appears
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [visible, opacity, scale]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none" // Managed by Reanimated
      onRequestClose={onCancel}
      statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {/* Dimmed Backdrop */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', // Note: Only works on some platforms/web, harmless on others
            },
            animatedBackdropStyle,
          ]}
        />

        {/* Modal Content */}
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 360,
              backgroundColor: theme.colors.surface, // Light/Dark adaptive
              borderRadius: 32,
              padding: 32,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            },
            animatedContainerStyle,
          ]}>
          {/* Large Danger Icon */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: `${theme.colors.error}15`, // Light Red
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}>
            <Ionicons name="trash" size={36} color={theme.colors.error} />
          </View>

          {/* Text Content */}
          <AppText
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 26,
              color: theme.colors.onSurface,
              textAlign: 'center',
              marginBottom: 12,
              lineHeight: 32,
            }}>
            Delete this story?
          </AppText>

          <AppText
            style={{
              fontSize: 17,
              color: theme.colors.textMuted,
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24,
            }}>
            It will move to the{' '}
            <AppText style={{ fontWeight: '700', color: theme.colors.error }}>Bin</AppText>.
          </AppText>
          <AppText
            style={{
              fontSize: 17,
              color: theme.colors.textMuted,
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24,
            }}>
            You can recover it for{' '}
            <AppText style={{ fontWeight: '700', color: theme.colors.onSurface }}>30 days</AppText>.
          </AppText>

          {/* Action Buttons - Vertical Stack */}
          <View style={{ width: '100%', gap: 12 }}>
            <HeritageButton
              title="Yes, Delete Story"
              onPress={onConfirm}
              variant="primary"
              style={{
                backgroundColor: theme.colors.error,
                borderRadius: 99, // Pill shape
                height: 56,
              }}
              textStyle={{ fontSize: 18, fontWeight: '700' }}
              fullWidth
            />

            <HeritageButton
              title="Cancel"
              onPress={onCancel}
              variant="ghost"
              style={{
                borderRadius: 99,
                height: 56,
                backgroundColor: theme.colors.surfaceDim,
              }}
              textStyle={{ fontSize: 18, color: theme.colors.textMuted, fontWeight: '600' }}
              fullWidth
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
