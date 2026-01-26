import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Semantic Haptic Feedback Utility
 * Provides standardized tactile feedback for interactions.
 * Gracefully degrades on unsupported platforms.
 */

export const triggerHaptic = {
  /**
   * Light impact for standard interactions like toggles or button presses.
   */
  selection: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore errors on unsupported devices
    }
  },

  /**
   * Medium impact for successful actions like saving or confirming.
   */
  success: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore
    }
  },

  /**
   * Heavy impact for errors or destructive actions.
   */
  error: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ignore
    }
  },

  /**
   * Warning vibration.
   */
  warning: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignore
    }
  },

  /**
   * Rigid impact for UI boundaries or locking.
   */
  impactLight: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
  },
};
