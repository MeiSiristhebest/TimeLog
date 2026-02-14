/**
 * Family Tab - Story list for family users.
 *
 * Displays stories from linked senior user.
 * Includes notification permission prompt.
 *
 * Story 4.1: Family Story List (AC: 1, 3)
 */

import { Container } from '@/components/ui/Container';
import { FamilyStoryList } from '@/features/family-listener/components/FamilyStoryList';
import { NotificationPrompt } from '@/features/family-listener/components/NotificationPrompt';
import { useState, useCallback } from 'react';
import { View } from 'react-native';
import {
  useFamilyStories,
  useRefreshFamilyStories,
} from '@/features/family-listener/hooks/useFamilyStories';
import { devLog } from '@/lib/devLogger';

export default function FamilyTabScreen(): JSX.Element {
  const { data: stories, isLoading, error, isRefetching } = useFamilyStories();
  const refreshStories = useRefreshFamilyStories();
  const resolvedError = error instanceof Error ? error : null;

  // Track if notification prompt has been dismissed this session
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(false);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    void refreshStories().catch((refreshError) => {
      devLog.error('[FamilyTabScreen] Failed to refresh stories:', refreshError);
    });
  }, [refreshStories]);

  // Handle notification prompt dismissal
  const handleDismissNotificationPrompt = useCallback(() => {
    setNotificationPromptDismissed(true);
  }, []);

  return (
    <Container>
      <View className="flex-1">
        {/* Notification Permission Prompt (AC: 3) */}
        {!notificationPromptDismissed && (
          <NotificationPrompt onDismiss={handleDismissNotificationPrompt} />
        )}

        {/* Story List */}
        <FamilyStoryList
          stories={stories ?? []}
          isLoading={isLoading}
          isRefreshing={isRefetching}
          onRefresh={handleRefresh}
          error={resolvedError}
        />
      </View>
    </Container>
  );
}
