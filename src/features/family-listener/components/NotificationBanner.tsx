/**
 * NotificationBanner - In-app notification banner for foreground notifications.
 *
 * Displays when a push notification arrives while the app is in the foreground.
 * Tapping navigates to the relevant story.
 *
 * Story 4.4: Push Notification & Deep Link (AC: 4)
 */

import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NotificationData } from '@/lib/notifications';
import { useHeritageTheme } from '@/theme/heritage';

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
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Slide in animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  const handlePress = () => {
    // Slide out animation before navigating
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onPress(data);
    });
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
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
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}. Tap to view`}
        accessibilityHint="Tap to open the related story"
        style={[
          styles.banner,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
            borderLeftColor: colors.primary,
          },
        ]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name={getIcon()} size={22} color={colors.primary} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <AppText style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {title}
          </AppText>
          <AppText style={[styles.body, { color: colors.textMuted }]} numberOfLines={2}>
            {body}
          </AppText>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          style={[styles.dismissButton, { backgroundColor: `${colors.onSurface}10` }]}>
          <Ionicons name="close" size={16} color={colors.onSurface} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  banner: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: 3,
  },
  body: {
    fontSize: 14,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
