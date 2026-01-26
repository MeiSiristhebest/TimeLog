
import React, { useCallback, useEffect } from 'react';
import {
  ListRenderItem,
  type FlatListProps,
  Platform,
} from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { View } from '@/tw';
import type { AudioRecording } from '@/types/entities';
import { StoryCard } from './StoryCard';
import { SkeletonCard } from './SkeletonCard';
import { EmptyGallery } from './EmptyGallery';
import { useSyncStore } from '@/lib/sync-engine/store';
import { useStoryAvailability } from '../hooks/useStoryAvailability';
import { useUnreadCommentCounts } from '../hooks/useUnreadCommentCounts';



import { FlatList } from 'react-native'; // Keep for types

import { TimelineLayout } from './TimelineLayout';
import { TimelineStoryCard } from './TimelineStoryCard';

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
  ItemSeparatorComponent?: FlatListProps<
    AudioRecording & { isPlayable: boolean }
  >['ItemSeparatorComponent'];
  /** Apple HIG: Pull to Refresh callback */
  onRefresh?: () => void;
  /** Apple HIG: Pull to Refresh loading state */
  isRefreshing?: boolean;
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

export function StoryList({
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
}: StoryListProps): JSX.Element {
  // Story 3.6: Get network status for offline detection
  const isOnline = useSyncStore((s) => s.isOnline);
  const isOffline = !isOnline;

  // Story 3.6: Add availability status to recordings
  const storiesWithAvailability = useStoryAvailability(recordings);

  // Story 4.5: Fetch unread comment counts for all stories
  const { getCount } = useUnreadCommentCounts(recordings);

  // Note: We don't sort here anymore, we respect the order passed from parent
  // Parent (useStoryGallery) handles promotion logic
  const displayStories = storiesWithAvailability;

  const renderTimelineItem = useCallback(
    ({ item, index }: { item: AudioRecording & { isPlayable: boolean }; index: number }) => (
      <TimelineStoryCard
        story={item}
        index={index}
        onSelect={onSelectStory} // Pass promote action
        onPlay={() => {
          if (isOffline && !item.isPlayable) {
            onUnavailableStoryTap?.(item.id);
          } else {
            onPlayStory(item.id);
          }
        }}
        variant={index === 0 ? 'featured' : 'default'}
        isPlayable={item.isPlayable}
        isOffline={isOffline}
        unreadCommentCount={getCount(item.id)}
      />
    ),
    [isOffline, onPlayStory, onSelectStory, onUnavailableStoryTap]
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (recordings.length === 0) {
    return <EmptyGallery />;
  }

  return (
    <TimelineLayout>
      <Animated.FlatList
        data={displayStories}
        keyExtractor={(item) => item.id}
        renderItem={renderTimelineItem}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 120, // Extra padding for tab bar/FAB
          // paddingHorizontal removed for full-width timeline alignment
        }}
        showsVerticalScrollIndicator={false}
        // Performance optimizations for 100+ items (AC: 1)
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        // Apple HIG: Pull to Refresh
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        // Reanimated Layout Transition
        itemLayoutAnimation={LinearTransition.springify()}
      />
    </TimelineLayout>
  );
}

