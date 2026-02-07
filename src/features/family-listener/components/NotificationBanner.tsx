import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NotificationData } from '@/lib/notifications';
import { useHeritageTheme } from '@/theme/heritage';

/**
 * NotificationBanner - In-app notification banner for foreground notifications.
 *
 * Displays when a push notification arrives while the app is in the foreground.
 * Tapping navigates to the relevant story.
 *
 * Story 4.4: Push Notification & Deep Link (AC: 4)
 */

interface NotificationBannerProps {
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Notification data for navigation */
  data: NotificationData;
  /** Called when banner is tapped */
  onPress: (data: NotificationData) => void;
  /** Called when banner is dismissed */
  onDismiss: () => void;
}

export function NotificationBanner({
  title,
  body,
  data,
  onPress,
  onDismiss,
}: NotificationBannerProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const { colors } = useHeritageTheme();

  const translateY = useSharedValue(-150); // Start off-screen
  const opacity = useSharedValue(0);

  // Slide in animation on mount
  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const animateOut = (callback: () => void) => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-150, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(callback)();
      }
    });
  };

  const handlePress = () => {
    animateOut(() => onPress(data));
  };

  const handleDismiss = () => {
    animateOut(() => onDismiss());
  };

  // Determine icon based on notification type
  const getIcon = () => {
    if (data.type === 'new_comment') {
      return 'chatbubble';
    }
    return 'musical-notes';
  };

  return (
    <Animated.View
      className="absolute left-4 right-4 z-[1000]"
      style={[
        {
          top: insets.top + 8,
        },
        animatedStyle,
      ]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}. Tap to view`}
        accessibilityHint="Tap to open the related story"
        className="rounded-[20px] p-4 flex-row items-center border-l-4 shadow-lg elevation-10"
        style={[
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
            borderLeftColor: colors.primary,
          },
        ]}>
        {/* Icon */}
        <View
          className="w-12 h-12 rounded-full justify-center items-center mr-3.5"
          style={{ backgroundColor: `${colors.primary}15` }}>
          <Ionicons name={getIcon()} size={22} color={colors.primary} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <AppText
            className="text-[17px] font-semibold mb-1"
            style={{ color: colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}
            numberOfLines={1}>
            {title}
          </AppText>
          <AppText className="text-sm" style={{ color: colors.textMuted }} numberOfLines={2}>
            {body}
          </AppText>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          className="w-8 h-8 rounded-full justify-center items-center ml-2.5"
          style={{ backgroundColor: `${colors.onSurface}10` }}>
          <Ionicons name="close" size={16} color={colors.onSurface} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
