import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/AppText';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageSkeleton } from '@/components/ui/heritage/HeritageSkeleton';
import { useHeritageTheme } from '@/theme/heritage';
import { useStory } from '@/features/story-gallery/hooks/useStory';
import { useStoryComments } from '@/features/story-gallery/hooks/useStoryComments';
import { AudioPlayer } from '@/features/story-gallery/components/AudioPlayer';
import { markCommentsAsRead } from '@/features/story-gallery/services/commentReadService';
import { markActivitiesAsReadForStory } from '@/features/home/services/activityService';
import { updateAppBadge } from '@/lib/notifications/badgeService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { showErrorToast } from '@/components/ui/feedback/toast';

export default function StoryCommentsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useHeritageTheme();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { story, isLoading: isStoryLoading, error: storyError } = useStory(id);
  const {
    data: commentThread,
    isLoading: isCommentsLoading,
    error: commentsError,
    refetch,
  } = useStoryComments(id);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          await markCommentsAsRead(id);
          await markActivitiesAsReadForStory(id, sessionUserId);
          if (sessionUserId) {
            await updateAppBadge(sessionUserId);
          }
          await refetch();
        } catch {
          showErrorToast('Failed to update story comments.');
        }
      })();
    }, [id, refetch, sessionUserId])
  );

  const displayTitle = story?.title?.trim() || 'Story comments';
  const formattedDate = story
    ? new Date(story.startedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown date';

  if (isStoryLoading || isCommentsLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 24,
          paddingTop: 84,
        }}>
        <HeritageSkeleton variant="text" width={140} height={24} />
        <View style={{ marginTop: 20, gap: 12 }}>
          <HeritageSkeleton variant="title" width="70%" />
          <HeritageSkeleton variant="text" width="40%" />
        </View>
        <View style={{ marginTop: 32, gap: 16 }}>
          <HeritageSkeleton variant="text" width="100%" lines={2} />
          <HeritageSkeleton variant="text" width="100%" lines={2} />
          <HeritageSkeleton variant="text" width="100%" lines={2} />
        </View>
      </View>
    );
  }

  if (!story || storyError || commentsError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
        <Ionicons name="chatbubble-ellipses-outline" size={60} color={theme.colors.primary} />
        <AppText
          style={{
            fontSize: 24,
            color: theme.colors.onSurface,
            marginTop: 16,
            textAlign: 'center',
            fontFamily: 'Fraunces_600SemiBold',
          }}>
          Comments are unavailable for this story.
        </AppText>
        <HeritageButton
          title="Go back"
          onPress={() => router.back()}
          variant="secondary"
          style={{ marginTop: 28 }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.primaryDeep} />
          <AppText style={{ fontSize: 18, color: theme.colors.primaryDeep, fontWeight: '600' }}>
            Back
          </AppText>
        </Pressable>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: `${theme.colors.primary}12`,
          }}>
          <AppText style={{ color: theme.colors.primaryDeep, fontSize: 13, fontWeight: '700' }}>
            {commentThread?.unreadCount ?? 0} unread
          </AppText>
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 64,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}>
        <View
          style={{
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: `${theme.colors.primary}18`,
            backgroundColor: theme.colors.surfaceWarm,
          }}>
          <AppText
            style={{
              fontSize: 30,
              lineHeight: 38,
              color: theme.colors.onSurface,
              fontFamily: 'Fraunces_600SemiBold',
            }}>
            {displayTitle}
          </AppText>
          <AppText style={{ marginTop: 8, color: theme.colors.textMuted, fontSize: 16 }}>
            {formattedDate}
          </AppText>
          <AppText
            style={{
              marginTop: 14,
              color: theme.colors.onSurface,
              fontSize: 18,
              lineHeight: 28,
            }}>
            Family feedback is now grouped here so unread comments and story activity stay in one place.
          </AppText>
        </View>

        <View
          style={{
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: `${theme.colors.primary}15`,
            backgroundColor: theme.colors.surface,
          }}>
          <AppText
            style={{
              fontSize: 16,
              marginBottom: 16,
              color: theme.colors.onSurface,
              fontFamily: 'Fraunces_600SemiBold',
            }}>
            Playback
          </AppText>
          <AudioPlayer uri={story.filePath} />
        </View>

        <View style={{ gap: 16 }}>
          {(commentThread?.items.length ?? 0) > 0 ? (
            commentThread?.items.map((comment) => (
              <View
                key={comment.id}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: comment.isUnread
                    ? `${theme.colors.primary}45`
                    : `${theme.colors.primary}16`,
                  backgroundColor: comment.isUnread
                    ? `${theme.colors.primary}10`
                    : theme.colors.surface,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: theme.colors.primaryDeep,
                    }}>
                    {comment.authorLabel}
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 13,
                      color: theme.colors.textMuted,
                    }}>
                    {comment.createdAtLabel}
                  </AppText>
                </View>

                <AppText
                  style={{
                    marginTop: 12,
                    fontSize: 20,
                    lineHeight: 32,
                    color: theme.colors.onSurface,
                  }}>
                  {comment.content}
                </AppText>

                {comment.isUnread ? (
                  <View
                    style={{
                      marginTop: 14,
                      alignSelf: 'flex-start',
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: `${theme.colors.warning}18`,
                    }}>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: theme.colors.warning,
                        fontWeight: '700',
                      }}>
                      New comment
                    </AppText>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <View
              style={{
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}16`,
                backgroundColor: theme.colors.surface,
              }}>
              <AppText style={{ fontSize: 18, lineHeight: 28, color: theme.colors.textMuted }}>
                No family comments yet for this story.
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
