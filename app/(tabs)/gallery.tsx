/**
 * Stories Tab (Gallery) - Final Polish
 *
 * Matches Record screen layout:
 * - SafeAreaView + inline backgroundColor
 * - Typography: Fraunces for Title (matches "Good Morning" on Home)
 * - Functional Sort Feature
 */

import { AppText } from '@/components/ui/AppText';
import type { AudioRecording } from '@/types/entities';
import { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';

import { StoryList } from '@/features/story-gallery/components/StoryList';
import { DeleteConfirmModal } from '@/features/story-gallery/components/DeleteConfirmModal';
import { SortOptionsModal } from '@/features/story-gallery/components/SortOptionsModal';
import { UndoToast } from '@/components/ui/UndoToast';
import { useHeritageTheme } from '@/theme/heritage';
import { LazyTimelineLayout } from '@/lib/lazyComponents';
import { TimelineStoryCard } from '@/features/story-gallery/components/TimelineStoryCard';
import { FilterBar } from '@/features/story-gallery/components/FilterBar';

import { useStoryGallery } from '@/features/story-gallery/hooks/useStoryGallery';
import { GALLERY_STRINGS } from '@/features/story-gallery/data/mockGalleryData';

export default function StoriesTab(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation: All logic in hook
  const {
    isLoading,
    recordings,
    subtitle,
    filter,
    setFilter,
    sortOption,
    setSortOption,
    deleteModalVisible,
    storyToDelete,
    undoToastVisible,
    sortModalVisible,
    setSortModalVisible,
    focusedStoryId,
    actions,
  } = useStoryGallery();

  const renderTimelineItem = useCallback(
    ({ item, index }: { item: AudioRecording & { isPlayable: boolean }; index: number }) => {
      // Feature logic:
      // If focusedStoryId is set, that story is featured.
      // If NO focusedStoryId is set, the FIRST story (index 0) is featured by default.
      const isFeatured = focusedStoryId ? item.id === focusedStoryId : index === 0;

      return (
        <TimelineStoryCard
          story={item}
          onPlay={actions.onPlayStory}
          onSelect={actions.onSelectStory}
          index={index}
          variant={isFeatured ? 'featured' : 'default'}
        />
      );
    },
    [actions.onPlayStory, actions.onSelectStory, focusedStoryId]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceWarm }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {GALLERY_STRINGS.header.title}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</AppText>
        </View>
        <Pressable style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
          <AppText style={[styles.sortText, { color: colors.primary }]}>
            {GALLERY_STRINGS.header.sortButton}
          </AppText>
          <Ionicons name="filter" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* Filter Bar */}
      <FilterBar selectedCategory={filter} onSelectCategory={setFilter} />

      {/* Content Area */}
      <View style={[styles.content, { backgroundColor: colors.surfaceWarm }]}>
        {recordings.length > 0 ? (
          <LazyTimelineLayout>
            <StoryList
              recordings={recordings}
              onSelectStory={actions.onSelectStory}
              onPlayStory={actions.onPlayStory}
              onDeleteStory={actions.onDeleteStory}
              isLoading={isLoading}
              onUnavailableStoryTap={actions.onUnavailableStoryTap}
              renderItem={renderTimelineItem}
              ItemSeparatorComponent={null}
            />
          </LazyTimelineLayout>
        ) : (
          <StoryList
            recordings={recordings}
            onSelectStory={actions.onSelectStory}
            onPlayStory={actions.onPlayStory}
            onDeleteStory={actions.onDeleteStory}
            isLoading={isLoading}
            onUnavailableStoryTap={actions.onUnavailableStoryTap}
          />
        )}
      </View>

      {/* Modals */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={actions.onCancelDelete}
        onConfirm={actions.onConfirmDelete}
        storyTitle={recordings.find((r) => r.id === storyToDelete)?.title || undefined}
      />

      <SortOptionsModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        currentSort={sortOption}
        onSelectSort={setSortOption}
      />

      <UndoToast
        visible={undoToastVisible}
        onUndo={actions.onUndo}
        onTimeout={actions.onUndoTimeout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: 'Fraunces_600SemiBold',
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
