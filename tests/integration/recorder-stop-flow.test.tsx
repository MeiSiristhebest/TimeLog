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

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

describe('recorder stop flow', () => {
  it('plays success cue and shows confirmation after stop', async () => {
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

    const stopButton = await waitFor(() => getByLabelText(/stop recording/i));
    fireEvent.press(stopButton);

    await waitFor(() => {
      expect(playSuccess).toHaveBeenCalled();
      expect(getByText(/Story Kept Safe/)).toBeTruthy();
      expect(getByText('Done')).toBeTruthy();
    });
  });
});
