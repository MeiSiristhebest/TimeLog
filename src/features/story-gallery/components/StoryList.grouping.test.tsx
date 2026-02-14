import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { AudioRecording } from '@/types/entities';
import { StoryList } from './StoryList';

jest.mock('@/lib/sync-engine/store', () => ({
  useSyncStore: (selector: (s: { isOnline: boolean }) => boolean) => selector({ isOnline: true }),
}));

jest.mock('../hooks/useStoryAvailability', () => ({
  useStoryAvailability: (stories: AudioRecording[]) =>
    stories.map((story) => ({ ...story, isPlayable: true })),
}));

jest.mock('../hooks/useUnreadCommentCounts', () => ({
  useUnreadCommentCounts: () => ({ getCount: () => 0 }),
}));

jest.mock('./TimelineLayout', () => ({
  TimelineLayout: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('./TimelineStoryCard', () => ({
  TimelineStoryCard: ({ story }: { story: AudioRecording }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{story.id}</Text>;
  },
}));

jest.mock('@/components/ui/AppText', () => ({
  AppText: ({ children }: { children: ReactNode }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{children}</Text>;
  },
}));

jest.mock('./EmptyGallery', () => ({
  EmptyGallery: () => {
    const { Text } = jest.requireActual('react-native');
    return <Text>empty</Text>;
  },
}));

function createStory(id: string, date: Date): AudioRecording {
  return {
    id,
    filePath: `file:///recordings/${id}.wav`,
    startedAt: date.getTime(),
    endedAt: date.getTime() + 60000,
    durationMs: 60000,
    sizeBytes: 1024,
    syncStatus: 'local',
    checksumMd5: null,
    topicId: null,
    userId: null,
    deviceId: null,
    title: null,
  };
}

describe('StoryList grouping', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const firstArg = args[0];
      if (typeof firstArg === 'string' && firstArg.includes('Each child in a list should have a unique "key" prop.')) {
        return;
      }
       
      console.warn(...args);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders Today, This Week and Older group headers', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 86400000);

    const recordings = [
      createStory('today', now),
      createStory('week', threeDaysAgo),
      createStory('older', tenDaysAgo),
    ];

    const { getByText } = render(
      <StoryList recordings={recordings} onSelectStory={jest.fn()} onPlayStory={jest.fn()} />
    );

    expect(getByText('Today')).toBeTruthy();
    expect(getByText('This Week')).toBeTruthy();
    expect(getByText('Older')).toBeTruthy();
  });
});
