import { AppText } from '@/components/ui/AppText';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { AudioRecording } from '@/types/entities';
import { useHeritageTheme } from '@/theme/heritage';
import { CommentBadge } from './CommentBadge';
import { SyncStatusBadge } from './SyncStatusBadge';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getQuestionById } from '@/features/recorder/data/topicQuestions';
import { CATEGORY_DATA, mapRawCategoryToFilter } from '../data/mockGalleryData';

export interface CompactStoryCardProps {
  story: AudioRecording;
  dateObj: Date;
  fullDateStr: string;
  durationStr: string;
  isPlayable?: boolean;
  isOffline?: boolean;
  unreadCommentCount?: number;
  onPlay: (id: string) => void;
  onSelect: (id: string) => void;
  onOffload?: (id: string) => void;
}

export function CompactStoryCard({
  story,
  dateObj,
  fullDateStr,
  durationStr,
  isPlayable = true,
  isOffline = false,
  unreadCommentCount = 0,
  onPlay,
  onSelect,
  onOffload,
}: CompactStoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isSynced = story.syncStatus === 'synced';
  const isDisabled = isOffline && !isPlayable;
  const accentColor = colors.primaryMuted;

  const question = story.topicId ? getQuestionById(story.topicId) : null;
  const questionCategory = question?.category;
  const categoryLabel = questionCategory
    ? CATEGORY_DATA.find((item) => item.id === mapRawCategoryToFilter(questionCategory))?.label
    : undefined;
  const displayTitle = story.title?.trim() || (categoryLabel ? `${categoryLabel} Story` : 'Untitled Story');

  return (
    <View className="relative mb-4 w-full items-center pt-2 px-4 z-10">
      {/* Timeline Centered Dot */}
      <View className="absolute left-0 right-0 items-center top-5 z-20" pointerEvents="none">
        <View className="w-2.5 h-2.5 rounded-full border bg-surface" style={{ borderColor: colors.border }} />
      </View>

      <Pressable
        onPress={() => onSelect(story.id)}
        disabled={isDisabled}
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 10, stiffness: 300 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
        className="w-full"
      >
        <Animated.View
          className="w-full min-h-[100px] rounded-2xl shadow-sm elevation-3 bg-surfaceCard overflow-hidden"
          style={[{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 }, isDisabled && { opacity: 0.6 }, animatedStyle]}>
          
          <View className="flex-row items-center w-full min-h-[100px] py-4 relative">
            {/* Design Accent */}
            <View className="absolute left-0 top-0 bottom-0 w-1 px-0.5" style={{ backgroundColor: accentColor }} />

            {/* Information Section */}
            <View className="flex-1 pl-7 pr-4">
              <AppText className="text-[10px] font-bold tracking-widest text-textMuted uppercase mb-1">
                {dateObj.getFullYear()}
              </AppText>
              <AppText className="text-xl font-serif text-onSurface mb-1 leading-tight" numberOfLines={2}>
                {displayTitle}
              </AppText>
              <AppText className="text-lg font-medium text-textFaint mb-2">
                {fullDateStr}
              </AppText>
              <AppText className="text-xs font-semibold text-textMuted uppercase tracking-wider">
                {durationStr} {categoryLabel ? `• ${categoryLabel}` : ''}
              </AppText>
            </View>

            {/* Actions Section */}
            <View className="flex-row items-center px-5 gap-3">
              {isSynced && story.filePath !== 'OFFLOADED' && onOffload && (
                <TouchableOpacity
                  onPress={() => onOffload(story.id)}
                  className="w-10 h-10 rounded-full bg-surface border items-center justify-center"
                  style={{ borderColor: colors.border }}>
                  <Icon name="phone-portrait-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              {story.filePath === 'OFFLOADED' && (
                <View className="w-8 h-8 items-center justify-center">
                  <Icon name="cloud-done" size={20} color={colors.primary} />
                </View>
              )}

              <HeritageButton
                title=""
                onPress={() => onPlay(story.id)}
                disabled={isDisabled}
                className="w-12 h-12 rounded-full bg-primarySoft p-0"
                iconElement={
                  <Icon name="play" size={28} color={isDisabled ? colors.disabledText : colors.primaryDeep} style={{ marginLeft: 3 }} />
                }
                accessibilityLabel="Play story"
              />

              {unreadCommentCount > 0 && <CommentBadge count={unreadCommentCount} />}
            </View>

            {/* Sync Status Badge (Absolute Bottom Right) */}
            <View className="absolute right-4 bottom-3">
              <SyncStatusBadge status={story.syncStatus} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}
