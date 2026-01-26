import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@/components/ui/Icon';
import { AudioRecording } from '@/types/entities';
import { useHeritageTheme } from '@/theme/heritage';
import { CommentBadge } from './CommentBadge';

import {
  COVER_IMAGES,
  PREVIEW_TEXT_PLACEHOLDER,
  LISTENER_NAME_DEFAULT,
} from '../data/mockStoryData';

export interface FeaturedStoryCardProps {
  story: AudioRecording;
  index: number;
  dateObj: Date;
  fullDateStr: string;
  durationStr: string;
  isPlayable?: boolean;
  isOffline?: boolean;
  unreadCommentCount?: number;
  onPlay: (id: string) => void;
  onSelect: (id: string) => void;
}

export function FeaturedStoryCard({
  story,
  index,
  dateObj,
  fullDateStr,
  durationStr,
  isPlayable = true,
  isOffline = false,
  unreadCommentCount = 0,
  onPlay,
  onSelect,
}: FeaturedStoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();

  // Status
  const isSynced = story.syncStatus === 'synced';
  const isSyncing = story.syncStatus === 'syncing' || story.syncStatus === 'queued';
  const isDisabled = isOffline && !isPlayable;

  // Mock data (should be passed via props or context in future)
  const isBeingListened = index === 0;
  const listenerName = LISTENER_NAME_DEFAULT;
  const coverImage = COVER_IMAGES[index % COVER_IMAGES.length];
  const previewText = PREVIEW_TEXT_PLACEHOLDER;

  // Font adjustments
  const FONTS = {
    serifLight: 'Fraunces_300Light',
    serifSemiBold: 'Fraunces_600SemiBold',
  };

  return (
    <View style={styles.featuredCardContainer}>
      {/* Center Timeline Dot */}
      <View
        style={[
          styles.centerDot,
          {
            top: -20,
            borderColor: colors.border, // #D6D3D1 equivalent
            backgroundColor: colors.surface,
          },
        ]}
      />

      {/* Outer Shadow Container */}
      <TouchableOpacity
        onPress={() => onSelect(story.id)}
        activeOpacity={0.9}
        disabled={isDisabled}
        style={[
          styles.featuredShadowWrapper,
          styles.elevatedShadow,
          { backgroundColor: colors.surfaceCard }, // Use theme
          isDisabled && { opacity: 0.6 },
        ]}>
        {/* Inner Content Container */}
        <View style={[styles.featuredCardInner, { backgroundColor: colors.surfaceCard }]}>
          {/* Cover Image */}
          <View style={[styles.coverImageContainer, { backgroundColor: colors.surfaceDim }]}>
            <Image source={coverImage} style={styles.coverImage} contentFit="cover" />
            {/* Recorded Year Overlay */}
            <View style={styles.yearOverlay}>
              <AppText style={[styles.yearText, { fontFamily: FONTS.serifSemiBold }]}>
                Recorded {dateObj.getFullYear()}
              </AppText>
            </View>
          </View>

          {/* Content with left accent bar */}
          <View style={styles.featuredContent}>
            {/* Left Accent Bar */}
            <View style={[styles.accentBar, { backgroundColor: colors.blueAccent }]} />

            {/* Title Section */}
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <AppText
                  style={[
                    styles.featuredTitle,
                    { fontFamily: FONTS.serifLight, color: colors.onSurface },
                  ]}
                  numberOfLines={2}>
                  {story.title || 'Untitled Story'}
                </AppText>

                {isBeingListened && (
                  <View style={styles.listeningBadge}>
                    <AppText style={[styles.listeningText, { color: colors.amberDeep }]}>
                      {listenerName.toUpperCase()} IS LISTENING
                    </AppText>
                  </View>
                )}
              </View>

              <AppText style={[styles.featuredDate, { color: colors.textFaint }]}>
                {fullDateStr}
              </AppText>
            </View>

            {/* PREVIEW */}
            <AppText
              style={[
                styles.previewText,
                { fontFamily: FONTS.serifLight, color: colors.textFaint },
              ]}>
              {previewText}
            </AppText>

            {/* Footer */}
            <View style={styles.featuredFooter}>
              <TouchableOpacity
                onPress={() => onPlay(story.id)}
                disabled={isDisabled}
                style={[styles.playButtonLarge, { backgroundColor: colors.primarySoft }]}
                activeOpacity={0.7}>
                <Ionicons
                  name="play"
                  size={32}
                  color={isDisabled ? colors.disabledText : colors.primaryDeep}
                  style={{ marginLeft: 3 }}
                />
              </TouchableOpacity>

              <View style={styles.footerRight}>
                {unreadCommentCount > 0 && (
                  <View style={styles.commentBadgeContainer}>
                    <CommentBadge count={unreadCommentCount} />
                  </View>
                )}

                <View style={styles.durationStatusContainer}>
                  <AppText style={[styles.durationText, { color: colors.textMuted }]}>
                    {durationStr}
                  </AppText>
                  <View style={styles.syncStatus}>
                    {isSynced && (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                        <AppText style={[styles.syncText, { color: colors.textMuted }]}>
                          Saved to cloud
                        </AppText>
                      </>
                    )}
                    {isSyncing && (
                      <>
                        <Ionicons name="cloud-outline" size={18} color={colors.disabledText} />
                        <AppText style={[styles.syncingText, { color: colors.disabledText }]}>
                          Waiting for sync...
                        </AppText>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  featuredCardContainer: {
    position: 'relative',
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'visible',
    zIndex: 1,
  },
  featuredShadowWrapper: {
    width: '100%',
    borderRadius: 16,
  },
  featuredCardInner: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
  },
  coverImageContainer: {
    position: 'relative',
    height: 160,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  yearOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 16,
  },
  yearText: {
    fontSize: 14,
    letterSpacing: 0.5,
    color: 'white',
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredContent: {
    position: 'relative',
    padding: 24,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  featuredTitle: {
    flex: 1,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  listeningBadge: {
    marginLeft: 8,
    paddingTop: 8,
  },
  listeningText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  featuredDate: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  previewText: {
    marginBottom: 24,
    fontSize: 18,
    lineHeight: 28,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  commentBadgeContainer: {
    marginBottom: 4,
  },
  durationStatusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '500',
  },
  syncingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  playButtonLarge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  centerDot: {
    position: 'absolute',
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    zIndex: 20,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  elevatedShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
});
