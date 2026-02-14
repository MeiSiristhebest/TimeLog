import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '../../../theme/heritage';
import type { Comment } from '../services/commentService';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { View, Pressable } from 'react-native';

/**
 * CommentItem - Single comment display component.
 *
 * Displays a comment with author name, timestamp, and content.
 * Supports deletion for own comments.
 *
 * Story 4.3: Realtime Comment System (AC: 2)
 */

// ... imports

type CommentItemProps = {
  /** Comment data to display */
  comment: Comment;
  /** Whether this comment belongs to the current user */
  isOwnComment?: boolean;
  /** Called when delete is pressed (only for own comments) */
  onDelete?: (commentId: string) => void;
  /** Whether delete is in progress */
  isDeleting?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RELATIVE_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

// ... formatRelativeTime function

export function CommentItem({
  comment,
  isOwnComment = false,
  onDelete,
  isDeleting = false,
}: CommentItemProps): JSX.Element {
  const theme = useHeritageTheme();
  const isPending = comment.id.startsWith('temp-');
  const deleteScale = useSharedValue(1);
  const relativeTime = RELATIVE_DATE_FORMATTER.format(new Date(comment.createdAt));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  return (
    <View
      className="px-4 py-3"
      style={{ opacity: isPending ? 0.6 : 1 }}
      accessibilityRole="text"
      accessibilityLabel={`${comment.userName} says: ${comment.content}, ${relativeTime}`}>
      {/* Header: Name and Time */}
      <View className="mb-1 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <AppText
            className="text-base"
            style={{ color: theme.colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}>
            {comment.userName}
          </AppText>
          <AppText className="ml-2 text-sm" style={{ color: `${theme.colors.onSurface}99` }}>
            {isPending ? 'Sending...' : relativeTime}
          </AppText>
        </View>

        {/* Delete button for own comments */}
        {isOwnComment && onDelete && !isPending && (
          <AnimatedPressable
            onPress={() => onDelete(comment.id)}
            onPressIn={() => {
              deleteScale.value = withSpring(0.9);
            }}
            onPressOut={() => {
              deleteScale.value = withSpring(1);
            }}
            disabled={isDeleting}
            className="p-2"
            style={deleteAnimatedStyle}
            accessibilityRole="button"
            accessibilityLabel="Delete comment"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name="trash-outline"
              size={18}
              color={isDeleting ? theme.colors.border : `${theme.colors.onSurface}66`}
            />
          </AnimatedPressable>
        )}
      </View>

      {/* Content */}
      <AppText className="text-base leading-6" style={{ color: theme.colors.onSurface }}>
        {comment.content}
      </AppText>
    </View>
  );
}
