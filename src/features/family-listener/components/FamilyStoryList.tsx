/**
 * FamilyStoryList - List of stories for family users.
 *
 * Displays stories from linked senior user with:
 * - Skeleton loading state (no spinners per UX spec)
 * - Empty state with illustration
 * - Pull-to-refresh for manual updates
 * - FlatList with performance optimizations
 *
 * Story 4.1: Family Story List (AC: 1, 2, 5)
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { FamilyStoryCard } from './FamilyStoryCard';
import { SkeletonCard } from './SkeletonCard';
import { EmptyFamilyGallery } from './EmptyFamilyGallery';
import type { FamilyStory } from '../services/familyStoryService';
import { useHeritageTheme } from '@/theme/heritage';

type FamilyStoryListProps = {
  stories: FamilyStory[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  error?: Error | null;
};

/**
 * Loading state component with skeleton cards (UX spec: no spinners).
 */
function LoadingState(): JSX.Element {
  return (
    <View className="p-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

/**
 * Error state component with friendly message.
 */
function ErrorState({ message }: { message: string }): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View className="flex-1 items-center justify-center p-8">
      <AppText
        className="mb-2 text-center text-xl font-semibold"
        style={{ color: colors.error, fontFamily: 'Fraunces_600SemiBold' }}>
        Failed to load
      </AppText>
      <AppText className="text-center text-base" style={{ color: colors.textMuted }}>{message}</AppText>
    </View>
  );
}

export function FamilyStoryList({
  stories,
  isLoading,
  isRefreshing,
  onRefresh,
  error,
}: FamilyStoryListProps): JSX.Element {
  const router = useRouter();
  const { colors } = useHeritageTheme();

  // Handle navigation to story detail/player
  const handlePlayStory = useCallback(
    (storyId: string) => {
      router.push({
        pathname: '/story/[id]',
        params: { id: storyId },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: FamilyStory }) => (
      <Link href={{ pathname: '/story/[id]', params: { id: item.id } }} asChild>
        <FamilyStoryCard
          story={item}
          // onPress is handled by Link asChild
          onPlay={() => handlePlayStory(item.id)}
        />
      </Link>
    ),
    [handlePlayStory]
  );

  // Show loading skeleton on initial load
  if (isLoading && stories.length === 0) {
    return <LoadingState />;
  }

  // Show error state
  if (error && stories.length === 0) {
    return <ErrorState message={error.message} />;
  }

  // Show empty state when no stories exist
  if (!isLoading && stories.length === 0) {
    return <EmptyFamilyGallery />;
  }

  return (
    <FlatList
      data={stories}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      // Pull-to-refresh (AC: 5 - manual refresh option)
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      // Performance optimizations for 100+ items
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
    />
  );
}
