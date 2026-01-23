/**
 * Stories Tab (Gallery) - Final Polish
 *
 * Matches Record screen layout:
 * - SafeAreaView + inline backgroundColor
 * - Typography: Fraunces for Title (matches "Good Morning" on Home)
 * - Functional Sort Feature
 */

import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { StoryList } from '@/features/story-gallery/components/StoryList';
import { DeleteConfirmModal } from '@/features/story-gallery/components/DeleteConfirmModal';
import { SortOptionsModal, SortOption } from '@/features/story-gallery/components/SortOptionsModal';
import { UndoToast } from '@/components/ui/UndoToast';
import { showOfflineUnavailableToast, showSuccessToast, showErrorToast } from '@/components/ui/feedback/toast';
import { softDeleteStory, restoreStory } from '@/features/story-gallery/services/storyService';
import { useStories } from '@/features/story-gallery/hooks/useStories';
import { useHeritageTheme } from '@/theme/heritage';
import { TimelineLayout } from '@/features/story-gallery/components/TimelineLayout';
import { TimelineStoryCard } from '@/features/story-gallery/components/TimelineStoryCard';
import { FilterBar, FilterCategory } from '@/features/story-gallery/components/FilterBar';
import { getQuestionById } from '@/features/recorder/data/topicQuestions';

// Background color constant - matches Record screen
const BG_COLOR = '#FFFAF5';

export default function StoriesTab() {
  const router = useRouter();
  const theme = useHeritageTheme();
  const { colors } = theme;

  // Stories data
  const { stories, isLoading } = useStories();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null);

  // Filter & Sort logic
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Story handlers
  const handleSelectStory = useCallback((id: string) => {
    router.push({ pathname: '/story/[id]', params: { id } });
  }, [router]);

  const handlePlayStory = useCallback((id: string) => {
    router.push({ pathname: '/story/[id]', params: { id } });
  }, [router]);

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
    } catch (error) {
      showErrorToast('Delete failed, please try again');
    }
  }, [storyToDelete]);

  const handleUndo = useCallback(async () => {
    if (!lastDeletedId) return;
    try {
      await restoreStory(lastDeletedId);
      setUndoToastVisible(false);
      setLastDeletedId(null);
      showSuccessToast('Story restored');
    } catch (error) {
      showErrorToast('Restore failed, please try again');
    }
  }, [lastDeletedId]);

  const handleUndoTimeout = useCallback(() => {
    setUndoToastVisible(false);
    setLastDeletedId(null);
  }, []);

  // Map stories to recording format with filtering AND sorting
  const recordings = useMemo(() => {
    let result = stories;

    // 1. Filter
    if (filter !== 'all') {
      result = stories.filter(story => {
        if (!story.topicId) return false;
        const question = getQuestionById(story.topicId);
        return question?.category === filter;
      });
    }

    // 2. Sort
    return result.sort((a, b) => {
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
    }).map((record) => ({
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
    }));
  }, [stories, filter, sortOption]);

  return (
    // PATTERN FROM RECORD: SafeAreaView with inline backgroundColor
    <SafeAreaView style={[styles.container, { backgroundColor: BG_COLOR }]}>
      {/* Header - matches Record screen pattern */}
      <View style={styles.header}>
        <View>
          {/* Use Fraunces to match Record screen 'Good Morning' */}
          <Text style={[styles.title, { color: colors.onSurface }]}>My Stories</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{recordings.length} memories recorded</Text>
        </View>
        <Pressable
          style={styles.sortButton}
          onPress={() => setSortModalVisible(true)}
        >
          <Text style={[styles.sortText, { color: colors.primary }]}>Sort</Text>
          <Ionicons name="filter" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* Filter Bar - direct child, no wrapper */}
      <FilterBar
        selectedCategory={filter}
        onSelectCategory={setFilter}
      />

      {/* Content Area - ScrollView or FlatList */}
      <View style={[styles.content, { backgroundColor: BG_COLOR }]}>
        {recordings.length > 0 ? (
          <TimelineLayout>
            <StoryList
              recordings={recordings}
              onSelectStory={handleSelectStory}
              onPlayStory={handlePlayStory}
              onDeleteStory={handleDeleteStory}
              isLoading={isLoading}
              onUnavailableStoryTap={handleUnavailableStoryTap}
              renderItem={({ item, index }) => (
                <TimelineStoryCard
                  story={item}
                  onPlay={handlePlayStory}
                  index={index}
                  variant={index === 0 ? 'featured' : 'default'}
                />
              )}
              ItemSeparatorComponent={null}
            />
          </TimelineLayout>
        ) : (
          <StoryList
            recordings={recordings}
            onSelectStory={handleSelectStory}
            onPlayStory={handlePlayStory}
            onDeleteStory={handleDeleteStory}
            isLoading={isLoading}
            onUnavailableStoryTap={handleUnavailableStoryTap}
          />
        )}
      </View>

      {/* Modals */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setStoryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        storyTitle={recordings.find(r => r.id === storyToDelete)?.title || undefined}
      />

      <SortOptionsModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        currentSort={sortOption}
        onSelectSort={setSortOption}
      />

      <UndoToast
        visible={undoToastVisible}
        onUndo={handleUndo}
        onTimeout={handleUndoTimeout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor set via inline style
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold', // Updated to match Record screen
    fontSize: 34,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    marginTop: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  sortText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
