/**
 * StoryCommentsScreen - Read-only comment view for senior users.
 *
 * Allows senior users to view comments left by family members
 * on their stories. Comments are read-only for seniors.
 *
 * Story 4.3: Realtime Comment System (AC: 5)
 */

import { useCallback } from 'react';
import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Container } from '@/components/ui/Container';
import { CommentSection } from '@/features/family-listener/components/CommentSection';
import { useCurrentUserId } from '@/features/auth/hooks/useCurrentUserId';
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageSkeleton } from '@/components/ui/heritage/HeritageSkeleton';
import { useStory } from '@/features/story-gallery/hooks/useStory';
import { EN_COPY } from '@/features/app/copy/en';

export default function StoryCommentsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { currentUserId } = useCurrentUserId();
  const { colors } = useHeritageTheme();
  const containerStyle = { backgroundColor: colors.surface };

  const storyId = typeof id === 'string' ? id : null;
  const { story, isLoading, error } = useStory(storyId ?? '');

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return (
      <Container style={containerStyle}>
        <View style={styles.centerContainer}>
          <View style={styles.loadingContent}>
            <HeritageSkeleton variant="title" width={180} />
            <HeritageSkeleton variant="text" width={220} />
            <View style={styles.loadingCard}>
              <HeritageSkeleton variant="text" width="85%" />
              <HeritageSkeleton variant="text" width="70%" />
              <HeritageSkeleton variant="text" width="92%" />
            </View>
          </View>
        </View>
      </Container>
    );
  }

  if (error || !story || !storyId) {
    return (
      <Container style={containerStyle}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.onSurface }]}>
            {EN_COPY.comments.cannotLoadStory}
          </AppText>
          <HeritageButton
            title={EN_COPY.common.back}
            onPress={handleBack}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>
      </Container>
    );
  }

  return (
    <Container style={containerStyle}>
      <HeritageHeader
        title={story.title ?? EN_COPY.story.untitled}
        subtitle={EN_COPY.comments.familyComments}
        showBack
      />
      <CommentSection storyId={storyId} currentUserId={currentUserId} readOnly={true} header={null} />
    </Container>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    width: '90%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 12,
  },
  loadingCard: {
    width: '100%',
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    gap: 10,
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
});
