/**
 * StoryList - List of story cards with sync status badges.
 *
 * Uses FlatList for performance (future: FlashList for 100+ recordings).
 * Includes empty state and skeleton loading state (no spinners per UX spec).
 *
 * Story 3.6: Added offline state support
 * - Passes isOffline and isPlayable to StoryCard for visual distinction
 * - Uses useStoryAvailability hook to compute playability
 *
 * Story 4.5: Added comment badge support
 * - Fetches unread comment counts for each story
 * - Subscribes to real-time updates for count changes
 */

import { FlatList, View, ListRenderItem } from 'react-native';
import type { AudioRecording } from '@/types/entities';
import { StoryCard } from './StoryCard';
import { SkeletonCard } from './SkeletonCard';
import { EmptyGallery } from './EmptyGallery';
import { useSyncStore } from '@/lib/sync-engine/store';
import { useStoryAvailability } from '../hooks/useStoryAvailability';
import { useUnreadCommentCounts } from '../hooks/useUnreadCommentCounts';

type StoryListProps = {
  recordings: AudioRecording[];
  onSelectStory: (id: string) => void;
  onPlayStory: (id: string) => void;
  isLoading?: boolean;
  /** Callback when user taps unavailable story (Story 3.6) */
  onUnavailableStoryTap?: (id: string) => void;
  /** Callback to delete story (Story 3.3) */
  onDeleteStory?: (id: string) => void;
  /** Optional custom renderer for list items */
  renderItem?: ListRenderItem<AudioRecording & { isPlayable: boolean }>;
  /** Optional custom separator */
  ItemSeparatorComponent?: React.ComponentType<any> | null;
  /** Apple HIG: Pull to Refresh callback */
  onRefresh?: () => void;
  /** Apple HIG: Pull to Refresh loading state */
  isRefreshing?: boolean;
};

/**
 * Loading state component with skeleton cards (UX spec: no spinners).
 */
const LoadingState = () => (
  <View className="p-4">
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </View>
);

export const StoryList = ({
  recordings,
  onSelectStory,
  onPlayStory,
  isLoading = false,
  onUnavailableStoryTap,
  onDeleteStory,
  renderItem,
  ItemSeparatorComponent,
  onRefresh,
  isRefreshing = false,
}: StoryListProps) => {
  // Story 3.6: Get network status for offline detection
  const isOnline = useSyncStore((s) => s.isOnline);
  const isOffline = !isOnline;

  // Story 3.6: Add availability status to recordings
  const storiesWithAvailability = useStoryAvailability(recordings);

  // Story 4.5: Fetch unread comment counts for all stories
  const { getCount } = useUnreadCommentCounts(recordings);

  if (isLoading) {
    return <LoadingState />;
  }

  if (recordings.length === 0) {
    return <EmptyGallery />;
  }

  // Sort by startedAt descending (newest first) - AC: 1
  const sortedRecordings = [...storiesWithAvailability].sort(
    (a, b) => b.startedAt - a.startedAt
  );

  return (
    <FlatList
      data={sortedRecordings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem || (({ item }) => (
        <StoryCard
          id={item.id}
          title={item.title ?? null}
          date={new Date(item.startedAt)}
          durationMs={item.durationMs}
          syncStatus={item.syncStatus}
          onPress={() => {
            // Story 3.6: Handle tap on unavailable story
            if (isOffline && !item.isPlayable) {
              onUnavailableStoryTap?.(item.id);
            } else {
              onSelectStory(item.id);
            }
          }}
          onPlay={() => {
            // Story 3.6: Handle play on unavailable story
            if (isOffline && !item.isPlayable) {
              onUnavailableStoryTap?.(item.id);
            } else {
              onPlayStory(item.id);
            }
          }}
          onDelete={() => onDeleteStory?.(item.id)}
          isPlayable={item.isPlayable}
          isOffline={isOffline}
          unreadCommentCount={getCount(item.id)}
        />
      ))}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={ItemSeparatorComponent}
      // Performance optimizations for 100+ items (AC: 1)
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      // Apple HIG: Pull to Refresh
      refreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  );
};
