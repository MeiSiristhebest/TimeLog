import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/Icon';
import { AudioRecording } from '@/types/entities';
import { useHeritageTheme } from '@/theme/heritage';
import { CommentBadge } from './CommentBadge';
import { SyncStatusBadge } from './SyncStatusBadge';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import {
  COVER_IMAGES,
  CATEGORY_COVERS,
} from '../data/mockStoryData';
import { CATEGORY_DATA, mapRawCategoryToFilter } from '../data/mockGalleryData';
import { getQuestionById } from '@/features/recorder/data/topicQuestions';

export interface FeaturedStoryCardProps {
  story: AudioRecording;
  index: number;
  dateObj: Date;
  fullDateStr: string;
  durationStr: string;
  isBeingListened?: boolean;
  isPlayable?: boolean;
  isOffline?: boolean;
  unreadCommentCount?: number;
  onPlay: (id: string) => void;
  onSelect: (id: string) => void;
  onOffload?: (id: string) => void;
}

export function FeaturedStoryCard({
  story,
  index,
  dateObj,
  fullDateStr,
  durationStr,
  isBeingListened = false,
  isPlayable = true,
  isOffline = false,
  unreadCommentCount = 0,
  onPlay,
  onSelect,
  onOffload,
}: FeaturedStoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const transcription = story.transcription?.trim() ?? '';
  const isSynced = story.syncStatus === 'synced';
  const isDisabled = isOffline && !isPlayable;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const listenerName = 'You';
  const isSelf = listenerName.toLowerCase() === 'you';
  const question = story.topicId ? getQuestionById(story.topicId) : null;
  const rawCategory = question?.category || 'general';
  const categoryKey = mapRawCategoryToFilter(rawCategory);
  const categoryLabel = CATEGORY_DATA.find((item) => item.id === categoryKey)?.label;

  const coverImage =
    story.coverImagePath
      ? { uri: story.coverImagePath }
      : CATEGORY_COVERS[categoryKey] || COVER_IMAGES[index % COVER_IMAGES.length];

  const previewText =
    transcription.length > 0
      ? `${transcription.replace(/\s+/g, ' ').slice(0, 96)}${transcription.length > 96 ? '…' : ''}`
      : 'No transcript yet';
  const displayTitle = story.title?.trim() || (categoryLabel ? `${categoryLabel} Story` : 'Untitled Story');

  return (
    <View className="relative mb-6 w-full items-center px-4 overflow-visible z-10">
      {/* Timeline Indicator */}
      <View className="absolute left-0 right-0 items-center -top-5 z-20" pointerEvents="none">
        <View className="w-2.5 h-2.5 rounded-full border bg-surface" style={{ borderColor: colors.border }} />
      </View>

      <Pressable
        onPress={() => onSelect(story.id)}
        disabled={isDisabled}
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 10, stiffness: 300 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
        style={{ width: '100%' }}
      >
        <Animated.View
          className="w-full rounded-3xl shadow-xl overflow-hidden bg-surfaceCard"
          style={[{ shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24 }, isDisabled && { opacity: 0.6 }, animatedStyle]}>
          
          <View className="relative h-60 overflow-hidden bg-surfaceDim">
            <Image source={coverImage} className="w-full h-full" contentFit="cover" />
            <View className="absolute bottom-4 left-5">
              <AppText className="text-sm font-serif text-white/90" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                Recorded {dateObj.getFullYear()}
              </AppText>
            </View>
          </View>

          <View className="relative p-7">
            {/* Design Accent */}
            <View className="absolute left-0 top-0 bottom-0 w-1 bg-blueAccent" />

            {isBeingListened && (
              <View className="absolute right-4 top-3 z-20 p-2 rounded-full border bg-surface/90" style={{ borderColor: colors.border }}>
                <AppText className="text-[10px] font-bold text-amberDeep uppercase tracking-widest">
                  {isSelf ? 'Listening' : `${listenerName} Listening`}
                </AppText>
              </View>
            )}

            <View className="mb-4">
              <AppText className="text-3xl font-serif text-onSurface leading-tight mb-2" numberOfLines={2}>
                {displayTitle}
              </AppText>
              <AppText className="text-lg font-medium text-textFaint">
                {fullDateStr}
              </AppText>
            </View>

            <AppText className="mb-6 text-lg leading-relaxed font-serif font-light text-textFaint">
              {previewText}
            </AppText>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={() => onPlay(story.id)}
                  disabled={isDisabled}
                  className="w-16 h-16 rounded-full bg-primarySoft items-center justify-center shadow-sm"
                  activeOpacity={0.7}>
                  <Icon name="play" size={36} color={isDisabled ? colors.disabledText : colors.primaryDeep} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {isSynced && story.filePath !== 'OFFLOADED' && onOffload && (
                  <TouchableOpacity
                    onPress={() => onOffload(story.id)}
                    className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-2xl border bg-surface"
                    style={{ borderColor: colors.border }}>
                    <Icon name="phone-portrait-outline" size={16} color={colors.textMuted} />
                    <AppText className="text-xs font-semibold text-textMuted">Free space</AppText>
                  </TouchableOpacity>
                )}

                {story.filePath === 'OFFLOADED' && (
                  <View className="flex-row items-center gap-1.5 px-3 py-2 rounded-2xl bg-primary/10">
                    <Icon name="cloud-done" size={14} color={colors.primary} />
                    <AppText className="text-[11px] font-bold text-primary uppercase">Cloud Only</AppText>
                  </View>
                )}
              </View>

              <View className="items-end gap-1.5">
                <View className="flex-row items-center gap-2 mb-1">
                  {unreadCommentCount > 0 && <CommentBadge count={unreadCommentCount} />}
                  <SyncStatusBadge status={story.syncStatus} />
                </View>
                <AppText className="text-xs font-bold text-textMuted uppercase tracking-wider">
                  {durationStr} {categoryLabel ? `• ${categoryLabel}` : ''}
                </AppText>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}
