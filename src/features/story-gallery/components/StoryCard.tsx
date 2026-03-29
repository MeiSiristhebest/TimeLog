/**
 * StoryCard - Story list card component.
 *
 * Layout: Title + Date + Sync Badge + Play button
 * Touch target: ≥48dp height (WCAG AA)
 * Min height: 72dp (exceeds requirement)
 *
 * Story 3.6: Added offline state support
 * - Dimmed appearance when story is unavailable offline
 * - "Online Only" badge for cloud-only stories when offline
 * - Accessibility announcements for screen readers
 *
 * Story 4.5: Added comment badge support
 * - Shows unread comment count badge for seniors
 */

import { Icon, type IconName } from '@/components/ui/Icon';
import type { SyncStatus } from '@/types/entities';
import { SyncStatusBadge } from './SyncStatusBadge';
import { CommentBadge } from './CommentBadge';
import { formatDate, formatDuration } from '../utils/date-utils';
import { useHeritageTheme } from '@/theme/heritage';
import { STORY_ACCESSIBILITY } from '../constants';
import { AppText } from '@/components/ui/AppText';
import { AppPressable } from '@/components/ui/AppPressable';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

type StoryCardProps = {
  id: string;
  title: string | null;
  date: Date;
  durationMs: number;
  syncStatus: SyncStatus;
  onPress: () => void;
  onPlay: () => void;
  /** Callback to delete the story (Story 3.3) */
  onDelete?: () => void;
  /** Whether the story is playable in current network state (Story 3.6) */
  isPlayable?: boolean;
  /** Whether the device is currently offline (Story 3.6) */
  isOffline?: boolean;
  /** Number of unread comments (Story 4.5) */
  unreadCommentCount?: number;
  /** Callback to offload story (Local Delete) */
  onOffload?: () => void;
};

function formatUnreadCommentLabel(count: number): string {
  if (count <= 0) {
    return '';
  }

  const suffix = count === 1 ? '' : 's';
  return `, ${count} new comment${suffix}`;
}

export function StoryCard({
  id,
  title,
  date,
  durationMs,
  syncStatus,
  onPress,
  onPlay,
  onDelete,
  isPlayable = true,
  isOffline = false,
  unreadCommentCount = 0,
  onOffload,
}: StoryCardProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const formattedDate = formatDate(date);
  const formattedDuration = formatDuration(durationMs);
  const displayTitle = title || `Story ${date.toLocaleDateString('en-US')}`;

  const isUnavailable = isOffline && !isPlayable;

  const commentCountLabel = formatUnreadCommentLabel(unreadCommentCount);

  const accessibilityLabel = isUnavailable
    ? STORY_ACCESSIBILITY.UNAVAILABLE_LABEL(displayTitle, formattedDate, commentCountLabel)
    : STORY_ACCESSIBILITY.AVAILABLE_LABEL(displayTitle, formattedDate, commentCountLabel);

  return (
    <AppPressable
      onPress={onPress}
      disabled={isUnavailable}
      className={`bg-surface rounded-card border mb-4 p-4 shadow-sm overflow-visible ${isUnavailable ? 'opacity-60' : ''}`}
      style={{ borderColor: colors.border }}
      accessibilityLabel={accessibilityLabel}
      role="button">
      {/* Story 4.5: Comment badge for unread comments */}
      <CommentBadge count={unreadCommentCount} />

      {/* Story 3.6: "Online Only" badge */}
      {isUnavailable && (
        <View
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            zIndex: 10,
            backgroundColor: colors.warning,
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}>
          <AppText style={{ fontSize: 11, fontWeight: '700', color: colors.onSurface }}>
            {STORY_ACCESSIBILITY.ONLINE_ONLY_BADGE}
          </AppText>
        </View>
      )}

      <View className="flex-row items-start justify-between gap-3">
        {/* Left: Icon + Title + Date + Duration */}
        <View className="flex-1 flex-row gap-4">
          <View
            className={`w-14 h-14 rounded-2xl items-center justify-center`}
            style={{ backgroundColor: isUnavailable ? colors.disabled : `${colors.primary}15` }}>
            <Icon
              name={isUnavailable ? 'cloud-offline' : 'mic'}
              size={28}
              color={isUnavailable ? colors.handle : colors.primary}
            />
          </View>

          <View className="flex-1 justify-center">
            <AppText
              variant="title"
              numberOfLines={1}
              className="mb-1">
              {displayTitle}
            </AppText>
            <AppText
              variant="small"
              className="text-textMuted mb-2">
              {formattedDate} · {formattedDuration}
            </AppText>
            {/* Sync Badge */}
            <SyncStatusBadge status={syncStatus} className="mt-1" />
          </View>
        </View>

        {/* Right: Actions */}
        <View className="flex-row items-center gap-3">
          {/* Offload Button */}
          {syncStatus === 'synced' && !isOffline && !isUnavailable && onOffload && (
            <AppPressable
              onPress={onOffload}
              haptic={Haptics.ImpactFeedbackStyle.Light}
              className="w-12 h-12 rounded-full bg-surface border items-center justify-center shadow-sm"
              style={{ borderColor: colors.border }}
              accessibilityLabel="Free up space">
              <Icon name="phone-portrait-outline" size={20} color={colors.textMuted} />
            </AppPressable>
          )}

          {/* Delete Button */}
          {onDelete && (
            <AppPressable
              onPress={onDelete}
              haptic={Haptics.ImpactFeedbackStyle.Medium}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.error}10` }}
              accessibilityLabel="Delete story">
              <Icon name="trash-outline" size={24} color={colors.error} />
            </AppPressable>
          )}

          {/* Play button */}
          <AppPressable
            onPress={onPlay}
            disabled={isUnavailable}
            haptic={Haptics.ImpactFeedbackStyle.Heavy}
            className={`w-14 h-14 rounded-full items-center justify-center shadow-md`}
            style={{ backgroundColor: isUnavailable ? colors.disabled : colors.primary }}
            accessibilityLabel={isUnavailable ? 'Cannot play' : 'Play story'}>
            <Icon
              name="play"
              size={28}
              color={isUnavailable ? colors.handle : colors.onPrimary}
              style={{ marginLeft: 4 }}
            />
          </AppPressable>
        </View>
      </View>
    </AppPressable>
  );
}
