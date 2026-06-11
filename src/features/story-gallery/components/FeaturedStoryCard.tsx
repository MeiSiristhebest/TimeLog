import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@/components/ui/Icon';
import { AudioRecording } from '@/types/entities';
import { useHeritageTheme } from '@/theme/heritage';
import { CommentBadge } from './CommentBadge';
import { SyncStatusBadge } from './SyncStatusBadge';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { COVER_IMAGES, CATEGORY_COVERS } from '../data/mockStoryData';
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
  /** Whether the story is favorited (Story 3.6) */
  isFavorite?: boolean;
  /** Callback to toggle favorite (Story 3.6) */
  onToggleFavorite?: (id: string) => void;
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
  isFavorite = false,
  onToggleFavorite,
}: FeaturedStoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const transcription = story.transcription?.trim() ?? '';

  // Status
  const isSynced = story.syncStatus === 'synced';
  const isDisabled = isOffline && !isPlayable;

  // Animations
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Mock data (should be passed via props or context in future)
  const listenerName = 'You';
  const isSelf = listenerName.toLowerCase() === 'you';

  // Resolve Category & Cover
  const question = story.topicId ? getQuestionById(story.topicId) : null;
  const rawCategory = question?.category || 'general';

  // Use centralized mapping to match Gallery Filters
  const categoryKey = mapRawCategoryToFilter(rawCategory);
  const categoryLabel = CATEGORY_DATA.find((item) => item.id === categoryKey)?.label;

  // @ts-ignore - indexing mock data
  const coverImage = story.coverImagePath
    ? { uri: story.coverImagePath }
    : CATEGORY_COVERS[categoryKey] || COVER_IMAGES[index % COVER_IMAGES.length];

  const previewText =
    transcription.length > 0
      ? `${transcription.replace(/\s+/g, ' ').slice(0, 96)}${transcription.length > 96 ? '…' : ''}`
      : 'No transcript yet';
  const displayTitle =
    story.title?.trim() || (categoryLabel ? `${categoryLabel} Story` : 'Untitled Story');

  return (
    <View className="relative z-10 mb-6 w-full items-center overflow-visible px-4">
      {/* Center Timeline Dot */}
      <View className="absolute -top-5 left-0 right-0 z-20 items-center" pointerEvents="none">
        <View
          className="h-[9px] w-[9px] rounded-full border bg-surface"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        />
      </View>

      {/* Outer Shadow Container */}
      <Pressable
        onPress={() => onSelect(story.id)}
        disabled={isDisabled}
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 10, stiffness: 300 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
        style={{ width: '100%' }}>
        <Animated.View
          className="elevation-8 w-full rounded-2xl shadow-lg"
          style={[
            {
              backgroundColor: colors.surfaceCard,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
            },
            isDisabled && { opacity: 0.6 },
            animatedStyle,
          ]}>
          {/* Inner Content Container */}
          <View
            className="w-full overflow-hidden rounded-2xl"
            style={{ backgroundColor: colors.surfaceCard }}>
            {/* Cover Image */}
            <View
              className="relative h-56 overflow-hidden"
              style={{ backgroundColor: colors.surfaceDim }}>
              <Image
                source={coverImage}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              {/* Recorded Year Overlay */}
              <View className="absolute bottom-3 left-4">
                <AppText
                  className="font-serif text-sm tracking-wide text-white opacity-90"
                  style={{
                    textShadowColor: 'rgba(0,0,0,0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}>
                  Recorded {dateObj.getFullYear()}
                </AppText>
              </View>
            </View>

            {/* Content with left accent bar */}
            <View className="relative p-6 pt-8">
              {/* Left Accent Bar */}
              <View
                className="absolute bottom-0 left-0 top-0 w-1"
                style={{ backgroundColor: colors.blueAccent }}
              />

              {isBeingListened && (
                <View className="absolute right-3 top-2 z-20" pointerEvents="none">
                  <View
                    style={{
                      backgroundColor: `${colors.surface}E6`,
                      borderColor: colors.border,
                      borderWidth: 0.5,
                      paddingHorizontal: 7,
                      paddingVertical: 1.5,
                      borderRadius: 999,
                      maxWidth: 112,
                    }}>
                    <AppText
                      numberOfLines={1}
                      style={{
                        fontSize: 8,
                        letterSpacing: 0.2,
                        color: colors.amberDeep,
                        fontWeight: '600',
                      }}>
                      {isSelf ? 'You are listening' : `${listenerName} is listening`}
                    </AppText>
                  </View>
                </View>
              )}

              {/* Title Section */}
              <View className="mb-4">
                <View className="mb-1 flex-row items-start justify-between">
                  <AppText
                    className="flex-1 text-3xl leading-9 tracking-tighter"
                    style={{ fontFamily: 'Fraunces_300Light', color: colors.onSurface }}
                    numberOfLines={2}>
                    {displayTitle}
                  </AppText>
                </View>

                <AppText
                  className="text-xl font-medium tracking-wide"
                  style={{ color: colors.textFaint }}>
                  {fullDateStr}
                </AppText>
              </View>

              {/* PREVIEW */}
              <AppText
                className="mb-6 text-lg leading-7"
                style={{ fontFamily: 'Fraunces_300Light', color: colors.textFaint }}>
                {previewText}
              </AppText>

              {/* Footer */}
              <View className="flex-row items-center justify-between">
                {/* Right: Actions */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(story.id);
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isFavorite ? `${colors.iconRed}15` : colors.surfaceDim,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={22}
                      color={isFavorite ? colors.iconRed : colors.textMuted}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onPlay(story.id)}
                    disabled={isDisabled}
                    className="h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.primarySoft }}
                    activeOpacity={0.7}>
                    <Ionicons
                      name="play"
                      size={32}
                      color={isDisabled ? colors.disabledText : colors.primaryDeep}
                      style={{ marginLeft: 3 }}
                    />
                  </TouchableOpacity>

                  {/* Offload Button - Only if Synced and Not Offloaded */}
                  {isSynced && story.filePath !== 'OFFLOADED' && onOffload && (
                    <TouchableOpacity
                      onPress={() => onOffload(story.id)}
                      className="flex-row items-center gap-1 rounded-2xl border px-3 py-2"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }}>
                      <Ionicons name="phone-portrait-outline" size={14} color={colors.textMuted} />
                      <AppText className="text-xs" style={{ color: colors.textMuted }}>
                        Free up Space
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row items-end gap-4">
                  {unreadCommentCount > 0 && (
                    <View className="mb-1">
                      <CommentBadge count={unreadCommentCount} />
                    </View>
                  )}

                  <View className="items-end gap-1.5">
                    <AppText className="text-xs font-medium" style={{ color: colors.textMuted }}>
                      {durationStr}
                    </AppText>

                    <View className="items-end gap-1">
                      {/* Cloud Only Indicator - Now ultra-subtle mini-badge */}
                      {story.filePath === 'OFFLOADED' && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                            paddingHorizontal: 4,
                            paddingVertical: 1,
                            borderRadius: 4,
                            borderWidth: 0.5,
                            borderColor: `${colors.primary}40`,
                            marginBottom: 2,
                          }}>
                          <Ionicons name="cloud-done" size={8} color={colors.primary} />
                          <AppText
                            style={{
                              fontSize: 7.5,
                              fontWeight: '700',
                              color: colors.primary,
                              letterSpacing: 0.5,
                              textTransform: 'uppercase',
                            }}>
                            Cloud Only
                          </AppText>
                        </View>
                      )}

                      <SyncStatusBadge status={story.syncStatus} />
                    </View>

                    {categoryLabel ? (
                      <AppText className="text-xs font-medium" style={{ color: colors.textMuted }}>
                        {categoryLabel}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}
