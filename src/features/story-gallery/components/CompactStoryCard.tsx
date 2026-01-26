import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { AudioRecording } from '@/types/entities';
import { useHeritageTheme } from '@/theme/heritage';
import { CommentBadge } from './CommentBadge';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';

export interface CompactStoryCardProps {
  story: AudioRecording;
  dateObj: Date;
  fullDateStr: string;
  isPlayable?: boolean;
  isOffline?: boolean;
  unreadCommentCount?: number;
  onPlay: (id: string) => void;
  onSelect: (id: string) => void;
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
}: CompactStoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();

  // Status
  const isSynced = story.syncStatus === 'synced';
  const isSyncing = story.syncStatus === 'syncing' || story.syncStatus === 'queued';
  const isDisabled = isOffline && !isPlayable;
  const accentColor = colors.primaryMuted; // #EABFAA

  // Font adjustments
  const FONTS = {
    serifLight: 'Fraunces_300Light',
  };

  return (
    <View style={styles.compactCardContainer}>
      {/* Center Timeline Dot */}
      <View
        style={[
          styles.centerDot,
          {
            top: 20,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      />

      {/* Outer Shadow Container */}
      <TouchableOpacity
        onPress={() => onSelect(story.id)}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[
          styles.compactShadowWrapper,
          styles.cardShadow,
          { backgroundColor: colors.surfaceCard },
          isDisabled && { opacity: 0.6 },
        ]}>
        {/* Inner Content Container */}
        <View style={[styles.compactCardInner, { backgroundColor: colors.surfaceCard }]}>
          {/* Left Accent Bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          {/* Content */}
          <View style={styles.compactContent}>
            <AppText style={[styles.yearTag, { color: colors.textMuted }]}>
              {dateObj.getFullYear()}
            </AppText>

            <AppText
              style={[
                styles.compactTitle,
                { fontFamily: FONTS.serifLight, color: colors.onSurface },
              ]}
              numberOfLines={2}>
              {story.title || 'Untitled Story'}
            </AppText>

            <AppText style={[styles.compactDate, { color: colors.textFaint }]}>
              {fullDateStr}
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

          <View style={styles.compactRightSection}>
            <HeritageButton
              title=""
              onPress={() => onPlay(story.id)}
              disabled={isDisabled}
              style={StyleSheet.flatten([
                styles.playButtonSmall,
                { backgroundColor: colors.primarySoft, paddingHorizontal: 0 },
              ])}
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
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  compactCardContainer: {
    position: 'relative',
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    overflow: 'visible',
    zIndex: 1,
  },
  compactShadowWrapper: {
    width: '100%',
    borderRadius: 16,
    minHeight: 100,
  },
  compactCardInner: {
    width: '100%',
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 16,
  },
  compactContent: {
    flex: 1,
    padding: 20,
    paddingRight: 20,
    paddingLeft: 28,
  },
  yearTag: {
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  compactTitle: {
    marginBottom: 4,
    fontSize: 20,
  },
  compactDate: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  compactRightSection: {
    marginRight: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
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
  playButtonSmall: {
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
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
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});
