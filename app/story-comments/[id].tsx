/**
 * StoryCommentsScreen - Read-only comment view for senior users.
 *
 * Allows senior users to view comments left by family members
 * on their stories. Comments are read-only for seniors.
 *
 * Story 4.3: Realtime Comment System (AC: 5)
 */

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/ui/Container';
import { CommentSection } from '@/features/family-listener/components/CommentSection';
import { supabase } from '@/lib/supabase';
import { useHeritageTheme } from '@/theme/heritage';

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

export default function StoryCommentsScreen() {
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
          <Text style={[styles.loadingText, { color: colors.onSurface }]}>
            Loading...
          </Text>
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
          <Text style={[styles.errorTitle, { color: colors.onSurface }]}>
            Cannot load story
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.button, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <View
        style={[styles.header, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: `${colors.onSurface}10` }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text
            style={[styles.headerTitle, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {story.title ?? 'Untitled Story'}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textMuted }]}
          >
            Family Comments
          </Text>
        </View>
      </View>

      {/* Comment section (read-only for seniors) */}
      <CommentSection
        storyId={id!}
        currentUserId={currentUserId}
        readOnly={true}
        header={null}
      />
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
  backButton: {
    padding: 8,
    borderRadius: 9999,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Fraunces_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 14,
  },
});

