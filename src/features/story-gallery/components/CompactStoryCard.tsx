import { AppText } from '@/components/ui/AppText';
import { Pressable, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { AudioRecording } from '@/types/entities';
import { useHeritageTheme } from '@/theme/heritage';
import { CommentBadge } from './CommentBadge';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getQuestionById } from '@/features/recorder/data/topicQuestions';

export interface CompactStoryCardProps {
  story: AudioRecording;
  dateObj: Date;
  fullDateStr: string;
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
  isPlayable = true,
  isOffline = false,
  unreadCommentCount = 0,
  onPlay,
  onSelect,
  onOffload,
}: CompactStoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();

  // Animations
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Status
  const isSynced = story.syncStatus === 'synced';
  const isSyncing = story.syncStatus === 'syncing' || story.syncStatus === 'queued';
  const isDisabled = isOffline && !isPlayable;
  const accentColor = colors.primaryMuted; // #EABFAA

  // Font adjustments
  const FONTS = {
    serifLight: 'Fraunces_300Light',
  };

  const question = story.topicId ? getQuestionById(story.topicId) : null;
  const displayTitle = story.title || question?.text || 'Untitled Story';

  return (
    <View className="relative mb-4 w-full items-center pt-2 px-4 z-10">
      {/* Center Timeline Dot - Absolute Container for perfect centering */}
      <View
        className="absolute left-0 right-0 items-center"
        style={[{ top: 20, zIndex: 20 }]}
        pointerEvents="none">
        <View
          className="w-[9px] h-[9px] rounded-full border"
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
      >
        <Animated.View
          className="w-full rounded-2xl min-h-[100px] shadow-sm elevation-3"
          style={[
            {
              backgroundColor: colors.surfaceCard,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            isDisabled && { opacity: 0.6 },
            animatedStyle,
          ]}>
          {/* Inner Content Container */}
          <View className="w-full min-h-[100px] flex-row items-center overflow-hidden rounded-2xl" style={{ backgroundColor: colors.surfaceCard }}>
            {/* Left Accent Bar */}
            <View className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accentColor }} />

            {/* Content */}
            <View className="flex-1 py-5 pl-7 pr-5">
              <AppText className="mb-1 text-[11px] font-medium tracking-[0.5px]" style={{ color: colors.textMuted }}>
                {dateObj.getFullYear()}
              </AppText>

              <AppText
                className="mb-1 text-xl"
                style={{ fontFamily: FONTS.serifLight, color: colors.onSurface }}
                numberOfLines={2}>
                {displayTitle}
              </AppText>

              <AppText className="mb-3 text-xl font-medium tracking-[0.3px]" style={{ color: colors.textFaint }}>
                {fullDateStr}
              </AppText>

              <View className="flex-row items-center gap-[6px]">
                {isSynced && (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <AppText className="text-xs font-medium" style={{ color: colors.textMuted }}>
                      Saved to cloud
                    </AppText>
                  </>
                )}
                {isSyncing && (
                  <>
                    <Ionicons name="cloud-outline" size={18} color={colors.disabledText} />
                    <AppText className="text-xs font-medium" style={{ color: colors.disabledText }}>
                      Waiting for sync...
                    </AppText>
                  </>
                )}
              </View>
            </View>

            <View className="mr-5 flex-row items-center gap-2">
              {/* Offload Button - Only if Synced and Not Offloaded */}
              {isSynced && story.filePath !== 'OFFLOADED' && onOffload && (
                <TouchableOpacity
                  onPress={() => onOffload(story.id)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}>
                  <Ionicons name="phone-portrait-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              {/* Cloud Only Indicator */}
              {story.filePath === 'OFFLOADED' && (
                <View style={{ marginRight: 8 }}>
                  <Ionicons name="cloud-done" size={16} color={colors.primary} />
                </View>
              )}

              <HeritageButton
                title=""
                onPress={() => onPlay(story.id)}
                disabled={isDisabled}
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 24,
                  backgroundColor: colors.primarySoft,
                  paddingHorizontal: 0
                }}
                iconElement={
                  <Ionicons
                    name="play"
                    size={28}
                    color={isDisabled ? colors.disabledText : colors.primaryDeep}
                    style={{ marginLeft: 3 }}
                  />
                }
                accessibilityLabel="Play story"
              />

              {unreadCommentCount > 0 && <CommentBadge count={unreadCommentCount} />}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View >
  );
}
