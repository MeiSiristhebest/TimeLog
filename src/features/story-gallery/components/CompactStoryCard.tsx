import { AppText } from '@/components/ui/AppText';
import { Pressable, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
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
  /** Whether the story is favorited (Story 3.6) */
  isFavorite?: boolean;
  /** Callback to toggle favorite (Story 3.6) */
  onToggleFavorite?: (id: string) => void;
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
  isFavorite = false,
  onToggleFavorite,
}: CompactStoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();

  // Animations
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Status
  const isSynced = story.syncStatus === 'synced';
  const isDisabled = isOffline && !isPlayable;
  const accentColor = colors.primaryMuted; // #EABFAA

  // Font adjustments
  const FONTS = {
    serifLight: 'Fraunces_300Light',
  };

  const question = story.topicId ? getQuestionById(story.topicId) : null;
  const questionCategory = question?.category;
  const categoryLabel = questionCategory
    ? CATEGORY_DATA.find((item) => item.id === mapRawCategoryToFilter(questionCategory))?.label
    : undefined;
  const displayTitle = story.title?.trim() || (categoryLabel ? `${categoryLabel} Story` : 'Untitled Story');

  return (
    <View style={styles.wrapper}>
      {/* Center Timeline Dot - Absolute Container for perfect centering */}
      <View
        style={styles.timelineDotContainer}
        pointerEvents="none">
        <View
          style={[
            styles.timelineDot,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        />
      </View>

      {/* Outer Shadow Container */}
      <Pressable
        onPress={() => onSelect(story.id)}
        disabled={isDisabled}
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 10, stiffness: 300 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
        style={{ width: '100%' }}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              backgroundColor: colors.surfaceCard,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            },
            isDisabled && { opacity: 0.6 },
            animatedStyle,
          ]}>
          {/* Inner Content Container */}
          <View style={[styles.innerContent, { backgroundColor: colors.surfaceCard }]}>
            {/* Left Accent Bar */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

            {/* Content */}
            <View style={styles.content}>
              <AppText style={[styles.yearText, { color: colors.textMuted }]}>
                {dateObj.getFullYear()}
              </AppText>

              <AppText
                style={[styles.titleText, { fontFamily: FONTS.serifLight, color: colors.onSurface }]}
                numberOfLines={2}>
                {displayTitle}
              </AppText>

              <AppText style={[styles.dateText, { color: colors.textMuted }]}>
                {fullDateStr}
              </AppText>

              <AppText style={[styles.durationText, { color: colors.textMuted }]}>
                {categoryLabel ? `${durationStr} · ${categoryLabel}` : durationStr}
              </AppText>
            </View>

            <View style={styles.rightActions}>
              {/* Offload Button - Only if Synced and Not Offloaded */}
              {isSynced && story.filePath !== 'OFFLOADED' && onOffload && (
                <TouchableOpacity
                  onPress={() => onOffload(story.id)}
                  style={[
                    styles.offloadButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Ionicons name="phone-portrait-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              {/* Cloud Only Indicator */}
              {story.filePath === 'OFFLOADED' && (
                <View style={{ marginRight: 8 }}>
                  <Ionicons name="cloud-done" size={16} color={colors.primary} />
                </View>
              )}

              {/* Favorite Button */}
              <TouchableOpacity
                onPress={() => onToggleFavorite?.(story.id)}
                style={[
                  styles.offloadButton,
                  {
                    backgroundColor: isFavorite ? `${colors.iconRed}15` : colors.surface,
                    borderColor: isFavorite ? colors.iconRed : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={16}
                  color={isFavorite ? colors.iconRed : colors.textMuted}
                />
              </TouchableOpacity>

              <HeritageButton
                title=""
                onPress={() => onPlay(story.id)}
                disabled={isDisabled}
                style={styles.playButton}
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

          <View style={styles.syncBadge}>
            <SyncStatusBadge status={story.syncStatus} />
          </View>
        </Animated.View>
      </Pressable>
    </View >
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  timelineDotContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    top: 20,
    zIndex: 20,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 16,
    minHeight: 100,
  },
  innerContent: {
    width: '100%',
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 16,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
    paddingLeft: 28,
    paddingRight: 20,
  },
  yearText: {
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  titleText: {
    marginBottom: 4,
    fontSize: 20,
  },
  dateText: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  rightActions: {
    marginRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offloadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#F7E7DF',
    paddingHorizontal: 0
  },
  syncBadge: {
    position: 'absolute',
    right: 16,
    bottom: 10,
    zIndex: 5,
  },
});
