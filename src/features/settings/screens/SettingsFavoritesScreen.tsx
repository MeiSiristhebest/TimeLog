import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import { useRouter } from 'expo-router';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { StoryList } from '@/features/story-gallery/components/StoryList';
import { useStories } from '@/features/story-gallery/hooks/useStories';
import { toggleStoryFavorite, offloadStory } from '@/features/story-gallery/services/storyService';
import { showSuccessToast, showErrorToast } from '@/components/ui/feedback/toast';

export default function SettingsFavoritesScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const router = useRouter();

  // 1. Fetch only favorites
  const { stories, isLoading, error } = useStories({ onlyFavorites: true });

  // 2. Map to StoryList requirements
  const recordings = useMemo(() => {
    return stories.map((record) => ({
      ...record,
      id: record.id,
      title: record.title,
      filePath: record.filePath,
      startedAt: record.startedAt,
      endedAt: record.endedAt ?? undefined,
      durationMs: record.durationMs,
      syncStatus: record.syncStatus as any,
      isOffloaded: record.filePath === 'OFFLOADED',
      isFavorite: !!record.isFavorite,
      isPlayable: record.filePath !== 'OFFLOADED', // Simple fallback for favorites view
    }));
  }, [stories]);

  // 3. Handlers
  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await toggleStoryFavorite(id, isFavorite);
      showSuccessToast(isFavorite ? 'Saved to favorites' : 'Removed from favorites');
    } catch {
      showErrorToast('Failed to update favorite status');
    }
  };

  const handlePlayStory = (id: string) => {
    router.push({ pathname: '/story/[id]', params: { id } });
  };

  const handleSelectStory = (id: string) => {
    // Navigate to detail on select for simplicity in favorites view
    handlePlayStory(id);
  };

  const handleOffloadStory = async (id: string) => {
    try {
      await offloadStory(id);
      showSuccessToast('Removed from device');
    } catch {
      showErrorToast('Failed to offload story');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceWarm }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <AppText style={[styles.title, { color: colors.onSurface }]}>Favorites</AppText>
        <View style={{ width: 44 }} /> 
      </View>

      {/* Content */}
      <View style={styles.content}>
        {recordings.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceCard }]}>
              <Ionicons name="heart-outline" size={48} color={colors.primaryMuted} />
            </View>
            <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>No Favorites Yet</AppText>
            <AppText style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Stories you heart will appear here so you can find them easily.
            </AppText>
          </View>
        ) : (
          <StoryList
            recordings={recordings}
            isLoading={isLoading}
            onSelectStory={handleSelectStory}
            onPlayStory={handlePlayStory}
            onToggleFavorite={handleToggleFavorite}
            onOffloadStory={handleOffloadStory}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    fontWeight: '400',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -60,
  },
  emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
});
