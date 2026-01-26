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
import { FlatList, View, RefreshControl, StyleSheet } from 'react-native';
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
    <View style={styles.loadingContainer}>
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
    <View style={styles.errorContainer}>
      <AppText style={[styles.errorTitle, { color: colors.error }]}>Failed to load</AppText>
      <AppText style={[styles.errorMessage, { color: colors.textMuted }]}>{message}</AppText>
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
      contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Fraunces_600SemiBold',
  },
  errorMessage: {
    textAlign: 'center',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
});
