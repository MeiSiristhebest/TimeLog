/**
 * CommentList - Scrollable list of comments.
 *
 * Displays comments in chronological order with loading and empty states.
 * Auto-scrolls to bottom when new comments arrive.
 *
 * Story 4.3: Realtime Comment System (AC: 2, 3)
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback, useEffect, useRef } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import type { Comment } from '../services/commentService';
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

export function CommentList({
  comments,
  isLoading = false,
  currentUserId,
  onDeleteComment,
  isDeleting = false,
  onRefresh,
  isRefreshing = false,
  readOnly = false,
}: CommentListProps): JSX.Element {
  const listRef = useRef<FlatList<Comment>>(null);
  const prevCountRef = useRef(comments.length);
  const { colors } = useHeritageTheme();

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (comments.length > prevCountRef.current) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    prevCountRef.current = comments.length;
  }, [comments.length]);

  const renderItem = useCallback(
    ({ item }: { item: Comment }) => (
      <View>
        <CommentItem
          comment={item}
          isOwnComment={!readOnly && currentUserId === item.userId}
          onDelete={onDeleteComment}
          isDeleting={isDeleting}
        />
      </View>
    ),
    [currentUserId, isDeleting, onDeleteComment, readOnly]
  );

  const itemSeparator = useCallback(
    () => <View style={[styles.divider, { backgroundColor: colors.border }]} />,
    [colors.border]
  );

  // Loading state
  if (isLoading && comments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={[styles.messageText, { color: colors.textMuted }]}>
          Loading comments...
        </AppText>
      </View>
    );
  }

  // Empty state
  if (comments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="chatbubble-outline" size={32} color={colors.primary} />
        </View>
        <AppText style={[styles.titleText, { color: colors.onSurface }]}>No comments yet</AppText>
        <AppText style={[styles.messageText, { color: colors.textMuted }]}>
          {readOnly ? "Family hasn't left any comments yet" : 'Be the first to comment!'}
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={comments}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      ItemSeparatorComponent={itemSeparator}
      showsVerticalScrollIndicator={false}
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
    />
  );
}

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

// Default export for React.lazy() compatibility
export default CommentList;
