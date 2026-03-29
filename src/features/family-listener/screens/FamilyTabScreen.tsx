/**
 * Family Tab - Story list for family users.
 *
 * Displays stories from linked senior user.
 * Includes notification permission prompt and entry points for logic.
 *
 * Story 4.1: Family Story List (AC: 1, 3)
 * FR26, FR27 Integration
 */

import { Container } from '@/components/ui/Container';
import { FamilyStoryList } from '@/features/family-listener/components/FamilyStoryList';
import { NotificationPrompt } from '@/features/family-listener/components/NotificationPrompt';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { useState, useCallback, useLayoutEffect } from 'react';
import { View } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import {
  useFamilyStories,
  useRefreshFamilyStories,
} from '@/features/family-listener/hooks/useFamilyStories';
import { devLog } from '@/lib/devLogger';
import { Icon } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { AppPressable } from '@/components/ui/AppPressable';
import * as Haptics from 'expo-haptics';

export default function FamilyTabScreen(): JSX.Element {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useHeritageTheme();
  const { data: stories, isLoading, error, isRefetching } = useFamilyStories();
  const refreshStories = useRefreshFamilyStories();
  const resolvedError = error instanceof Error ? error : null;

  // Track if notification prompt has been dismissed this session
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(false);


  // Set up header buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AppPressable 
          onPress={() => router.push(APP_ROUTES.FAMILY_MANAGEMENT)}
          haptic={Haptics.ImpactFeedbackStyle.Light}
          className="mr-4 p-1"
        >
          <Icon name="settings-outline" size={26} color={colors.onSurface} />
        </AppPressable>
      ),
    });
  }, [navigation, colors, router]);

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

  const handleAskQuestion = () => {
    router.push(APP_ROUTES.FAMILY_ASK_QUESTION);
  };

  return (
    <Container safe scrollable={false}>
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

        {/* Floating Action Button for Asking Questions (FR27) */}
        <View className="absolute bottom-6 right-5 z-10">
          <AppPressable
            onPress={handleAskQuestion}
            haptic={Haptics.ImpactFeedbackStyle.Heavy}
            className="flex-row items-center gap-2 px-6 py-4 rounded-full shadow-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <Icon name="help-circle-outline" size={24} color={colors.onPrimary} />
            <AppText variant="body" className="font-bold uppercase tracking-wider" style={{ color: colors.onPrimary }}>
              Ask Question
            </AppText>
          </AppPressable>
        </View>
      </View>
    </Container>
  );
}
