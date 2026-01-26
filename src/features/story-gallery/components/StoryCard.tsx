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

import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import type { SyncStatus } from '@/types/entities';
import { SyncStatusBadge } from './SyncStatusBadge';
import { CommentBadge } from './CommentBadge';
import { formatDate, formatDuration } from '../utils/date-utils';
import { useHeritageTheme } from '@/theme/heritage';
import { STORY_ACCESSIBILITY } from '../constants';

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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
        marginBottom: 14,
        // Premium Heritage Shadow
        // Premium Heritage Shadow
        // shadowColor: colors.shadow,
        // shadowOffset: { width: 0, height: 8 },
        // shadowOpacity: 0.12,
        // shadowRadius: 16,
        // elevation: 6,
        // @ts-ignore - RN 0.76+
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
        opacity: isUnavailable ? 0.6 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={
        isUnavailable ? STORY_ACCESSIBILITY.UNAVAILABLE_HINT : STORY_ACCESSIBILITY.AVAILABLE_HINT
      }
      accessibilityState={{ disabled: isUnavailable }}>
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

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
        }}>
        {/* Left: Icon + Title + Date + Duration */}
        <View style={{ flex: 1, flexDirection: 'row', gap: 14 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: isUnavailable ? colors.disabled : `${colors.primary}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons
              name={isUnavailable ? 'cloud-offline' : 'mic'}
              size={22}
              color={isUnavailable ? colors.handle : colors.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <AppText
              numberOfLines={1}
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 18,
                color: colors.onSurface,
                marginBottom: 4,
                lineHeight: 24,
              }}>
              {displayTitle}
            </AppText>
            <AppText
              style={{
                fontSize: 14,
                color: colors.textMuted,
                fontFamily: 'System',
                marginBottom: 6,
              }}>
              {formattedDate} · {formattedDuration}
            </AppText>
            {/* Sync Badge */}
            <SyncStatusBadge status={syncStatus} className="mt-1" />
          </View>
        </View>

        {/* Right: Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Delete Button */}
          {onDelete && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 48, // Increased from 40 for touch target compliance
                height: 48,
                borderRadius: 24,
                backgroundColor: `${colors.error}10`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Delete story">
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          )}

          {/* Play button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isUnavailable ? colors.disabled : colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              // shadowColor: colors.primary,
              // shadowOffset: { width: 0, height: 4 },
              // shadowOpacity: isUnavailable ? 0 : 0.25,
              // shadowRadius: 8,
              // elevation: 4,
              // @ts-ignore
              boxShadow: isUnavailable ? 'none' : '0 4px 8px rgba(234, 191, 170, 0.25)', // Using primary color approx or theme ref
            }}
            accessibilityRole="button"
            accessibilityLabel={isUnavailable ? 'Cannot play' : 'Play story'}
            disabled={isUnavailable}>
            <Ionicons
              name="play"
              size={22}
              color={isUnavailable ? colors.handle : colors.onPrimary}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
