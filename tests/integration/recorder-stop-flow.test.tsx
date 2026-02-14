import type { ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomeTab from '../../app/(tabs)/index';

import { startRecordingStream } from '@/features/recorder/services/recorderService';
import { initializeSoundCue, playSuccess } from '@/features/recorder/services/soundCueService';

jest.mock('@/features/recorder/services/recorderService', () => ({
  startRecordingStream: jest.fn(),
  InsufficientStorageError: class extends Error {},
}));

jest.mock('@/features/recorder/services/soundCueService', () => ({
  initializeSoundCue: jest.fn(),
  playSuccess: jest.fn(),
  cleanupSoundCue: jest.fn(),
}));

jest.mock('@/features/home/hooks/useHomeLogic', () => {
  const React = require('react');
  const { startRecordingStream } = require('@/features/recorder/services/recorderService');
  const { initializeSoundCue, playSuccess } = require('@/features/recorder/services/soundCueService');

  return {
    useHomeLogic: () => {
      const [recordingHandle, setRecordingHandle] = React.useState(null);
      const [lastSavedId, setLastSavedId] = React.useState(null);

      React.useEffect(() => {
        void initializeSoundCue();
      }, []);

      return {
        state: {
          recordingHandle,
          lastSavedId,
          currentAmplitude: { value: 0 },
          isRecordingPaused: false,
          currentQuestion: { id: 'q1', text: 'Test question', category: 'general' },
          isSpeaking: false,
          words: [],
          currentWordIndex: 0,
          isCurrentTopicAnswered: false,
          formattedDate: 'Today',
          greeting: 'Hello',
          weather: { isLoading: true, error: null, condition: '', temperature: 0 },
          weatherIcon: 'sunny',
          activities: [],
          hasUnread: false,
          isOnline: true,
          recordingMode: 'basic',
        },
        actions: {
          handleStartRecording: async () => {
            const handle = await startRecordingStream();
            setRecordingHandle(handle);
          },
          handleStopRecording: async () => {
            if (!recordingHandle) return;
            const finalized = await recordingHandle.stop();
            await playSuccess();
            setRecordingHandle(null);
            setLastSavedId(finalized.id);
          },
          replayQuestion: jest.fn(),
          newTopic: jest.fn(),
          setRecordingMode: jest.fn(),
          setLastSavedId,
          navigateToListen: jest.fn(),
          navigateToStory: jest.fn(),
        },
      };
    },
  };
});

jest.mock('@/features/recorder/hooks/useAudioAmplitude', () => ({
  useAudioAmplitude: () => ({
    currentAmplitude: { value: 0 },
    updateAmplitude: jest.fn(),
  }),
}));

jest.mock('@/features/recorder/hooks/useTTS', () => ({
  useTTS: () => ({
    currentQuestion: { id: 'q1', text: 'Test question' },
    isSpeaking: false,
    replay: jest.fn(),
    stop: jest.fn(),
    newTopic: jest.fn(),
  }),
}));

jest.mock('@/features/recorder/components/WaveformVisualizer', () => ({
  WaveformVisualizer: () => null,
}));

jest.mock('@/features/recorder/components/QuestionCard', () => ({
  QuestionCard: () => null,
}));

jest.mock('@/components/ui/Container', () => ({
  Container: ({ children }: { children: ReactNode }) => children ?? null,
}));

jest.mock('@/components/ui/Button', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Button: ({ title }: { title: string }) => {
      return <Text>{title}</Text>;
    },
  };
});

const mockEnqueueRecording = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/sync-engine/store', () => ({
  useSyncStore: (selector: any) => {
    // Return a stable mock state
    const mockState = {
      enqueueRecording: mockEnqueueRecording,
      initializeListeners: jest.fn(),
      cleanupListeners: jest.fn(),
    };
    if (selector) return selector(mockState);
    return mockState;
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/components/ui/Icon', () => ({
  Icon: () => null,
  Ionicons: () => null,
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

describe('recorder stop flow', () => {
  it('plays success cue and shows saved view after hold-to-stop', async () => {
    const stop = jest.fn().mockResolvedValue({
      id: 'rec-123',
      filePath: 'file:///test.wav',
    });
    (startRecordingStream as jest.Mock).mockResolvedValue({
      metadata: { id: 'rec-1', filePath: 'file:///test.wav', startedAt: new Date() },
      pause: jest.fn(),
      resume: jest.fn(),
      stop,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const { getByLabelText, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <HomeTab />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(initializeSoundCue).toHaveBeenCalled();
    });

    fireEvent.press(getByLabelText('Start recording your story'));

    await waitFor(() => {
      expect(startRecordingStream).toHaveBeenCalled();
    });

    const stopButton = await waitFor(() => getByLabelText(/hold to finish recording/i));
    fireEvent(stopButton, 'pressIn');

    await waitFor(() => {
      expect(playSuccess).toHaveBeenCalled();
      expect(getByText(/Story Kept Safe/)).toBeTruthy();
      expect(getByText('Done')).toBeTruthy();
    }, { timeout: 3000 });
  });
});
