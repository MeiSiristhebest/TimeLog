import {
  buildStoryCommentThread,
  type RemoteStoryCommentRow,
} from './storyCommentsService';

describe('storyCommentsService', () => {
  it('sorts newest comments first and flags unread comments after last read time', () => {
    const comments: RemoteStoryCommentRow[] = [
      {
        id: 'comment-1',
        story_id: 'story-1',
        user_id: 'family-1',
        content: 'Please tell me more about the conductor.',
        created_at: '2026-04-07T08:00:00.000Z',
        author_name: 'Mei',
      },
      {
        id: 'comment-2',
        story_id: 'story-1',
        user_id: 'family-2',
        content: 'I never heard this version before.',
        created_at: '2026-04-07T09:30:00.000Z',
        author_name: null,
      },
    ];

    const thread = buildStoryCommentThread({
      storyId: 'story-1',
      comments,
      lastReadAt: '2026-04-07T08:30:00.000Z',
    });

    expect(thread.items).toEqual([
      expect.objectContaining({
        id: 'comment-2',
        authorLabel: 'Family Member',
        isUnread: true,
      }),
      expect.objectContaining({
        id: 'comment-1',
        authorLabel: 'Mei',
        isUnread: false,
      }),
    ]);
    expect(thread.unreadCount).toBe(1);
  });

  it('falls back safely when timestamps are invalid', () => {
    const thread = buildStoryCommentThread({
      storyId: 'story-1',
      comments: [
        {
          id: 'comment-invalid',
          story_id: 'story-1',
          user_id: 'family-1',
          content: 'Still display this',
          created_at: 'invalid-date',
          author_name: '',
        },
      ],
      lastReadAt: null,
    });

    expect(thread.items[0]).toEqual(
      expect.objectContaining({
        id: 'comment-invalid',
        authorLabel: 'Family Member',
        createdAtLabel: 'Unknown time',
        isUnread: true,
      })
    );
  });
});
