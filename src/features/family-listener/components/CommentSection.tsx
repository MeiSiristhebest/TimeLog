/**
 * CommentSection - Complete comment interface container.
 *
 * Combines CommentList and CommentInput into a cohesive comment section.
 * Handles keyboard avoiding and overall layout.
 *
 * Story 4.3: Realtime Comment System (AC: 1, 2, 3, 4, 5)
 */

import { AppText } from '@/components/ui/AppText';
import type { ReactNode } from 'react';
import React from 'react';
import { View } from '@/tw';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '../../../theme/heritage';
import { useComments } from '../hooks/useComments';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';

type CommentSectionProps = {
  /** Story ID to show comments for */
  storyId: string;
  /** Current user ID */
  currentUserId?: string;
  /** Whether to show in read-only mode (for seniors) */
  readOnly?: boolean;
  /** Optional header component */
  header?: ReactNode;
};

export function CommentSection({
  storyId,
  currentUserId,
  readOnly = false,
  header,
}: CommentSectionProps): JSX.Element {
  const theme = useHeritageTheme();
  const {
    comments,
    isLoading,
    error,
    postComment,
    isPosting,
    deleteComment,
    isDeleting,
    isOffline,
    refetch,
  } = useComments(storyId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
        {/* Header */}
        {header || (
          <View
            className="flex-row items-center border-b px-4 py-3"
            style={{ borderColor: theme.colors.border }}>
            <Ionicons name="chatbubbles" size={20} color={theme.colors.primary} />
            <AppText
              className="ml-2 text-lg font-semibold"
              style={{ color: theme.colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}>
              Comments
            </AppText>
            {comments.length > 0 && (
              <View
                className="ml-2 rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${theme.colors.primary}20` }}>
                <AppText className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                  {comments.length}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* Error state */}
        {error && (
          <View
            className="mx-4 my-2 flex-row items-center rounded-lg p-3"
            style={{ backgroundColor: `${theme.colors.error}15` }}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
            <AppText className="ml-2 flex-1 text-sm" style={{ color: theme.colors.error }}>
              Failed to load comments, pull to refresh
            </AppText>
          </View>
        )}

        {/* Comment list */}
        <CommentList
          comments={comments}
          isLoading={isLoading}
          currentUserId={currentUserId}
          onDeleteComment={readOnly ? undefined : deleteComment}
          isDeleting={isDeleting}
          onRefresh={refetch}
          isRefreshing={isLoading}
          readOnly={readOnly}
        />

        {/* Comment input (only for family users, not seniors) */}
        {!readOnly && (
          <CommentInput onSend={postComment} isSending={isPosting} isOffline={isOffline} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
