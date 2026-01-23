/**
 * Family Tab - Story list for family users.
 *
 * Displays stories from linked senior user.
 * Includes notification permission prompt.
 *
 * Story 4.1: Family Story List (AC: 1, 3)
 */

import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { Container } from '@/components/ui/Container';
import { FamilyStoryList } from '@/features/family-listener/components/FamilyStoryList';
import { NotificationPrompt } from '@/features/family-listener/components/NotificationPrompt';
import { useFamilyStories, useRefreshFamilyStories } from '@/features/family-listener/hooks/useFamilyStories';

export default function FamilyTab() {
  const { data: stories, isLoading, error, isRefetching } = useFamilyStories();
  const refreshStories = useRefreshFamilyStories();

  // Track if notification prompt has been dismissed this session
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(false);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshStories();
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
          error={error as Error | null}
        />
      </View>
    </Container>
  );
}
