/**
 * SwipeableStoryCard - Wrapper for StoryCard with swipe-to-delete gesture.
 *
 * Implements Apple-style swipe actions for native feel.
 * Uses react-native-gesture-handler for smooth gesture handling.
 */

import { useCallback, useRef, type ReactNode } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '@/theme/heritage';

interface SwipeableStoryCardProps {
  children: ReactNode;
  onDelete?: () => void;
}

export function SwipeableStoryCard({ children, onDelete }: SwipeableStoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = useCallback(() => {
    // Haptic feedback for destructive action
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    swipeableRef.current?.close();
    onDelete?.();
  }, [onDelete]);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ): JSX.Element => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            backgroundColor: colors.error,
            opacity,
            transform: [{ translateX }],
          },
        ]}>
        <View style={styles.deleteContent}>
          <Ionicons name="trash" size={24} color="#FFF" />
        </View>
      </Animated.View>
    );
  };

  if (!onDelete) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          handleDelete();
        }
      }}
      rightThreshold={80}
      overshootRight={false}
      friction={2}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderRadius: 20,
    marginBottom: 14,
    marginLeft: -20, // Overlap with card
  },
  deleteContent: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
