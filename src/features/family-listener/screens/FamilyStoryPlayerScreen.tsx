/**
 * Family Story Player Screen
 *
 * Secure audio player for family users to listen to senior's stories.
 * Uses signed URLs for secure streaming. Includes comment section.
 *
 * Story 4.2: Secure Streaming Player (AC: 2, 5)
 * Story 4.3: Realtime Comment System (AC: 1, 2, 3, 4, 5)
 */

import { AppText } from '@/components/ui/AppText';
import { useState, useEffect, type ReactNode } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/ui/Container';
import { PlaybackControls } from '@/features/family-listener/components/PlaybackControls';
import { CommentSection } from '@/features/family-listener/components/CommentSection';
import { HeartIcon } from '@/features/family-listener/components/HeartIcon';
import { useFamilyPlayer } from '@/features/family-listener/hooks/useFamilyPlayer';
import { useReaction } from '@/features/family-listener/hooks/useReaction';
import { fetchStoryById } from '@/features/family-listener/services/familyStoryService';
import { useCurrentUserId } from '@/features/auth/hooks/useCurrentUserId';
import { useHeritageTheme } from '@/theme/heritage';

// ... imports
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const STORY_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/**
 * Formats timestamp to absolute date.
 */
function formatAbsoluteDate(timestamp: number): string {
  return STORY_DATE_FORMATTER.format(new Date(timestamp));
}

type SpringPressableProps = Omit<PressableProps, 'style'> & {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
};

function SpringPressable({
  children,
  onPress,
  style,
  ...props
}: SpringPressableProps): JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  return (
    <Animated.Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...props}>
      {children}
    </Animated.Pressable>
  );
}

export default function FamilyStoryPlayerScreen(): JSX.Element {
  // ... (hooks and state)
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { currentUserId } = useCurrentUserId();
  const [showComments, setShowComments] = useState(false);
  const { colors } = useHeritageTheme();
  const containerStyle = { backgroundColor: colors.surface };
  const storyId = typeof id === 'string' ? id : null;

  // Fetch story details
  const {
    data: story,
    isLoading: isLoadingStory,
    error: storyError,
  } = useQuery({
    queryKey: ['familyStory', storyId],
    queryFn: async () => {
      if (!storyId) {
        throw new Error('Story ID is required');
      }
      return fetchStoryById(storyId);
    },
    enabled: Boolean(storyId),
    staleTime: 2 * 60 * 1000,
  });

  // Player hook
  const { playerState, load, togglePlayPause, seek, unload } = useFamilyPlayer(storyId);

  // Reaction hook for quick heart reactions
  const { hasReacted, toggleReaction, isPending: isReactionPending } = useReaction(storyId);

  // Load audio when story is available
  useEffect(() => {
    if (story && playerState.state === 'idle') {
      load();
    }
  }, [story, playerState.state, load]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unload();
    };
  }, [unload]);

  // Handle back navigation
  const handleBack = () => {
    unload();
    router.back();
  };

  // Toggle comments view
  const toggleComments = () => {
    setShowComments((current) => !current);
  };

  // Loading state
  if (isLoadingStory) {
    return (
      <Container style={containerStyle}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurface }]}>
            Loading story...
          </AppText>
        </View>
      </Container>
    );
  }

  // Error state
  if (!storyId || storyError || !story) {
    return (
      <Container style={containerStyle}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.onSurface }]}>
            Could not load story
          </AppText>
          <AppText style={[styles.errorSubtitle, { color: colors.textMuted }]}>
            {storyError?.message || (!storyId ? 'Story ID is missing' : 'Story does not exist or is inaccessible')}
          </AppText>
          <HeritageButton
            title="Back"
            onPress={handleBack}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>
      </Container>
    );
  }

  // Player error state
  if (playerState.state === 'error') {
    return (
      <Container style={containerStyle}>
        <View style={styles.errorContainer}>
          <Ionicons name="musical-notes-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.onSurface }]}>
            Could not play audio
          </AppText>
          <AppText style={[styles.errorSubtitle, { color: colors.textMuted }]}>
            {playerState.error || 'Please try again later'}
          </AppText>
          <HeritageButton
            title="Retry"
            onPress={load}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>
      </Container>
    );
  }

  // Player loading state
  if (playerState.state === 'loading') {
    return (
      <Container style={containerStyle}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.textMuted }]}>
            Preparing playback...
          </AppText>
        </View>
      </Container>
    );
  }

  // Comments view (full screen)
  if (showComments) {
    return (
      <Container style={containerStyle}>
        {/* Heritage Header [Modified] */}
        <HeritageHeader title={story.title ?? 'Untitled Story'} showBack onBack={toggleComments} />

        {/* Comment section */}
        <CommentSection
          storyId={storyId}
          currentUserId={currentUserId}
          readOnly={false}
          header={null}
        />
      </Container>
    );
  }

  // Main player view
  return (
    <Container style={containerStyle}>
      {/* Back button using SpringPressable */}
      <SpringPressable
        onPress={handleBack}
        style={[styles.absoluteBackButton, { backgroundColor: `${colors.onSurface}10` }]}
        accessibilityRole="button"
        accessibilityLabel="Back to story list">
        <Ionicons name="arrow-back" size={28} color={colors.onSurface} />
      </SpringPressable>

      {/* Heart reaction button */}
      <View style={styles.topRightControls}>
        <HeartIcon isLiked={hasReacted} onToggle={toggleReaction} disabled={isReactionPending} />

        {/* Comments button using SpringPressable */}
        <SpringPressable
          onPress={toggleComments}
          style={[styles.iconButton, { backgroundColor: `${colors.onSurface}10` }]}
          accessibilityRole="button"
          accessibilityLabel="View comments">
          <Ionicons name="chatbubble-outline" size={24} color={colors.onSurface} />
        </SpringPressable>
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Story Info */}
        <View style={styles.storyInfoContainer}>
          {/* Story icon */}
          <View style={[styles.storyIconCircle, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="mic" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <AppText style={[styles.storyTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {story.title ?? 'Untitled Story'}
          </AppText>

          {/* Date */}
          <AppText style={[styles.storyDate, { color: colors.textMuted }]}>
            {formatAbsoluteDate(story.startedAt)}
          </AppText>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsWrapper}>
          <PlaybackControls
            isPlaying={playerState.state === 'playing'}
            isBuffering={playerState.isBuffering}
            isCompleted={playerState.state === 'completed'}
            positionMs={playerState.positionMs}
            durationMs={playerState.durationMs}
            onPlayPause={togglePlayPause}
            onSeek={seek}
          />
        </View>

        {/* View comments button using HeritageButton */}
        <HeritageButton
          title="Comments"
          icon="chatbubbles-outline"
          onPress={toggleComments}
          variant="secondary"
          style={{ marginTop: 32 }}
        />
      </View>

      {/* Back to list button (for completed state, uses HeritageButton) */}
      {playerState.state === 'completed' && (
        <View style={styles.bottomContainer}>
          <HeritageButton
            title="Back to story list"
            onPress={handleBack}
            variant="outline"
            style={{ width: '100%', maxWidth: 300 }}
          />
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 9999,
  },
  absoluteBackButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 9999,
  },
  topRightControls: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  storyInfoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  storyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  storyDate: {
    fontSize: 16,
  },
  controlsWrapper: {
    width: '100%',
    maxWidth: 384,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
