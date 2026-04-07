import React, { useCallback, useMemo } from 'react';
import type { AudioRecording } from '@/types/entities';
import { SkeletonCard } from './SkeletonCard';
import { EmptyGallery } from './EmptyGallery';
import { AppText } from '@/components/ui/AppText';
import { useSyncStore } from '@/lib/sync-engine/store';
import { useStoryAvailability } from '../hooks/useStoryAvailability';
import { useUnreadCommentCounts } from '../hooks/useUnreadCommentCounts';
import { useHeritageTheme } from '@/theme/heritage';
import { ListRenderItem, type FlatListProps, View } from 'react-native';
import { Animated } from '@/tw/animated';

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
  /** Callback to offload story (Local Delete) */
  onOffloadStory?: (id: string) => void;
  /** Callback to toggle favorite (Story 3.6) */
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  /** Optional custom renderer for list items */
  renderItem?: ListRenderItem<AudioRecording & { isPlayable: boolean; isFavorite?: boolean }>;
  /** Optional custom separator */
  ItemSeparatorComponent?: FlatListProps<
    AudioRecording & { isPlayable: boolean; isFavorite?: boolean }
  >['ItemSeparatorComponent'];
  /** Apple HIG: Pull to Refresh callback */
  onRefresh?: () => void;
  /** Apple HIG: Pull to Refresh loading state */
  isRefreshing?: boolean;
  /** Optional extra data to force re-render */
  extraData?: any;
};

type StoryListRow =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'story'; id: string; story: AudioRecording & { isPlayable: boolean; isFavorite?: boolean }; storyIndex: number };

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

function getGroupLabel(date: Date): 'Today' | 'This Week' | 'Older' {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysDiff = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (daysDiff <= 0) return 'Today';
  if (daysDiff <= 7) return 'This Week';
  return 'Older';
}

export function StoryList({
  recordings,
  onSelectStory,
  onPlayStory,
  isLoading = false,
  onUnavailableStoryTap,
  onDeleteStory,
  onOffloadStory,
  renderItem,
  ItemSeparatorComponent,
  onRefresh,
  isRefreshing = false,
  onToggleFavorite,
  extraData,
}: StoryListProps): JSX.Element {
  const { colors } = useHeritageTheme();
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
  const listRows = useMemo(() => {
    const rows: StoryListRow[] = [];
    const grouped: Record<'Today' | 'This Week' | 'Older', (AudioRecording & { isPlayable: boolean })[]> = {
      Today: [],
      'This Week': [],
      Older: [],
    };

    displayStories.forEach((story) => {
      const label = getGroupLabel(new Date(story.startedAt));
      grouped[label].push(story);
    });

    let storyIndex = 0;
    (['Today', 'This Week', 'Older'] as const).forEach((label) => {
      const stories = grouped[label];
      if (stories.length === 0) return;
      rows.push({ kind: 'header', id: `header-${label}`, title: label });
      stories.forEach((story) => {
        rows.push({ kind: 'story', id: story.id, story, storyIndex });
        storyIndex += 1;
      });
    });

    return rows;
  }, [displayStories]);

  const renderTimelineItem = useCallback(
    ({ item, index }: { item: AudioRecording & { isPlayable: boolean; isFavorite?: boolean }; index: number }) => (
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
        onOffload={onOffloadStory ? (id) => onOffloadStory(id) : undefined}
        variant={index === 0 ? 'featured' : 'default'}
        isPlayable={item.isPlayable}
        isOffline={isOffline}
        unreadCommentCount={getCount(item.id)}
        isFavorite={item.isFavorite}
        onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id, !item.isFavorite) : undefined}
      />
    ),
    [isOffline, onPlayStory, onSelectStory, onUnavailableStoryTap, onOffloadStory, getCount, onToggleFavorite]
  );

  const renderRow = useCallback(
    ({ item }: { item: StoryListRow }) => {
      if (item.kind === 'header') {
        return (
          <View className="px-4 pt-4 pb-2">
            <AppText className="text-base font-semibold tracking-wide" style={{ color: colors.textMuted }}>
              {item.title}
            </AppText>
          </View>
        );
      }

      if (renderItem) {
        return renderItem({
          item: item.story,
          index: item.storyIndex,
          separators: {
            highlight: () => {},
            unhighlight: () => {},
            updateProps: () => {},
          },
        });
      }

      return renderTimelineItem({ item: item.story, index: item.storyIndex });
    },
    [colors.textMuted, renderItem, renderTimelineItem]
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
        data={listRows}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
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
        extraData={extraData}
        initialNumToRender={6}
        updateCellsBatchingPeriod={30}
      />
    </TimelineLayout>
  );
}
