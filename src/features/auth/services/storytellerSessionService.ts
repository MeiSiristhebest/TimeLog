import { signInAnonymously } from './anonymousAuthService';
import { getActiveSession } from './sessionService';

export type StorytellerSessionSource = 'existing' | 'anonymous-created';

export type StorytellerSessionResult = {
  userId: string;
  source: StorytellerSessionSource;
};

export async function ensureStorytellerSession(): Promise<StorytellerSessionResult> {
  const activeSession = await getActiveSession();
  const activeUserId = activeSession?.user?.id;

  if (activeUserId) {
    return {
      userId: activeUserId,
      source: 'existing',
    };
  }

  const anonymousResult = await signInAnonymously();
  if (!anonymousResult.userId) {
    throw new Error('Anonymous session bootstrap returned no user id');
  }

  return {
    userId: anonymousResult.userId,
    source: 'anonymous-created',
  };
}
