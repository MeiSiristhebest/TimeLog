import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { CountdownRing } from './CountdownRing';
import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { Pressable } from 'react-native';

interface UndoToastProps {
  /** Whether the toast is visible */
  visible: boolean;
  /** Text to display */
  message?: string;
  /** Callback when user taps undo */
  onUndo: () => void;
  /** Callback when 10s timer expires */
  onTimeout?: () => void;
}

/**
 * Undo Toast with countdown ring.
 * Implements AC: 1, 2 from Story 3.3
 *
 * UX:
 * - Appears for 10 seconds
 * - Shows visual countdown
 * - Tap anywhere to undo
 * - Dismisses on timeout
 */
export function UndoToast({
  visible,
  message = 'Story deleted. Tap to undo',
  onUndo,
  onTimeout,
}: UndoToastProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOutDown}
      className="absolute right-4 bottom-6 left-4 z-50"
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert">
      <Pressable
        onPress={onUndo}
        style={{
          backgroundColor: '#2C221F', // Espresso
          borderRadius: 16,
          padding: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#2C221F',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 10,
          borderWidth: 1,
          borderColor: 'rgba(201, 169, 97, 0.2)', // Subtle gold border
        }}
        accessibilityLabel={`${message}. Double tap to undo.`}>
        <AppText
          style={{
            color: '#FFF8E7',
            fontSize: 16,
            fontWeight: '500',
            flex: 1,
            marginRight: 16,
          }}>
          {message}
        </AppText>

        <CountdownRing
          durationMs={10000}
          size={28}
          strokeWidth={3}
          onComplete={onTimeout}
          isPlaying={visible}
        />
      </Pressable>
    </Animated.View>
  );
}
