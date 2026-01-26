import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { useStory } from '@/features/story-gallery/hooks/useStory';
import { useStoryCommentCount } from '@/features/story-gallery/hooks/useStoryCommentCount';
import { LazyStoryPlayer } from '@/lib/lazyComponents';
import type { SyncStatus } from '@/types/entities';

import { SyncStatusBadge } from '@/features/story-gallery/components/SyncStatusBadge';
import { EditTitleSheet } from '@/features/story-gallery/components/EditTitleSheet';
import { softDeleteStory, restoreStory } from '@/features/story-gallery/services/storyService';
import { DeleteConfirmModal } from '@/features/story-gallery/components/DeleteConfirmModal';
import { UndoToast } from '@/components/ui/UndoToast';
import { showErrorToast } from '@/components/ui/feedback/toast';

// Heritage
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type HeritageTheme = ReturnType<typeof useHeritageTheme>;

export default function StoryDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { story, isLoading, error } = useStory(id);
  const theme = useHeritageTheme();

  // Story 4.5: Fetch comments for this story
  const { count: commentCount } = useStoryCommentCount(id);

  // Edit Title Sheet state
  const [isEditing, setIsEditing] = React.useState(false);

  // Story 3.3 State
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [undoToastVisible, setUndoToastVisible] = React.useState(false);

  // Scroll Handler for header transparency (if needed)
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
        }}>
        <AppText
          style={{
            color: theme.colors.textMuted,
            fontSize: 20,
            fontFamily: 'Fraunces_600SemiBold',
          }}>
          Loading…
        </AppText>
      </View>
    );
  }

  if (error || !story) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: theme.colors.surface,
        }}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.primary} />
        <AppText
          style={{
            fontSize: 24,
            color: theme.colors.onSurface,
            fontFamily: 'Fraunces_600SemiBold',
            textAlign: 'center',
            marginTop: 16,
          }}>
          Story not found
        </AppText>
        <HeritageButton
          title="Go Back"
          onPress={() => router.back()}
          variant="secondary"
          style={{ marginTop: 32 }}
        />
      </View>
    );
  }

  const formattedDate = new Date(story.startedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Story 3.3 Handlers
  const confirmDelete = async () => {
    try {
      await softDeleteStory(id);
      setDeleteModalVisible(false);
      setUndoToastVisible(true);
    } catch {
      showErrorToast('Delete failed, please try again');
    }
  };

  const handleUndo = async () => {
    try {
      await restoreStory(id);
      setUndoToastVisible(false);
    } catch {
      showErrorToast('Restore failed, please try again');
    }
  };

  // Navigate to comments screen
  const handleViewComments = () => {
    router.push(`/story-comments/${id}`);
  };

  // Open edit title sheet
  const handleEditStory = () => {
    setIsEditing(true);
  };

  const syncStatus: SyncStatus = story.syncStatus;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Header (Custom) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 60, // Safe area
          paddingBottom: 16,
          paddingHorizontal: 20,
          zIndex: 10,
        }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}>
          <Ionicons name="chevron-back" size={28} color={`${theme.colors.primary}CC`} />
          <AppText
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: `${theme.colors.primary}CC`,
              marginLeft: -4,
            }}>
            Back
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setDeleteModalVisible(true)} style={{ padding: 8 }}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 2. Content (Transcript) */}
      <View style={{ flex: 1, position: 'relative' }}>
        <Animated.ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 120 }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          {/* Metadata */}
          <View style={{ marginBottom: 24 }}>
            {/* Sync Status Badge */}
            <View style={{ marginBottom: 8 }}>
              <SyncStatusBadge status={syncStatus} />
            </View>

            <AppText
              style={{
                fontSize: 32,
                fontFamily: 'Fraunces_600SemiBold',
                color: theme.colors.onSurface,
                lineHeight: 40,
                marginBottom: 8,
              }}>
              {story.title || 'Untitled Story'}
            </AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 18, fontWeight: '500' }}>
              {formattedDate}
            </AppText>
          </View>

          {/* Transcript Placeholder - Will be replaced when transcription is implemented */}
          {/* Transcript Visualization */}
          <View style={{ position: 'relative', paddingBottom: 60 }}>
            {/* Simulated Content */}
            <AppText
              style={{
                fontSize: 22,
                fontFamily: 'System', // Use system sans-serif for readability
                lineHeight: 34,
                color: `${theme.colors.onSurface}E6`, // 90% opacity
                marginBottom: 24,
              }}>
              That summer, a truck came to the village. I remember it very clearly; the sun was very
              hot that day, and the cinadas were buzzing incessantly in the trees...
            </AppText>

            <AppText
              style={{
                fontSize: 22,
                fontFamily: 'System',
                lineHeight: 34,
                color: `${theme.colors.onSurface}E6`,
                marginBottom: 24,
              }}>
              The truck parked under the large banyan tree at the village entrance, kicking up a
              cloud of yellow dust. We all ran out to see what was happening. It was the first time
              I saw such a vivid red color.
            </AppText>

            <AppText
              style={{
                fontSize: 22,
                fontFamily: 'System',
                lineHeight: 34,
                color: `${theme.colors.onSurface}E6`,
              }}>
              My father walked towards the driver, wiping sweat from his forehead. I hid behind my{' '}
              {"mother's"} skirt, peeking out with curiosity...
            </AppText>

            {/* Gradient Fade at bottom of text area */}
            <LinearGradient
              colors={['transparent', theme.colors.surface]}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 120,
              }}
              pointerEvents="none"
            />
          </View>

          {/* Story Details Card */}
          <View
            style={{
              marginTop: 24,
              backgroundColor: theme.colors.surface,
              padding: 20,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: `${theme.colors.primary}15`,
            }}>
            <AppText
              style={{
                color: theme.colors.onSurface,
                fontSize: 16,
                fontFamily: 'Fraunces_600SemiBold',
                marginBottom: 12,
              }}>
              Story Details
            </AppText>
            <View style={{ gap: 8 }}>
              <DetailRow
                label="Duration"
                value={`${Math.round(story.durationMs / 1000)} seconds`}
                theme={theme}
              />
              <DetailRow
                label="File Size"
                value={`${(story.sizeBytes / 1024).toFixed(1)} KB`}
                theme={theme}
              />
              <DetailRow
                label="Backup"
                value={syncStatus === 'synced' ? 'Cloud saved ✓' : 'Local only'}
                theme={theme}
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </View>

      {/* 3. Footer (Player + Actions) */}
      <View
        style={{
          backgroundColor: `${theme.colors.surface}F2`, // Transparent/blur effect
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTopWidth: 1,
          borderColor: `${theme.colors.primary}10`,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
          elevation: 10,
        }}>
        {/* Audio Player */}
        <View style={{ marginBottom: 24 }}>
          <LazyStoryPlayer uri={story.filePath} />
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {/* Comments - with real count */}
          <TouchableOpacity
            onPress={handleViewComments}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: `${theme.colors.primary}20`,
                borderWidth: 2,
              },
            ]}>
            <Ionicons name="chatbubble-outline" size={24} color={theme.colors.primary} />
            <AppText style={[styles.actionText, { color: theme.colors.primary }]}>
              Comments {commentCount > 0 ? `(${commentCount})` : ''}
            </AppText>
          </TouchableOpacity>

          {/* Edit - opens EditTitleSheet */}
          <TouchableOpacity
            onPress={handleEditStory}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="pencil" size={24} color={theme.colors.onPrimary} />
            <AppText style={[styles.actionText, { color: theme.colors.onPrimary }]}>
              Edit Story
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Title Sheet */}
      <EditTitleSheet
        isVisible={isEditing}
        onClose={() => setIsEditing(false)}
        storyId={id}
        initialTitle={story.title || ''}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        storyTitle={story.title || undefined}
      />

      {/* Undo Toast */}
      <UndoToast
        visible={undoToastVisible}
        onUndo={handleUndo}
        onTimeout={() => {
          setUndoToastVisible(false);
          router.back();
        }}
      />
    </View>
  );
}

function DetailRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: HeritageTheme;
}): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText style={{ color: theme.colors.textMuted, fontSize: 14 }}>{label}</AppText>
      <AppText style={{ color: theme.colors.onSurface, fontSize: 14, fontWeight: '500' }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = {
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
};
