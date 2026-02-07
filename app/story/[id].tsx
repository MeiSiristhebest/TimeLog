import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { useStory } from '@/features/story-gallery/hooks/useStory';
import { useStoryCommentCount } from '@/features/story-gallery/hooks/useStoryCommentCount';
import { AudioPlayer } from '@/features/story-gallery/components/AudioPlayer';
import type { SyncStatus } from '@/types/entities';
import { SyncStatusBadge } from '@/features/story-gallery/components/SyncStatusBadge';
import { softDeleteStory, restoreStory } from '@/features/story-gallery/services/storyService';
import { DeleteConfirmModal } from '@/features/story-gallery/components/DeleteConfirmModal';
import { UndoToast } from '@/components/ui/UndoToast';
import { showErrorToast } from '@/components/ui/feedback/toast';
import { getQuestionById } from '@/features/recorder/data/topicQuestions';

// Heritage
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withSpring } from 'react-native-reanimated';

type HeritageTheme = ReturnType<typeof useHeritageTheme>;

export default function StoryDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { story, isLoading, error } = useStory(id);
  const theme = useHeritageTheme();

  // Story 4.5: Fetch comments for this story
  const { count: commentCount } = useStoryCommentCount(id);

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
  const question = story.topicId ? getQuestionById(story.topicId) : null;
  const displayTitle = story.title || question?.text || 'Untitled Story';

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
        <HeaderHelperButton
          onPress={() => router.back()}
          icon="chevron-back"
          label="Back"
          color={`${theme.colors.primary}CC`}
        />

        <HeaderHelperButton
          onPress={() => setDeleteModalVisible(true)}
          icon="ellipsis-horizontal"
          color={theme.colors.textMuted}
        />
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
              {displayTitle}
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
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTopWidth: 1,
          borderColor: `${theme.colors.primary}10`,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.03,
          shadowRadius: 12,
          elevation: 10,
        }}>
        {/* Audio Player */}
        <View style={{ marginBottom: 24 }}>
          <AudioPlayer uri={story.filePath} />
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {/* Comments - with real count */}
          <View style={{ flex: 1 }}>
            <HeritageButton
              title={`Comments ${commentCount > 0 ? `(${commentCount})` : ''}`}
              onPress={handleViewComments}
              variant="secondary"
              icon="chatbubble-outline"
              style={{ height: 56 }}
            />
          </View>

          {/* Edit - opens Full Story Edit Screen */}
          <View style={{ flex: 1 }}>
            <HeritageButton
              title="Edit Story"
              onPress={() => router.push(`/story/edit?id=${id}`)}
              variant="primary"
              icon="pencil"
              style={{ height: 56 }}
            />
          </View>
        </View>
      </View>

      {/* Delete Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        storyTitle={displayTitle || undefined}
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

function HeaderHelperButton({
  onPress,
  icon,
  label,
  color,
}: {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  color: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 10, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
    >
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, animatedStyle]}>
        <Ionicons name={icon} size={28} color={color} />
        {label && (
          <AppText
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: color,
              marginLeft: -4,
            }}>
            {label}
          </AppText>
        )}
      </Animated.View>
    </Pressable>
  );
}
