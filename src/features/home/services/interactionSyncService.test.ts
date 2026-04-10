import {
  mergeRemoteActivityEvents,
  mergeRemoteInteractions,
  type RemoteActivityEventRow,
  type RemoteCommentInteraction,
  type RemoteReactionInteraction,
} from './interactionSyncService';

describe('interactionSyncService', () => {
  it('maps remote comments and reactions into local activity rows', () => {
    const comments: RemoteCommentInteraction[] = [
      {
        id: 'comment-1',
        storyId: 'story-1',
        actorUserId: 'family-12345678',
        storyTitle: 'Summer Train',
        actorName: 'Aunt Mei',
        commentText: 'Ask about the station clock next time.',
        createdAt: '2026-04-07T08:00:00.000Z',
      },
    ];
    const reactions: RemoteReactionInteraction[] = [
      {
        id: 'reaction-1',
        storyId: 'story-2',
        actorUserId: 'family-99999999',
        storyTitle: 'Restaurant Ledger',
        actorName: null,
        reactionType: 'heart',
        createdAt: '2026-04-07T09:00:00.000Z',
      },
    ];

    expect(
      mergeRemoteInteractions({
        targetUserId: 'senior-1',
        comments,
        reactions,
      })
    ).toEqual([
      {
        id: 'reaction-1',
        type: 'reaction',
        storyId: 'story-2',
        actorUserId: 'family-99999999',
        targetUserId: 'senior-1',
        metadata: JSON.stringify({
          actorName: 'Family Member',
          storyTitle: 'Restaurant Ledger',
          reactionType: 'heart',
        }),
        createdAt: new Date('2026-04-07T09:00:00.000Z').getTime(),
        readAt: null,
        syncedAt: expect.any(Number),
      },
      {
        id: 'comment-1',
        type: 'comment',
        storyId: 'story-1',
        actorUserId: 'family-12345678',
        targetUserId: 'senior-1',
        metadata: JSON.stringify({
          actorName: 'Aunt Mei',
          storyTitle: 'Summer Train',
          commentId: 'comment-1',
          commentText: 'Ask about the station clock next time.',
        }),
        createdAt: new Date('2026-04-07T08:00:00.000Z').getTime(),
        readAt: null,
        syncedAt: expect.any(Number),
      },
    ]);
  });

  it('sorts newest first and skips invalid timestamps', () => {
    const result = mergeRemoteInteractions({
      targetUserId: 'senior-1',
      comments: [
        {
          id: 'comment-invalid',
          storyId: 'story-1',
          actorUserId: 'family-1',
          storyTitle: null,
          actorName: null,
          commentText: 'Ignored',
          createdAt: 'invalid-date',
        },
      ],
      reactions: [
        {
          id: 'reaction-new',
          storyId: 'story-1',
          actorUserId: 'family-2',
          storyTitle: null,
          actorName: null,
          reactionType: 'heart',
          createdAt: '2026-04-07T12:00:00.000Z',
        },
        {
          id: 'reaction-old',
          storyId: 'story-1',
          actorUserId: 'family-3',
          storyTitle: null,
          actorName: null,
          reactionType: 'heart',
          createdAt: '2026-04-07T11:00:00.000Z',
        },
      ],
    });

    expect(result.map((row) => row.id)).toEqual(['reaction-new', 'reaction-old']);
  });

  it('maps cloud activity events into local rows without rebuilding them from comments or reactions', () => {
    const rows: RemoteActivityEventRow[] = [
      {
        id: 'activity-1',
        type: 'comment',
        story_id: 'story-1',
        actor_user_id: 'family-1',
        target_user_id: 'senior-1',
        metadata: {
          actorName: 'Aunt Mei',
          storyTitle: 'Summer Train',
          commentId: 'comment-1',
          commentText: 'Please ask about the station bell next time.',
        },
        created_at: '2026-04-07T08:00:00.000Z',
        read_at: 1_717_478_400_000,
        synced_at: 1_717_478_401_000,
      },
    ];

    expect(mergeRemoteActivityEvents(rows)).toEqual([
      {
        id: 'activity-1',
        type: 'comment',
        storyId: 'story-1',
        actorUserId: 'family-1',
        targetUserId: 'senior-1',
        metadata: JSON.stringify({
          actorName: 'Aunt Mei',
          storyTitle: 'Summer Train',
          commentId: 'comment-1',
          commentText: 'Please ask about the station bell next time.',
        }),
        createdAt: new Date('2026-04-07T08:00:00.000Z').getTime(),
        readAt: 1_717_478_400_000,
        syncedAt: 1_717_478_401_000,
      },
    ]);
  });
});
