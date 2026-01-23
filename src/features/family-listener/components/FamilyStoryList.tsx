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

import { FlatList, View, Text, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
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
const LoadingState = () => (
  <View style={styles.loadingContainer}>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </View>
);

/**
 * Error state component with friendly message.
 */
const ErrorState = ({ message }: { message: string }) => {
  const { colors } = useHeritageTheme();

  return (
    <View style={styles.errorContainer}>
      <Text
        style={[styles.errorTitle, { color: colors.error }]}
      >
        Failed to load
      </Text>
      <Text style={[styles.errorMessage, { color: colors.textMuted }]}>
        {message}
      </Text>
    </View>
  );
};

export const FamilyStoryList = ({
  stories,
  isLoading,
  isRefreshing,
  onRefresh,
  error,
}: FamilyStoryListProps) => {
  const router = useRouter();
  const { colors } = useHeritageTheme();

  // Handle navigation to story detail/player
  const handleSelectStory = (storyId: string) => {
    router.push({
      pathname: '/story/[id]',
      params: { id: storyId },
    });
  };

  const handlePlayStory = (storyId: string) => {
    router.push({
      pathname: '/story/[id]',
      params: { id: storyId },
    });
  };

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
      renderItem={({ item }) => (
        <FamilyStoryCard
          story={item}
          onPress={() => handleSelectStory(item.id)}
          onPlay={() => handlePlayStory(item.id)}
        />
      )}
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
};

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

