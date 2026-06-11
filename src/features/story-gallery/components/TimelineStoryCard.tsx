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
import { useTranslation } from '@/lib/i18n/useTranslation';

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
  onOffload?: (id: string) => void;
  /** Whether the story is favorited (Story 3.6) */
  isFavorite?: boolean;
  /** Callback to toggle favorite (Story 3.6) */
  onToggleFavorite?: (id: string) => void;
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
  isFavorite = false,
  onToggleFavorite,
}: TimelineStoryCardProps): JSX.Element {
  const { t, locale } = useTranslation();

  // Logic Extraction: Date Data
  // In a larger app, this `useMemo` block could be its own hook `useStoryDisplayData(story)`
  const { dateObj, fullDateStr, durationStr } = useMemo(() => {
    const createdAt = new Date(story.startedAt);
    // Use standard locale formatting
    const dateStr = createdAt.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = createdAt.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Duration formatting
    const minutes = Math.floor(story.durationMs / 1000 / 60);
    const seconds = Math.floor((story.durationMs / 1000) % 60);

    return {
      dateObj: createdAt,
      fullDateStr: t('Gallery.detail.dateAtTime', { date: dateStr, time: timeStr, defaultValue: `${dateStr} at ${timeStr}` }),
      durationStr: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    };
  }, [story.durationMs, story.startedAt, locale, t]);

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
        onOffload={onOffload ? () => onOffload(story.id) : undefined}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
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
      onOffload={onOffload ? () => onOffload(story.id) : undefined}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
    />
  );
}
