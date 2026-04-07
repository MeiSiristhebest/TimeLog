import { AppText } from '@/components/ui/AppText';
import { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@/components/ui/Icon';
import { useStory } from '@/features/story-gallery/hooks/useStory';
import {
  useStoryTranscript,
  type TranscriptEntry,
  type TranscriptSpeaker,
} from '@/features/story-gallery/hooks/useStoryTranscript';
import { AudioPlayer } from '@/features/story-gallery/components/AudioPlayer';
import { usePlayerStore } from '@/features/story-gallery/store/usePlayerStore';
import type { SyncStatus } from '@/types/entities';
import { SyncStatusBadge } from '@/features/story-gallery/components/SyncStatusBadge';
import { softDeleteStory, restoreStory } from '@/features/story-gallery/services/storyService';
import { DeleteConfirmModal } from '@/features/story-gallery/components/DeleteConfirmModal';
import { UndoToast } from '@/components/ui/UndoToast';
import { showErrorToast } from '@/components/ui/feedback/toast';
import { getQuestionById } from '@/features/recorder/data/topicQuestions';
import { CATEGORY_DATA, mapRawCategoryToFilter } from '@/features/story-gallery/data/mockGalleryData';
import { toStoryEditRoute } from '@/features/app/navigation/routes';
import { EN_COPY } from '@/features/app/copy/en';
import { usePdfExport } from '@/features/story-gallery/hooks/usePdfExport';
import { showSuccessToast } from '@/components/ui/feedback/toast';

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

  // Story 3.3 State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [undoToastVisible, setUndoToastVisible] = useState(false);

  // Scroll Handler for header transparency (if needed)
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const { exportPdf, isExporting } = usePdfExport();

  const handleExportPdf = async () => {
    if (!story || entries.length === 0) {
      showErrorToast(EN_COPY.story.transcriptUnavailable);
      return;
    }
    
    try {
      const exportData = [{
        title: displayTitle,
        transcript: entries.map(e => e.text).join('\n\n'),
        date: formattedDate,
      }];
      // Use AI polishing for a better memoir feel
      await exportPdf(exportData, true);
      showSuccessToast(EN_COPY.story.exportSuccess);
    } catch (err) {
      showErrorToast(EN_COPY.story.exportFailed);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 84,
          backgroundColor: theme.colors.surface,
        }}>
        <View style={{ marginBottom: 20 }}>
          <HeritageSkeleton variant="text" width={120} height={24} />
        </View>
        <View style={{ gap: 12, marginBottom: 28 }}>
          <HeritageSkeleton variant="title" width="72%" />
          <HeritageSkeleton variant="text" width="42%" />
        </View>
        <View style={{ gap: 14 }}>
          <HeritageSkeleton variant="text" width="100%" lines={3} />
          <HeritageSkeleton variant="text" width="95%" lines={3} />
          <HeritageSkeleton variant="text" width="90%" lines={2} />
        </View>
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
          {EN_COPY.story.notFound}
        </AppText>
        <HeritageButton
          title={EN_COPY.story.goBack}
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
  const questionCategory = question?.category;
  const categoryLabel = questionCategory
    ? CATEGORY_DATA.find((item) => item.id === mapRawCategoryToFilter(questionCategory))?.label
    : undefined;
  const displayTitle =
    story.title?.trim() ||
    (categoryLabel ? `${categoryLabel} ${EN_COPY.story.storyWord}` : EN_COPY.story.untitled);

  // Story 3.3 Handlers
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

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <HeaderHelperButton
            onPress={handleExportPdf}
            icon={isExporting ? "hourglass-outline" : "share-outline"}
            disabled={isExporting}
            color={isExporting ? theme.colors.textMuted : theme.colors.primaryDeep}
          />

          <HeaderHelperButton
            onPress={() => setDeleteModalVisible(true)}
            icon="ellipsis-horizontal"
            color={theme.colors.textMuted}
          />
        </View>
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

          {/* Transcript Visualization */}
          <View style={{ position: 'relative', paddingBottom: 60 }}>
            {entries.length > 0 ? (
              <View style={{ gap: 16 }}>
                {entries.map((entry) => (
                  <TranscriptBlock key={entry.id} entry={entry} theme={theme} />
                ))}
              </View>
            ) : (
              <AppText
                style={{
                  fontSize: 18,
                  fontFamily: 'System',
                  lineHeight: 30,
                  color: theme.colors.textMuted,
                }}>
                {EN_COPY.story.transcriptUnavailable}
              </AppText>
            )}
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
              {EN_COPY.story.detailsTitle}
            </AppText>
            <View style={{ gap: 8 }}>
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
                value={
                  syncStatus === 'synced' ? EN_COPY.story.backupCloudSaved : EN_COPY.story.backupLocalOnly
                }
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
          {isDeletedPreview ? (
            <View style={{ flex: 1 }}>
              <HeritageButton
                title={EN_COPY.story.readOnlyPreview}
                onPress={() => undefined}
                variant="secondary"
                disabled
                style={{ height: 56 }}
              />
            </View>
          ) : (
            <>
              {/* Edit - opens Full Story Edit Screen */}
              <View style={{ flex: 1 }}>
                <HeritageButton
                  title={EN_COPY.story.editStory}
                  onPress={() => router.push(toStoryEditRoute(id))}
                  variant="primary"
                  icon="pencil"
                  style={{ height: 56 }}
                />
              </View>
            </>
          )}
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

function getSpeakerStyle(speaker: TranscriptSpeaker, theme: HeritageTheme): {
  label: string;
  labelColor: string;
  backgroundColor: string;
  textColor: string;
} {
  if (speaker === 'user') {
    return {
      label: EN_COPY.story.speakerYou,
      labelColor: theme.colors.primaryDeep,
      backgroundColor: `${theme.colors.primary}12`,
      textColor: `${theme.colors.onSurface}F0`,
    };
  }

  if (speaker === 'agent') {
    return {
      label: EN_COPY.story.speakerAi,
      labelColor: theme.colors.tertiary,
      backgroundColor: `${theme.colors.tertiary}12`,
      textColor: `${theme.colors.onSurface}F0`,
    };
  }

  return {
    label: EN_COPY.story.speakerTranscript,
    labelColor: theme.colors.textMuted,
    backgroundColor: `${theme.colors.textMuted}14`,
    textColor: `${theme.colors.onSurface}E6`,
  };
}

function TranscriptBlock({
  entry,
  theme,
}: {
  entry: TranscriptEntry;
  theme: HeritageTheme;
}): JSX.Element {
  const style = getSpeakerStyle(entry.speaker, theme);

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: style.backgroundColor,
      }}>
      <AppText
        style={{
          color: style.labelColor,
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginBottom: 8,
          textTransform: 'uppercase',
        }}>
        {style.label}
      </AppText>
      <AppText
        style={{
          fontSize: 20,
          fontFamily: 'System',
          lineHeight: 32,
          color: style.textColor,
        }}>
        {entry.text}
      </AppText>
    </View>
  );
}

function HeaderHelperButton({
  onPress,
  icon,
  label,
  color,
  disabled,
}: {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  color: string;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => !disabled && (scale.value = withSpring(0.9, { damping: 10, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}>
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
