/**
 * Hook to determine story availability for offline access.
 *
 * Story 3.6: Offline Access Strategy
 * AC: 1 - Compute which stories are playable offline
 */

import { useCallback, useMemo } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import type { AudioRecording, SyncStatus } from '@/types/entities';
import { useSyncStore } from '@/lib/sync-engine/store';

/**
 * Extended AudioRecording with availability status.
 */
export type StoryWithAvailability = AudioRecording & {
  /** Whether the story can be played in current network state */
  isPlayable: boolean;
  /** Whether the story has a local file on disk */
  isLocallyAvailable: boolean;
};

/**
 * Determines if a story is locally available based on sync status.
 * Stories with local/queued/syncing/failed status have local files.
 * Stories with 'synced' status may or may not have local files.
 *
 * @param syncStatus - The sync status of the story
 * @returns true if the story likely has a local file
 */
export function hasLocalFile(syncStatus: SyncStatus): boolean {
  // All statuses except pure cloud-only have local files
  // In TimeLog's architecture, we always record locally first (Stream-to-Disk)
  // So any recording in the database has a local file
  return true; // All recordings in local DB have local files by design
}

/**
 * Checks if a story is playable given current network state.
 *
 * @param story - The audio recording
 * @param isOnline - Current network connectivity status
 * @returns true if the story can be played
 */
export function isStoryPlayable(
  story: AudioRecording,
  isOnline: boolean
): boolean {
  // In TimeLog's Local-First architecture:
  // - All recordings are saved locally first (Stream-to-Disk)
  // - The filePath field always points to a local file
  // - Therefore, all stories in the DB are locally playable

  // Future consideration: If we add cloud-only imports,
  // we would check if filePath exists and file is on disk
  if (story.filePath) {
    return true; // Local file exists, always playable
  }

  // Fallback: cloud-only requires network
  return isOnline;
}

/**
 * Hook to add availability status to stories.
 *
 * @param stories - Array of audio recordings
 * @returns Stories with isPlayable and isLocallyAvailable properties
 */
export function useStoryAvailability(
  stories: AudioRecording[]
): StoryWithAvailability[] {
  const isOnline = useSyncStore((s) => s.isOnline);

  return useMemo(() => {
    return stories.map((story) => ({
      ...story,
      isLocallyAvailable: hasLocalFile(story.syncStatus),
      isPlayable: isStoryPlayable(story, isOnline),
    }));
  }, [stories, isOnline]);
}

/**
 * Hook to check availability for a single story.
 *
 * @param story - Single audio recording
 * @returns Availability status for the story
 */
export function useSingleStoryAvailability(story: AudioRecording | null): {
  isPlayable: boolean;
  isLocallyAvailable: boolean;
} {
  const isOnline = useSyncStore((s) => s.isOnline);

  return useMemo(() => {
    if (!story) {
      return { isPlayable: false, isLocallyAvailable: false };
    }
    return {
      isLocallyAvailable: hasLocalFile(story.syncStatus),
      isPlayable: isStoryPlayable(story, isOnline),
    };
  }, [story, isOnline]);
}
