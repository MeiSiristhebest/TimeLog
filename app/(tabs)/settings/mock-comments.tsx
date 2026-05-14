import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/AppText';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageSkeleton } from '@/components/ui/heritage/HeritageSkeleton';
import { useHeritageTheme } from '@/theme/heritage';
import { markCommentsAsRead } from '@/features/story-gallery/services/commentReadService';
import { markActivitiesAsReadForStory } from '@/features/home/services/activityService';
import { updateAppBadge } from '@/lib/notifications/badgeService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { showErrorToast } from '@/components/ui/feedback/toast';

// Mock data for screenshots
const MOCK_STORY = {
  id: 'mock-story-123',
  title: "Grandma's Apple Pie Recipe",
  startedAt: '2025-03-15T14:30:00Z',
  filePath: 'https://example.com/audio.mp3',
};

const MOCK_COMMENTS = [
  {
    id: '1',
    authorLabel: 'Mom',
    createdAtLabel: '3/15 2:45 PM',
    content: 'This story brings back so many memories! I can almost smell the cinnamon and baked apples. Grandma would always let me help with the crust.',
    isUnread: true,
  },
  {
    id: '2',
    authorLabel: 'Dad',
    createdAtLabel: '3/15 3:12 PM',
    content: 'Remember when she used to hide a little extra love in each pie? That was her secret ingredient.',
    isUnread: true,
  },
  {
    id: '3',
    authorLabel: 'Aunt Sarah',
    createdAtLabel: '3/15 4:30 PM',
    content: 'I still have her handwritten recipe card. The ink is faded but the love is still fresh. Sharing it with my kids next week!',
    isUnread: false,
  },
  {
    id: '4',
    authorLabel: 'Uncle Bob',
    createdAtLabel: '3/16 9:00 AM',
    content: 'Best pie I have ever had. Period.',
    isUnread: false,
  },
  {
    id: '5',
    authorLabel: 'Cousin Emma',
    createdAtLabel: '3/16 11:20 AM',
    content: 'Can we make this together when I visit next month? I want to learn the technique!',
    isUnread: false,
  },
];

export default function MockCommentsScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useHeritageTheme();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);

  // Mock story loading
  const isStoryLoading = false;
  const story = MOCK_STORY;
  const storyError = null;

  // Comments are always loaded
  const isCommentsLoading = false;
  const commentsError = null;
  const commentThread = {
    storyId: id || MOCK_STORY.id,
    unreadCount: MOCK_COMMENTS.filter((c) => c.isUnread).length,
    items: MOCK_COMMENTS,
  };

  // Mock refetch
  const refetch = async () => {
    console.log('Mock refetch called');
  };

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          await markCommentsAsRead(id || MOCK_STORY.id);
          await markActivitiesAsReadForStory(id || MOCK_STORY.id, sessionUserId);
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
            {commentThread.unreadCount} unread
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
            Family feedback is now grouped here so unread comments and story activity stay in one
            place.
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
          {/* Mock audio player placeholder */}
          <View
            style={{
              height: 56,
              borderRadius: 12,
              backgroundColor: `${theme.colors.primary}08`,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: `${theme.colors.primary}20`,
            }}>
            <AppText style={{ color: theme.colors.primaryDeep, fontSize: 14 }}>
              🎵 Audio Player (Mock)
            </AppText>
          </View>
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
              <AppText
                style={{ fontSize: 18, lineHeight: 28, color: theme.colors.textMuted }}>
                No family comments yet for this story.
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
