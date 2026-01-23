/**
 * CommentItem - Single comment display component.
 *
 * Displays a comment with author name, timestamp, and content.
 * Supports deletion for own comments.
 *
 * Story 4.3: Realtime Comment System (AC: 2)
 */

import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeritageTheme } from '../../../theme/heritage';
import { Comment } from '../services/commentService';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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

/**
 * Formats timestamp to relative time in English.
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  // For older comments, show absolute date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

export const CommentItem = ({
  comment,
  isOwnComment = false,
  onDelete,
  isDeleting = false,
}: CommentItemProps) => {
  const theme = useHeritageTheme();
  const isPending = comment.id.startsWith('temp-');
  const deleteScale = useSharedValue(1);

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  return (
    <View
      className="px-4 py-3"
      style={{ opacity: isPending ? 0.6 : 1 }}
      accessibilityRole="text"
      accessibilityLabel={`${comment.userName} says: ${comment.content}, ${formatRelativeTime(comment.createdAt)}`}
    >
      {/* Header: Name and Time */}
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center flex-1">
          <Text
            className="text-base"
            style={{ color: theme.colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}
          >
            {comment.userName}
          </Text>
          <Text
            className="ml-2 text-sm"
            style={{ color: `${theme.colors.onSurface}99` }}
          >
            {isPending ? 'Sending...' : formatRelativeTime(comment.createdAt)}
          </Text>
        </View>

        {/* Delete button for own comments */}
        {isOwnComment && onDelete && !isPending && (
          <AnimatedPressable
            onPress={() => onDelete(comment.id)}
            onPressIn={() => { deleteScale.value = withSpring(0.9); }}
            onPressOut={() => { deleteScale.value = withSpring(1); }}
            disabled={isDeleting}
            className="p-2"
            style={deleteAnimatedStyle}
            accessibilityRole="button"
            accessibilityLabel="Delete comment"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={isDeleting ? theme.colors.border : `${theme.colors.onSurface}66`}
            />
          </AnimatedPressable>
        )}
      </View>

      {/* Content */}
      <Text
        className="text-base leading-6"
        style={{ color: theme.colors.onSurface }}
      >
        {comment.content}
      </Text>
    </View>
  );
};
