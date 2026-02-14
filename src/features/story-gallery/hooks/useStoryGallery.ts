import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { asc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useStories } from '../hooks/useStories';
import { softDeleteStory, restoreStory, offloadStory } from '../services/storyService';
import {
  showSuccessToast,
  showErrorToast,
  showOfflineUnavailableToast,
} from '@/components/ui/feedback/toast';
import { FilterCategory, GALLERY_STRINGS, mapRawCategoryToFilter } from '../data/mockGalleryData';
import { SortOption } from '../components/SortOptionsModal';
import { getQuestionById, TOPIC_QUESTIONS } from '@/features/recorder/data/topicQuestions';
import { db } from '@/db/client';
import { transcriptSegments } from '@/db/schema';

const SEARCH_DEBOUNCE_MS = 180;

export function useStoryGallery() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const matchingTopicIds = useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    const matched = new Set<string>();

    TOPIC_QUESTIONS.forEach((question) => {
      const text = question.text.trim().toLowerCase();
      const rawCategory = (question.category ?? 'general').trim().toLowerCase();
      const mappedCategory = mapRawCategoryToFilter(rawCategory);
      const categoryTokens = [rawCategory, rawCategory.replace(/_/g, ' '), mappedCategory];

      const matchesText = text.includes(normalizedQuery);
      const matchesCategory = categoryTokens.some(
        (token) => token.includes(normalizedQuery) || normalizedQuery.includes(token)
      );

      if (matchesText || matchesCategory) {
        matched.add(question.id);
      }
    });

    return [...matched];
  }, [debouncedSearchQuery]);
  const { data: segments } = useLiveQuery(
    db.select().from(transcriptSegments).orderBy(asc(transcriptSegments.storyId), asc(transcriptSegments.segmentIndex))
  );

  const matchingStoryIds = useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    const matched = new Set<string>();
    (segments ?? []).forEach((segment) => {
      const text = segment.text.trim().toLowerCase();
      if (!text) {
        return;
      }
      if (text.includes(normalizedQuery)) {
        matched.add(segment.storyId);
      }
    });

    return [...matched];
  }, [debouncedSearchQuery, segments]);

  const { stories, isLoading } = useStories({
    searchQuery: debouncedSearchQuery,
    matchingTopicIds,
    matchingStoryIds,
  });

  // Local State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Focused Story State (for expansion interaction)
  const [focusedStoryId, setFocusedStoryId] = useState<string | null>(null);

  // Reset focus when filter changes (impl in handler to avoid useEffect re-render)
  const handleSetFilter = useCallback((newFilter: FilterCategory) => {
    setFilter(newFilter);
    setFocusedStoryId(null);
  }, []);

  // Computed Strings
  const subtitle = `${stories.filter((s) => !s.deletedAt).length}${GALLERY_STRINGS.header.subtitleSuffix}`;
  const transcriptFallbackByStoryId = useMemo(() => {
    const fallback = new Map<string, string[]>();
    const finalOnly = new Map<string, string[]>();

    (segments ?? []).forEach((segment) => {
      const text = segment.text.trim();
      if (!text) return;

      const fallbackList = fallback.get(segment.storyId) ?? [];
      fallbackList.push(text);
      fallback.set(segment.storyId, fallbackList);

      if (segment.isFinal) {
        const finalList = finalOnly.get(segment.storyId) ?? [];
        finalList.push(text);
        finalOnly.set(segment.storyId, finalList);
      }
    });

    const result = new Map<string, string>();
    fallback.forEach((_, storyId) => {
      const source = finalOnly.get(storyId) ?? fallback.get(storyId) ?? [];
      const merged = source.join(' ').trim();
      if (merged.length > 0) {
        result.set(storyId, merged);
      }
    });

    return result;
  }, [segments]);

  // Derived Data
  const recordings = useMemo(() => {
    const activeStories = stories.filter((story) => !story.deletedAt);

    const filtered =
      filter === 'all'
        ? activeStories
        : activeStories.filter((story) => {
          if (!story.topicId) return false;

          const question = getQuestionById(story.topicId);
          if (!question?.category) return false;

          // Use centralized mapping
          const mapped = mapRawCategoryToFilter(question.category);
          return mapped === filter;
        });

    // 1. Sort Logic - Pure chronological/etc
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        case 'oldest':
          return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        case 'longest':
          return (b.durationMs || 0) - (a.durationMs || 0);
        case 'shortest':
          return (a.durationMs || 0) - (b.durationMs || 0);
        default:
          return 0;
      }
    });

    // NO Reordering for "Promotion". List stays consistent.
    // Focus is purely visual.

    return sorted.map((record) => ({
      id: record.id,
      title: record.title,
      filePath: record.filePath,
      startedAt: record.startedAt,
      endedAt: record.endedAt ?? undefined,
      durationMs: record.durationMs,
      sizeBytes: record.sizeBytes,
      syncStatus: record.syncStatus as 'local' | 'queued' | 'syncing' | 'synced' | 'failed',
      checksumMd5: record.checksumMd5,
      topicId: record.topicId,
      userId: record.userId,
      deviceId: record.deviceId,
      transcription: record.transcription?.trim()
        ? record.transcription
        : transcriptFallbackByStoryId.get(record.id) ?? null,
      coverImagePath: record.coverImagePath,
      isOffloaded: record.filePath === 'OFFLOADED',
    }));
  }, [stories, filter, sortOption, transcriptFallbackByStoryId]);

  // Handlers
  const handleSelectStory = useCallback((id: string) => {
    // Unfocus if already focused? Or just focus.
    // User says "Original big card becomes small". So focus switches.
    setFocusedStoryId(id);
  }, []);

  const handlePlayStory = useCallback(
    (id: string) => {
      setFocusedStoryId(id);
      // "Clicking play enters detail page"
      router.push({ pathname: '/story/[id]', params: { id } });
    },
    [router]
  );

  const handleUnavailableStoryTap = useCallback(() => {
    showOfflineUnavailableToast();
  }, []);

  const handleDeleteStory = useCallback((id: string) => {
    setStoryToDelete(id);
    setDeleteModalVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!storyToDelete) return;
    try {
      await softDeleteStory(storyToDelete);
      setLastDeletedId(storyToDelete);
      setDeleteModalVisible(false);
      setUndoToastVisible(true);
      setStoryToDelete(null);
    } catch {
      showErrorToast(GALLERY_STRINGS.toasts.deleteFailed);
    }
  }, [storyToDelete]);

  const handleUndo = useCallback(async () => {
    if (!lastDeletedId) return;
    try {
      await restoreStory(lastDeletedId);
      setUndoToastVisible(false);
      setLastDeletedId(null);
      showSuccessToast(GALLERY_STRINGS.toasts.restoreSuccess);
    } catch {
      showErrorToast(GALLERY_STRINGS.toasts.restoreFailed);
    }
  }, [lastDeletedId]);

  const handleUndoTimeout = useCallback(() => {
    setUndoToastVisible(false);
    setLastDeletedId(null);
  }, []);

  const handleOffloadStory = useCallback(async (id: string) => {
    try {
      await offloadStory(id);
      showSuccessToast('Removed from device');
    } catch {
      showErrorToast('Failed to offload story');
    }
  }, []);

  return {
    isLoading,
    recordings,
    subtitle,
    // State
    filter,
    setFilter: handleSetFilter,
    sortOption,
    setSortOption,
    deleteModalVisible,
    setDeleteModalVisible,
    storyToDelete,
    undoToastVisible,
    sortModalVisible,
    setSortModalVisible,
    focusedStoryId, // Exported for UI
    searchQuery,
    setSearchQuery,
    // Actions
    actions: {
      onSelectStory: handleSelectStory, // Now sets focus
      onPlayStory: handlePlayStory,
      onDeleteStory: handleDeleteStory,
      onOffloadStory: handleOffloadStory,
      onUnavailableStoryTap: handleUnavailableStoryTap,
      onConfirmDelete: handleConfirmDelete,
      onUndo: handleUndo,
      onUndoTimeout: handleUndoTimeout,
      onCancelDelete: () => {
        setDeleteModalVisible(false);
        setStoryToDelete(null);
      },
    },
  };
}
