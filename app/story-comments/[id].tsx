/**
 * StoryCommentsScreen - Read-only comment view for senior users.
 *
 * Allows senior users to view comments left by family members
 * on their stories. Comments are read-only for seniors.
 *
 * Story 4.3: Realtime Comment System (AC: 5)
 */

import { AppText } from '@/components/ui/AppText';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/ui/Container';
import { CommentSection } from '@/features/family-listener/components/CommentSection';
import { supabase } from '@/lib/supabase';
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';

/**
 * Fetches story details for senior's own story.
 */
async function fetchSeniorStory(storyId: string) {
  const { data, error } = await supabase
    .from('audio_recordings')
    .select('id, title, started_at')
    .eq('id', storyId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    startedAt: new Date(data.started_at).getTime(),
  };
}

export default function StoryCommentsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
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
    isLoading,
    error,
  } = useQuery({
    queryKey: ['seniorStory', id],
    queryFn: () => fetchSeniorStory(id!),
    enabled: !!id,
  });

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <Container>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurface }]}>Loading...</AppText>
        </View>
      </Container>
    );
  }

  // Error state
  if (error || !story) {
    return (
      <Container>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.onSurface }]}>
            Cannot load story
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

  return (
    <Container>
      {/* Heritage Header */}
      <HeritageHeader
        title={story.title ?? 'Untitled Story'}
        subtitle="Family Comments"
        showBack
      />

      {/* Comment section (read-only for seniors) */}
      <CommentSection storyId={id!} currentUserId={currentUserId} readOnly={true} header={null} />
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
  // Removed old button/header styles as they are replaced by Heritage components
});
