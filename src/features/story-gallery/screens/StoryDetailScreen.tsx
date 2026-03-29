import { AppText } from '@/components/ui/AppText';
import { useCallback, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '@/components/ui/Icon';
import { useStory } from '@/features/story-gallery/hooks/useStory';
import {
  useStoryTranscript,
  type TranscriptEntry,
  type TranscriptSpeaker,
} from '@/features/story-gallery/hooks/useStoryTranscript';
import { useStoryCommentCount } from '@/features/story-gallery/hooks/useStoryCommentCount';
import { AudioPlayer } from '@/features/story-gallery/components/AudioPlayer';
import { usePlayerStore } from '@/features/story-gallery/store/usePlayerStore';
import type { SyncStatus } from '@/types/entities';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SyncStatusBadge } from '@/features/story-gallery/components/SyncStatusBadge';
import { softDeleteStory, restoreStory } from '@/features/story-gallery/services/storyService';
import { DeleteConfirmModal } from '@/features/story-gallery/components/DeleteConfirmModal';
import { UndoToast } from '@/components/ui/UndoToast';
import { showErrorToast } from '@/components/ui/feedback/toast';
import { getQuestionById } from '@/features/recorder/data/topicQuestions';
import { CATEGORY_DATA, mapRawCategoryToFilter } from '@/features/story-gallery/data/mockGalleryData';
import { toStoryCommentsRoute, toStoryEditRoute } from '@/features/app/navigation/routes';
import { EN_COPY, formatCommentsButtonLabel } from '@/features/app/copy/en';

// Heritage
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageSkeleton } from '@/components/ui/heritage/HeritageSkeleton';
import { Animated } from '@/tw/animated';
import {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Container } from '@/components/ui/Container';

type HeritageTheme = ReturnType<typeof useHeritageTheme>;

export default function StoryDetailScreen(): JSX.Element {
  const { id, readOnlyDeletedPreview } = useLocalSearchParams<{
    id: string;
    readOnlyDeletedPreview?: string;
  }>();
  const router = useRouter();
  const { story, isLoading, error } = useStory(id);
  const { entries } = useStoryTranscript(id, story?.transcription ?? null);
  const theme = useHeritageTheme();
  const isDeletedPreview = readOnlyDeletedPreview === '1';
  const resetPlayer = usePlayerStore((state) => state.reset);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetPlayer();
      };
    }, [resetPlayer])
  );

  // Navigate to comments screen
  const { count: commentCount } = useStoryCommentCount(id);

  // Modal States
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  
  // Time Capsule State
  const { editTimeCapsule } = useLocalSearchParams<{ editTimeCapsule?: string }>();
  const [showDatePicker, setShowDatePicker] = useState(editTimeCapsule === 'true');
  const [tempUnlockDate, setTempUnlockDate] = useState<Date>(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

  // Scroll Handler
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  if (isLoading) {
    return (
      <Container className="flex-1 bg-surface px-6 pt-20">
        <View className="mb-5">
          <HeritageSkeleton variant="text" width={120} height={24} />
        </View>
        <View className="mb-7 gap-3">
          <HeritageSkeleton variant="title" width="72%" />
          <HeritageSkeleton variant="text" width="42%" />
        </View>
        <View className="gap-4">
          <HeritageSkeleton variant="text" width="100%" lines={3} />
          <HeritageSkeleton variant="text" width="95%" lines={3} />
          <HeritageSkeleton variant="text" width="90%" lines={2} />
        </View>
      </Container>
    );
  }

  if (error || !story) {
    return (
      <Container className="flex-1 bg-surface items-center justify-center p-6">
        <Icon name="alert-circle-outline" size={64} color={theme.colors.primary} />
        <AppText className="text-3xl font-serif text-center mt-4 text-onSurface">
          {EN_COPY.story.notFound}
        </AppText>
        <HeritageButton
          title={EN_COPY.story.goBack}
          onPress={() => router.back()}
          variant="secondary"
          className="mt-8"
        />
      </Container>
    );
  }

  const formattedDate = new Date(story.startedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const question = story.topicId ? getQuestionById(story.topicId) : null;
  const questionCategory = question?.category;
  const categoryLabel = questionCategory
    ? CATEGORY_DATA.find((item) => item.id === mapRawCategoryToFilter(questionCategory))?.label
    : undefined;
  const displayTitle =
    story.title?.trim() ||
    (categoryLabel ? `${categoryLabel} ${EN_COPY.story.storyWord}` : EN_COPY.story.untitled);

  const confirmDelete = async () => {
    try {
      await softDeleteStory(id);
      setDeleteModalVisible(false);
      setUndoToastVisible(true);
    } catch {
      showErrorToast(EN_COPY.story.deleteFailed);
    }
  };

  const handleUndo = async () => {
    try {
      await restoreStory(id);
      setUndoToastVisible(false);
    } catch {
      showErrorToast(EN_COPY.story.restoreFailed);
    }
  };

  const syncStatus: SyncStatus = story.syncStatus;
  const isLocked = story.unlockAt ? story.unlockAt > Date.now() : false;

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Navigation Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 z-10">
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

      <View className="flex-1 relative">
        <Animated.ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-8 pb-32"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          
          {/* Metadata Section */}
          <View className="mb-6">
            <View className="mb-2">
              <SyncStatusBadge status={syncStatus} />
            </View>
            <AppText className="text-4xl font-serif text-onSurface leading-tight mb-2">
              {displayTitle}
            </AppText>
            <AppText className="text-lg font-medium" style={{ color: theme.colors.textMuted }}>
              {formattedDate}
            </AppText>
          </View>

          {/* Transcript Visualization */}
          <View className="pb-14">
            {entries.length > 0 ? (
              <View className="gap-4">
                {entries.map((entry) => (
                  <TranscriptBlock key={entry.id} entry={entry} theme={theme} />
                ))}
              </View>
            ) : (
              <AppText className="text-lg leading-relaxed italic" style={{ color: theme.colors.textMuted }}>
                {EN_COPY.story.transcriptUnavailable}
              </AppText>
            )}
          </View>

          {/* Details Card */}
          <View className="mt-6 bg-surface p-5 rounded-2xl border" style={{ borderColor: `${theme.colors.primary}15` }}>
            <AppText className="text-base font-serif font-semibold text-onSurface mb-3">
              {EN_COPY.story.detailsTitle}
            </AppText>
            <View className="gap-2">
              <DetailRow
                label={EN_COPY.story.detailDuration}
                value={`${Math.round(story.durationMs / 1000)} ${EN_COPY.story.unitSeconds}`}
                theme={theme}
              />
              <DetailRow
                label={EN_COPY.story.detailFileSize}
                value={`${(story.sizeBytes / 1024).toFixed(1)} ${EN_COPY.story.unitKb}`}
                theme={theme}
              />
              <DetailRow
                label={EN_COPY.story.detailBackup}
                value={syncStatus === 'synced' ? EN_COPY.story.backupCloudSaved : EN_COPY.story.backupLocalOnly}
                theme={theme}
              />
              {story.unlockAt && (
                <DetailRow
                  label={`🕰️ ${EN_COPY.timeCapsule.label}`}
                  value={`${EN_COPY.timeCapsule.unlocksOn} ${new Date(story.unlockAt).toLocaleDateString()}`}
                  theme={theme}
                />
              )}
            </View>
          </View>
        </Animated.ScrollView>
      </View>

      {/* Floating Action Player Footer */}
      <View className="bg-surface rounded-t-3xl border-t px-6 pt-6 pb-12 shadow-lg elevation-10" style={{ borderColor: `${theme.colors.primary}10` }}>
        <View className="mb-6">
          {isLocked ? (
            <View className="p-6 items-center rounded-2xl bg-surfaceCard/50">
              <Icon name="lock-closed" size={48} color={theme.colors.primaryMuted} />
              <AppText className="mt-3 text-base text-center text-textMuted">
                {EN_COPY.timeCapsule.description} {new Date(story.unlockAt!).toLocaleDateString()}
              </AppText>
              {!showDatePicker && (
                <HeritageButton
                  title={EN_COPY.timeCapsule.changeDate}
                  onPress={() => setShowDatePicker(true)}
                  variant="outline"
                  size="small"
                  className="mt-4"
                />
              )}
            </View>
          ) : (
            <AudioPlayer uri={story.filePath} fallbackDurationMs={story.durationMs} />
          )}
        </View>

        {showDatePicker && (
          <View className="bg-surfaceCard p-4 rounded-xl mb-6 shadow-sm">
            <AppText className="text-base font-semibold text-onSurface mb-4">
              {EN_COPY.timeCapsule.setDate}
            </AppText>
            <DateTimePicker
              value={tempUnlockDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_ev, date) => date && setTempUnlockDate(date)}
            />
            <View className="flex-row gap-3 mt-4">
              <HeritageButton className="flex-1" title={EN_COPY.common.cancel} onPress={() => setShowDatePicker(false)} variant="secondary" />
              <HeritageButton className="flex-1" title={EN_COPY.timeCapsule.seal} onPress={async () => {
                const { updateStoryMetadata } = await import('@/features/story-gallery/services/storyService');
                await updateStoryMetadata(id, { unlockAt: tempUnlockDate.getTime() });
                setShowDatePicker(false);
              }} variant="primary" />
            </View>
          </View>
        )}

        {/* Primary Screen Actions */}
        <View className="flex-row gap-4">
          {isDeletedPreview ? (
            <HeritageButton
              title={EN_COPY.story.readOnlyPreview}
              onPress={() => undefined}
              variant="secondary"
              disabled
              className="flex-1 h-14"
            />
          ) : (
            <>
              <HeritageButton
                title={formatCommentsButtonLabel(commentCount)}
                onPress={() => router.push(toStoryCommentsRoute(id))}
                variant="secondary"
                icon="chatbubble-outline"
                className="flex-1 h-14"
              />
              <HeritageButton
                title={EN_COPY.story.editStory}
                onPress={() => router.push(toStoryEditRoute(id))}
                variant="primary"
                icon="pencil"
                className="flex-1 h-14"
              />
            </>
          )}
        </View>
      </View>

      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        storyTitle={displayTitle || undefined}
      />

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

function DetailRow({ label, value, theme }: { label: string; value: string; theme: HeritageTheme }) {
  return (
    <View className="flex-row justify-between items-center">
      <AppText className="text-sm" style={{ color: theme.colors.textMuted }}>{label}</AppText>
      <AppText className="text-sm font-medium text-onSurface">{value}</AppText>
    </View>
  );
}

function TranscriptBlock({ entry, theme }: { entry: TranscriptEntry; theme: HeritageTheme }) {
  const isAgent = entry.speaker === 'agent';
  const label = isAgent ? EN_COPY.story.speakerAi : EN_COPY.story.speakerYou;
  const labelColor = isAgent ? theme.colors.tertiary : theme.colors.primaryDeep;
  const bgColor = isAgent ? `${theme.colors.tertiary}12` : `${theme.colors.primary}12`;
  const textColor = `${theme.colors.onSurface}F0`;

  return (
    <View
      className={`max-w-[85%] px-4 py-3.5 rounded-2xl ${isAgent ? 'self-start rounded-bl-sm' : 'self-end rounded-br-sm'}`}
      style={{ backgroundColor: bgColor }}>
      <AppText
        className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${isAgent ? 'self-start' : 'self-end'}`}
        style={{ color: labelColor }}>
        {label}
      </AppText>
      <AppText className="text-lg leading-relaxed" style={{ color: textColor }}>
        {entry.text}
      </AppText>
    </View>
  );
}

function HeaderHelperButton({ onPress, icon, label, color }: { onPress: () => void; icon: any; label?: string; color: string }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 10, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}>
      <Animated.View className="flex-row items-center p-1" style={animatedStyle}>
        <Icon name={icon} size={28} color={color} />
        {label && <AppText className="text-lg font-semibold -ml-1" style={{ color }}>{label}</AppText>}
      </Animated.View>
    </Pressable>
  );
}
