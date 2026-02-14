/**
 * TimelineStoryCard - Composite Wrapper
 *
 * Orchestrates:
 * - Date formatting logic
 * - State resolution
 * - Selection between Featured and Compact variants
 */

import { useMemo } from 'react';
import { AudioRecording } from '@/types/entities';
import { FeaturedStoryCard } from './FeaturedStoryCard';
import { CompactStoryCard } from './CompactStoryCard';

export interface TimelineStoryCardProps {
  story: AudioRecording;
  onPlay: (id: string) => void;
  onSelect: (id: string) => void;
  index: number;
  variant?: 'default' | 'featured';
  isBeingListened?: boolean;
  isPlayable?: boolean;
  isOffline?: boolean;
  unreadCommentCount?: number;
  onOffload?: () => void;
}

export function TimelineStoryCard({
  story,
  onPlay,
  onSelect,
  index,
  variant = 'default',
  isBeingListened = false,
  isPlayable = true,
  isOffline = false,
  unreadCommentCount = 0,
  onOffload,
}: TimelineStoryCardProps): JSX.Element {
  // Logic Extraction: Date Data
  // In a larger app, this `useMemo` block could be its own hook `useStoryDisplayData(story)`
  const { dateObj, fullDateStr, durationStr } = useMemo(() => {
    const createdAt = new Date(story.startedAt);
    // Use standard locale formatting
    const dateStr = createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = createdAt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Duration formatting
    const minutes = Math.floor(story.durationMs / 1000 / 60);
    const seconds = Math.floor((story.durationMs / 1000) % 60);

    return {
      dateObj: createdAt,
      fullDateStr: `${dateStr} at ${timeStr}`,
      durationStr: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    };
  }, [story.durationMs, story.startedAt]);

  // Render Variant
  if (variant === 'featured') {
    return (
      <FeaturedStoryCard
        story={story}
        index={index}
        dateObj={dateObj}
        fullDateStr={fullDateStr}
        durationStr={durationStr}
        isBeingListened={isBeingListened}
        isPlayable={isPlayable}
        isOffline={isOffline}
        unreadCommentCount={unreadCommentCount}
        onPlay={onPlay}
        onSelect={onSelect}
        onOffload={onOffload ? () => onOffload() : undefined}
      />
    );
  }

  return (
    <CompactStoryCard
      story={story}
      dateObj={dateObj}
      fullDateStr={fullDateStr}
      durationStr={durationStr}
      isPlayable={isPlayable}
      isOffline={isOffline}
      unreadCommentCount={unreadCommentCount}
      onPlay={onPlay}
      onSelect={onSelect}
      onOffload={onOffload ? () => onOffload() : undefined}
    />
  );
}
