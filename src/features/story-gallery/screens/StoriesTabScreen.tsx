/**
 * Stories Tab (Gallery) - Final Polish
 *
 * Matches Record screen layout:
 * - SafeAreaView + inline backgroundColor
 * - Typography: Fraunces for Title (matches "Good Morning" on Home)
 * - Functional Sort Feature
 */

import type { AudioRecording } from '@/types/entities';
import { useCallback } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
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
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export default function StoriesTabScreen(): JSX.Element {
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
    searchQuery,
    setSearchQuery,
    actions,
  } = useStoryGallery();

  const renderTimelineItem = useCallback(
    ({ item, index }: { item: AudioRecording & { isPlayable: boolean; isFavorite?: boolean }; index: number }) => {
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
          isFavorite={item.isFavorite}
          onToggleFavorite={() => actions.onToggleFavorite(item.id, !item.isFavorite)}
        />
      );
    },
    [actions.onPlayStory, actions.onSelectStory, actions.onToggleFavorite, focusedStoryId]
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
        <SortButton onPress={() => setSortModalVisible(true)} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={GALLERY_STRINGS.header.searchPlaceholder}
          placeholderTextColor={`${colors.onSurface}55`}
          style={[
            styles.searchInput,
            {
              borderColor: colors.border,
              color: colors.onSurface,
              backgroundColor: colors.surfaceCard,
            },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Bar */}
      <FilterBar selectedCategory={filter} onSelectCategory={setFilter} />

      {/* Content Area */}
      <View style={[styles.content, { backgroundColor: colors.surfaceWarm }]}>
        <StoryList
          recordings={recordings}
          onSelectStory={actions.onSelectStory}
          onPlayStory={actions.onPlayStory}
          onDeleteStory={actions.onDeleteStory}
          onOffloadStory={actions.onOffloadStory}
          onToggleFavorite={actions.onToggleFavorite}
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
    </SafeAreaView>
  );
}

// Interactive Sort Button
function SortButton({ onPress }: { onPress: () => void }) {
  const { colors } = useHeritageTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <Animated.Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.sortButton, animatedStyle]}>
        <AppText style={[styles.sortText, { color: colors.primary }]}>
          {GALLERY_STRINGS.header.sortButton}
        </AppText>
        <Ionicons name="filter" size={18} color={colors.primary} />
      </Animated.View>
    </Animated.Pressable>
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
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
});
