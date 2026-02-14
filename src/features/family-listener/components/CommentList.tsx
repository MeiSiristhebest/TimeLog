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
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import type { Comment } from '../services/commentService';
import { CommentItem } from './CommentItem';
import { useHeritageTheme } from '@/theme/heritage';
import { EN_COPY } from '@/features/app/copy/en';

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
    () => <View className="h-[1px] mx-4" style={{ backgroundColor: colors.border }} />,
    [colors.border]
  );

  // Loading state
  if (isLoading && comments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText className="mt-2 text-base text-center px-8" style={{ color: colors.textMuted }}>
          {EN_COPY.comments.loadingComments}
        </AppText>
      </View>
    );
  }

  // Empty state
  if (comments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${colors.primary}20` }}>
          <Ionicons name="chatbubble-outline" size={32} color={colors.primary} />
        </View>
        <AppText className="text-lg font-medium text-center" style={{ color: colors.onSurface }}>
          {EN_COPY.comments.emptyTitle}
        </AppText>
        <AppText className="mt-2 text-base text-center px-8" style={{ color: colors.textMuted }}>
          {readOnly ? EN_COPY.comments.emptyReadOnlyDescription : EN_COPY.comments.emptyDescription}
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
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingVertical: 8 }}
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

// Default export for React.lazy() compatibility
export default CommentList;
