/**
 * Stories Tab (Gallery) - Final Polish (Standardized)
 *
 * Matches Record screen layout:
 * - SafeAreaView + inline backgroundColor (NativeWind v4)
 * - Typography: Fraunces for Title
 * - Functional Sort Feature
 */

import type { AudioRecording } from '@/types/entities';
import { useCallback } from 'react';
import { View, TextInput } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { showSuccessToast, showErrorToast } from '@/components/ui/feedback/toast';
import { StoryList } from '@/features/story-gallery/components/StoryList';
import { DeleteConfirmModal } from '@/features/story-gallery/components/DeleteConfirmModal';
import { SortOptionsModal } from '@/features/story-gallery/components/SortOptionsModal';
import { UndoToast } from '@/components/ui/UndoToast';
import { useHeritageTheme } from '@/theme/heritage';
import { TimelineStoryCard } from '@/features/story-gallery/components/TimelineStoryCard';
import { FilterBar } from '@/features/story-gallery/components/FilterBar';
import { useStoryGallery } from '@/features/story-gallery/hooks/useStoryGallery';
import { GALLERY_STRINGS } from '@/features/story-gallery/data/mockGalleryData';
import { AppText } from '@/components/ui/AppText';
import { AppPressable } from '@/components/ui/AppPressable';
import { Animated } from '@/tw/animated';
import { usePdfExport } from '../hooks/usePdfExport';
import { EN_COPY } from '@/features/app/copy/en';
import { Container } from '@/components/ui/Container';
import * as Haptics from 'expo-haptics';

export default function StoriesTabScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation: All logic in library-standard hook
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
    searchQuery,
    setSearchQuery,
    actions,
  } = useStoryGallery();

  const renderTimelineItem = useCallback(
    ({ item, index }: { item: AudioRecording & { isPlayable: boolean }; index: number }) => {
      // Feature logic:
      // If focusedStoryId is set, that story is featured.
      // If NO focusedStoryId is set, the FIRST story (index 0) is featured by default.
      const isFeatured = focusedStoryId ? item.id === focusedStoryId : index === 0;
      const isBeingListened = focusedStoryId ? item.id === focusedStoryId : false;

      return (
        <TimelineStoryCard
          story={item}
          onPlay={actions.onPlayStory}
          onSelect={actions.onSelectStory}
          index={index}
          variant={isFeatured ? 'featured' : 'default'}
          isBeingListened={isBeingListened}
        />
      );
    },
    [actions.onPlayStory, actions.onSelectStory, focusedStoryId]
  );

  const { exportPdf, isExporting } = usePdfExport();

  const handleExportAll = async () => {
    const storiesToExport = recordings.filter(r => r.transcription).map(r => ({
      title: r.title || EN_COPY.storySaved.defaultStoryTitle,
      transcript: r.transcription!,
      date: new Date(r.startedAt).toLocaleDateString()
    }));
    
    if (storiesToExport.length === 0) {
      showErrorToast(EN_COPY.photoToTopic.errorAnalysis);
      return;
    }
    
    try {
      showSuccessToast(EN_COPY.photoToTopic.processing);
      await exportPdf(storiesToExport, true);
    } catch {
      showErrorToast(EN_COPY.photoToTopic.errorAnalysis);
    }
  };

  return (
    <Container safe scrollable={false} className="bg-surfaceWarm">
      {/* Header */}
      <View className="flex-row items-start justify-between px-6 pt-6 pb-2">
        <View className="flex-1 pr-4">
          <AppText variant="headline" className="leading-tight">
            {GALLERY_STRINGS.header.title}
          </AppText>
          <AppText variant="small" className="font-bold mt-1" style={{ color: colors.textMuted }}>
            {subtitle}
          </AppText>
        </View>
        <View className="flex-row items-center gap-3">
          {recordings.length > 0 && (
            <AppPressable
              disabled={isExporting}
              onPress={handleExportAll}
              haptic={Haptics.ImpactFeedbackStyle.Medium}
              className={`w-12 h-12 rounded-full bg-surfaceCard items-center justify-center shadow-md ${isExporting ? 'opacity-50' : 'opacity-100'}`}
              style={{ borderColor: colors.border, borderWidth: 1 }}
            >
              <Icon name="book" size={24} color={colors.primary} />
            </AppPressable>
          )}
          <PhotoTopicButton onPress={() => {
            // @ts-ignore - typed router
            import('expo-router').then(m => m.router.push('/photo-topic'));
          }} />
          {recordings.length > 0 && (
            <SortButton onPress={() => setSortModalVisible(true)} />
          )}
        </View>
      </View>

      {/* Search Section - Only show when recordings exist */}
      {recordings.length > 0 && (
        <View className="px-6 pb-2">
          <View className="flex-row items-center h-14 rounded-2xl border px-4 bg-surfaceCard shadow-sm" style={{ borderColor: colors.border }}>
            <Icon name="search" size={22} color={`${colors.onSurface}88`} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={GALLERY_STRINGS.header.searchPlaceholder}
              placeholderTextColor={`${colors.onSurface}55`}
              className="flex-1 ml-3 text-lg text-onSurface h-full"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
        </View>
      )}

      {/* Filter Bar - Only show when recordings exist */}
      {recordings.length > 0 && (
        <FilterBar selectedCategory={filter} onSelectCategory={setFilter} />
      )}

      {/* Content Area */}
      <View className="flex-1" style={{ backgroundColor: colors.surfaceWarm }}>
        <StoryList
          recordings={recordings}
          onSelectStory={actions.onSelectStory}
          onPlayStory={actions.onPlayStory}
          onDeleteStory={actions.onDeleteStory}
          onOffloadStory={actions.onOffloadStory}
          isLoading={isLoading}
          onUnavailableStoryTap={actions.onUnavailableStoryTap}
          renderItem={recordings.length > 0 ? renderTimelineItem : undefined}
          ItemSeparatorComponent={null}
          extraData={focusedStoryId}
        />
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
    </Container>
  );
}

// Interactive Sort Button
function SortButton({ onPress }: { onPress: () => void }) {
  const { colors } = useHeritageTheme();

  return (
    <AppPressable 
      onPress={onPress} 
      haptic={Haptics.ImpactFeedbackStyle.Light}
      className="flex-row items-center gap-1.5 px-3 py-2 rounded-pill bg-surfaceAccent/10"
    >
      <AppText variant="small" className="font-bold" style={{ color: colors.primary }}>
        {GALLERY_STRINGS.header.sortButton}
      </AppText>
      <Icon name="filter" size={20} color={colors.primary} />
    </AppPressable>
  );
}

// Interactive Photo Topic Button
function PhotoTopicButton({ onPress }: { onPress: () => void }) {
  const { colors } = useHeritageTheme();

  return (
    <AppPressable 
      onPress={onPress} 
      haptic={Haptics.ImpactFeedbackStyle.Light}
      className="flex-row items-center gap-1.5 px-3 py-2 rounded-pill bg-surfaceAccent/10"
    >
      <AppText variant="small" className="font-bold" style={{ color: colors.primary }}>
        📷 {EN_COPY.photoToTopic.title}
      </AppText>
    </AppPressable>
  );
}
