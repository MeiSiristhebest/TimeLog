/**
 * CommentList - Scrollable list of comments.
 *
 * Displays comments in chronological order with loading and empty states.
 * Auto-scrolls to bottom when new comments arrive.
 *
 * Story 4.3: Realtime Comment System (AC: 2, 3)
 */

import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../services/commentService';
import { CommentItem } from './CommentItem';
import { useHeritageTheme } from '@/theme/heritage';

type CommentListProps = {
  /** List of comments to display */
  comments: Comment[];
  /** Whether comments are loading */
  isLoading?: boolean;
  /** Current user ID (to identify own comments) */
  currentUserId?: string;
  /** Called when delete is pressed */
  onDeleteComment?: (commentId: string) => void;
  /** Whether delete is in progress */
  isDeleting?: boolean;
  /** Called on pull-to-refresh */
  onRefresh?: () => void;
  /** Whether refreshing */
  isRefreshing?: boolean;
  /** Whether to show in read-only mode (for seniors) */
  readOnly?: boolean;
};

export const CommentList = ({
  comments,
  isLoading = false,
  currentUserId,
  onDeleteComment,
  isDeleting = false,
  onRefresh,
  isRefreshing = false,
  readOnly = false,
}: CommentListProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const prevCountRef = useRef(comments.length);
  const { colors } = useHeritageTheme();

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (comments.length > prevCountRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    prevCountRef.current = comments.length;
  }, [comments.length]);

  // Loading state
  if (isLoading && comments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.messageText, { color: colors.textMuted }]}>
          Loading comments...
        </Text>
      </View>
    );
  }

  // Empty state
  if (comments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}
        >
          <Ionicons name="chatbubble-outline" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.titleText, { color: colors.onSurface }]}>
          No comments yet
        </Text>
        <Text style={[styles.messageText, { color: colors.textMuted }]}>
          {readOnly ? 'Family hasn\'t left any comments yet' : 'Be the first to comment!'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {comments.map((comment, index) => (
        <View key={comment.id}>
          <CommentItem
            comment={comment}
            isOwnComment={!readOnly && currentUserId === comment.userId}
            onDelete={onDeleteComment}
            isDeleting={isDeleting}
          />
          {/* Divider between comments */}
          {index < comments.length - 1 && (
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  messageText: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});

