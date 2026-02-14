import { renderHook, act } from '@testing-library/react-native';
import { useHomeLogic } from '@/features/home/hooks/useHomeLogic';
import { startRecordingStream } from '@/features/recorder/services/recorderService';
import { markQuestionAsAnswered } from '@/features/recorder/services/topicService';
import { resolveUploadAsset } from '@/lib/sync-engine/transcode';

const mockPush = jest.fn();
const mockEnqueueRecording = jest.fn();
const mockMarkQuestionAsAnswered = markQuestionAsAnswered as jest.MockedFunction<
  typeof markQuestionAsAnswered
>;
const mockStartRecordingStream = startRecordingStream as jest.MockedFunction<
  typeof startRecordingStream
>;
const mockResolveUploadAsset = resolveUploadAsset as jest.MockedFunction<typeof resolveUploadAsset>;
const mockConnectCloudDialog = jest.fn();
const mockDisconnectCloudDialog = jest.fn();
const mockStartWaitingForAiResponse = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({
    topicId: 'family-q-1',
    topicText: 'Tell me about your childhood friend.',
    topicFamily: '1',
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/features/recorder/services/recorderService', () => ({
  startRecordingStream: jest.fn(),
  InsufficientStorageError: class extends Error {},
}));

jest.mock('@/features/recorder/hooks/useAudioAmplitude', () => ({
  useAudioAmplitude: () => ({
    currentAmplitude: -32,
    updateAmplitude: jest.fn(),
  }),
}));

jest.mock('@/features/recorder/hooks/useTTS', () => ({
  useTTS: () => ({
    currentQuestion: {
      id: 'family-q-1',
      text: 'Tell me about your childhood friend.',
      isFromFamily: true,
    },
    isSpeaking: false,
    words: [],
    currentWordIndex: -1,
    replay: jest.fn(),
    stop: jest.fn(),
    newTopic: jest.fn(),
  }),
}));

jest.mock('@/features/recorder/services/soundCueService', () => ({
  initializeSoundCue: jest.fn(),
  playSuccess: jest.fn(),
  cleanupSoundCue: jest.fn(),
}));

jest.mock('@/lib/sync-engine/store', () => ({
  useSyncStore: (
    selector: (state: { enqueueRecording: typeof mockEnqueueRecording; isOnline: boolean }) => unknown
  ) =>
    selector({
      enqueueRecording: mockEnqueueRecording,
      isOnline: true,
    }),
}));

jest.mock('@/features/home/hooks/useUnreadActivities', () => ({
  useUnreadActivities: () => ({
    activities: [],
    hasUnread: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/recorder/hooks/useAnsweredTopics', () => ({
  useIsTopicAnswered: () => false,
}));

jest.mock('@/lib/notifications/badgeService', () => ({
  updateAppBadge: jest.fn(),
}));

jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: () => 'senior-user-1',
}));

jest.mock('@/components/ui/feedback/toast', () => ({
  showErrorToast: jest.fn(),
}));

jest.mock('@/lib/mmkv', () => ({
  mmkv: {
    getString: jest.fn(() => 'basic'),
    set: jest.fn(),
  },
}));

jest.mock('@/features/home/hooks/useWeather', () => ({
  useWeather: () => ({
    condition: 'sunny',
    temperature: 28,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/features/recorder/services/NetworkQualityService', () => ({
  NetworkQualityService: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    destroy: jest.fn(),
    onQualityChange: jest.fn(() => jest.fn()),
  })),
}));

jest.mock('@/features/recorder/services/topicService', () => ({
  markQuestionAsAnswered: jest.fn(),
}));

jest.mock('@/lib/sync-engine/transcode', () => ({
  resolveUploadAsset: jest.fn(),
}));

jest.mock('@/features/recorder/hooks/useLiveKitDialog', () => ({
  useLiveKitDialog: () => ({
    connect: mockConnectCloudDialog,
    disconnect: mockDisconnectCloudDialog,
    isConnected: false,
    connectionState: 'disconnected',
    skip: jest.fn(),
    continueDialog: jest.fn(),
    startWaitingForAiResponse: mockStartWaitingForAiResponse,
    dialogMode: 'DIALOG',
    networkQuality: null,
    networkMetrics: null,
    transcripts: [],
    error: null,
  }),
}));

jest.mock('@/features/settings/services/cloudSettingsService', () => ({
  getCloudSettings: jest.fn(async () => ({
    cloudAIEnabled: true,
    lastUpdated: new Date().toISOString(),
  })),
}));

jest.mock('@/features/settings/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: null,
    isLoading: false,
    error: null,
    updateProfileData: jest.fn(),
    uploadProfileAvatar: jest.fn(),
    refetch: jest.fn(),
  }),
}));

describe('family question answered linkage integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueRecording.mockResolvedValue(undefined);
    mockMarkQuestionAsAnswered.mockResolvedValue(undefined);
    mockResolveUploadAsset.mockResolvedValue({
      localPath: 'file:///recordings/rec-123.opus',
      extension: 'opus',
    });

    mockStartRecordingStream.mockResolvedValue({
      metadata: {
        id: 'rec-running',
        filePath: 'file:///recordings/running.wav',
        uri: 'file:///recordings/running.wav',
        startedAt: new Date(),
      },
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn().mockResolvedValue({
        id: 'rec-123',
        filePath: 'file:///recordings/rec-123.wav',
        uri: 'file:///recordings/rec-123.wav',
        startedAt: new Date(),
        endedAt: new Date(),
      }),
    });
  });

  it('marks family question as answered after successful stop', async () => {
    const { result } = renderHook(() => useHomeLogic());

    await act(async () => {
      await result.current.actions.handleStartRecording();
    });

    await act(async () => {
      await result.current.actions.handleStopRecording();
    });

    expect(mockMarkQuestionAsAnswered).toHaveBeenCalledWith('family-q-1', 'rec-123');
    expect(mockResolveUploadAsset).toHaveBeenCalledWith('file:///recordings/rec-123.wav');
    expect(mockEnqueueRecording).toHaveBeenCalledWith(
      'rec-123',
      'file:///recordings/rec-123.wav.enc',
      {
        uploadPath: 'file:///recordings/rec-123.opus.enc',
        uploadExtension: 'opus',
        transcodeStatus: 'ready',
      }
    );
  });

  it('guards against duplicate stop presses while stop is in progress', async () => {
    let resolveStop!: (value: {
      id: string;
      filePath: string;
      uri: string;
      startedAt: Date;
      endedAt: Date;
    }) => void;
    const stopPromise = new Promise<{
      id: string;
      filePath: string;
      uri: string;
      startedAt: Date;
      endedAt: Date;
    }>((resolve) => {
      resolveStop = resolve;
    });
    const stop = jest.fn().mockImplementation(() => stopPromise);

    mockStartRecordingStream.mockResolvedValueOnce({
      metadata: {
        id: 'rec-running',
        filePath: 'file:///recordings/running.wav',
        uri: 'file:///recordings/running.wav',
        startedAt: new Date(),
      },
      pause: jest.fn(),
      resume: jest.fn(),
      stop,
    });

    const { result } = renderHook(() => useHomeLogic());

    await act(async () => {
      await result.current.actions.handleStartRecording();
    });

    await act(async () => {
      void result.current.actions.handleStopRecording();
      void result.current.actions.handleStopRecording();
    });

    expect(stop).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveStop({
        id: 'rec-123',
        filePath: 'file:///recordings/rec-123.wav',
        uri: 'file:///recordings/rec-123.wav',
        startedAt: new Date(),
        endedAt: new Date(),
      });
      await stopPromise;
    });
  });

  it('keeps success state even when enqueue fails after local stop', async () => {
    mockEnqueueRecording.mockRejectedValueOnce(new Error('queue unavailable'));

    const { result } = renderHook(() => useHomeLogic());

    await act(async () => {
      await result.current.actions.handleStartRecording();
    });

    await act(async () => {
      await result.current.actions.handleStopRecording();
    });

    expect(result.current.state.lastSavedId).toBe('rec-123');
  });
});
