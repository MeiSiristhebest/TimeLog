/**
 * Family Story Player Screen
 *
 * Secure audio player for family users to listen to senior's stories.
 * Uses signed URLs for secure streaming. Includes comment section.
 *
 * Story 4.2: Secure Streaming Player (AC: 2, 5)
 * Story 4.3: Realtime Comment System (AC: 1, 2, 3, 4, 5)
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/ui/Container';
import { PlaybackControls } from '@/features/family-listener/components/PlaybackControls';
import { CommentSection } from '@/features/family-listener/components/CommentSection';
import { HeartIcon } from '@/features/family-listener/components/HeartIcon';
import { useFamilyPlayer } from '@/features/family-listener/hooks/useFamilyPlayer';
import { useReaction } from '@/features/family-listener/hooks/useReaction';
import { fetchStoryById } from '@/features/family-listener/services/familyStoryService';
import { supabase } from '@/lib/supabase';
import { useHeritageTheme } from '@/theme/heritage';

/**
 * Formats timestamp to absolute date.
 */
function formatAbsoluteDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(timestamp));
}

export default function FamilyStoryPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [showComments, setShowComments] = useState(false);
  const { colors } = useHeritageTheme();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  // Fetch story details
  const {
    data: story,
    isLoading: isLoadingStory,
    error: storyError,
  } = useQuery({
    queryKey: ['familyStory', id],
    queryFn: () => fetchStoryById(id!),
    enabled: !!id,
  });

  // Player hook
  const {
    playerState,
    load,
    togglePlayPause,
    seek,
    unload,
  } = useFamilyPlayer(id!);

  // Reaction hook for quick heart reactions
  const { hasReacted, toggleReaction, isPending: isReactionPending } = useReaction(id!);

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
    setShowComments(!showComments);
  };

  // Loading state
  if (isLoadingStory) {
    return (
      <Container>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurface }]}>
            Loading story...
          </Text>
        </View>
      </Container>
    );
  }

  // Error state
  if (storyError || !story) {
    return (
      <Container>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.onSurface }]}>
            Could not load story
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textMuted }]}>
            {storyError?.message || 'Story does not exist or is inaccessible'}
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.button, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Back to story list"
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  // Player error state
  if (playerState.state === 'error') {
    return (
      <Container>
        <View style={styles.errorContainer}>
          <Ionicons name="musical-notes-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.onSurface }]}>
            Could not play audio
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textMuted }]}>
            {playerState.error || 'Please try again later'}
          </Text>
          <TouchableOpacity
            onPress={load}
            style={[styles.button, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  // Player loading state
  if (playerState.state === 'loading') {
    return (
      <Container>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Preparing playback...
          </Text>
        </View>
      </Container>
    );
  }

  // Comments view (full screen)
  if (showComments) {
    return (
      <Container>
        {/* Header with back button */}
        <View
          style={[styles.header, { borderColor: colors.border }]}
        >
          <TouchableOpacity
            onPress={toggleComments}
            style={[styles.iconButton, { backgroundColor: `${colors.onSurface}10` }]}
            accessibilityRole="button"
            accessibilityLabel="Back to player"
          >
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {story.title ?? 'Untitled Story'}
          </Text>
        </View>

        {/* Comment section */}
        <CommentSection
          storyId={id!}
          currentUserId={currentUserId}
          readOnly={false}
        />
      </Container>
    );
  }

  // Main player view
  return (
    <Container>
      {/* Back button */}
      <TouchableOpacity
        onPress={handleBack}
        style={[
          styles.absoluteBackButton,
          { backgroundColor: `${colors.onSurface}10` }
        ]}
        accessibilityRole="button"
        accessibilityLabel="Back to story list"
      >
        <Ionicons name="arrow-back" size={28} color={colors.onSurface} />
      </TouchableOpacity>

      {/* Heart reaction button */}
      <View style={styles.topRightControls}>
        <HeartIcon
          isLiked={hasReacted}
          onToggle={toggleReaction}
          disabled={isReactionPending}
        />

        {/* Comments button */}
        <TouchableOpacity
          onPress={toggleComments}
          style={[styles.iconButton, { backgroundColor: `${colors.onSurface}10` }]}
          accessibilityRole="button"
          accessibilityLabel="View comments"
        >
          <Ionicons name="chatbubble-outline" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Story Info */}
        <View style={styles.storyInfoContainer}>
          {/* Story icon */}
          <View
            style={[styles.storyIconCircle, { backgroundColor: `${colors.primary}20` }]}
          >
            <Ionicons name="mic" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text
            style={[styles.storyTitle, { color: colors.onSurface }]}
            numberOfLines={2}
          >
            {story.title ?? 'Untitled Story'}
          </Text>

          {/* Date */}
          <Text
            style={[styles.storyDate, { color: colors.textMuted }]}
          >
            {formatAbsoluteDate(story.startedAt)}
          </Text>
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

        {/* View comments button */}
        <TouchableOpacity
          onPress={toggleComments}
          style={[styles.commentsButton, { backgroundColor: `${colors.primary}15` }]}
          accessibilityRole="button"
          accessibilityLabel="View and add comments"
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
          <Text style={[styles.commentsButtonText, { color: colors.primary }]}>
            Comments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back to list button (for completed state) */}
      {playerState.state === 'completed' && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.bottomButton, { borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Back to story list"
          >
            <Text style={[styles.bottomButtonText, { color: colors.primary }]}>
              Back to story list
            </Text>
          </TouchableOpacity>
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
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 9999,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
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
  commentsButton: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  commentsButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bottomButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

