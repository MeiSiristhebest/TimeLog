import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useHomeLogic } from '@/features/home/hooks/useHomeLogic';
import { startRecordingStream } from '@/features/recorder/services/recorderService';
import { getCloudSettings } from '@/features/settings/services/cloudSettingsService';
import { mmkv } from '@/lib/mmkv';

const mockPush = jest.fn();
const mockEnqueueRecording = jest.fn();
const mockStartRecordingStream = startRecordingStream as jest.MockedFunction<
  typeof startRecordingStream
>;
const mockGetCloudSettings = getCloudSettings as jest.MockedFunction<typeof getCloudSettings>;
const mockGetMMKVString = mmkv.getString as jest.MockedFunction<typeof mmkv.getString>;
const mockReplay = jest.fn();
const mockNewTopic = jest.fn();
const mockConnectCloudDialog = jest.fn();
const mockDisconnectCloudDialog = jest.fn();
const mockStartWaitingForAiResponse = jest.fn();

let capturedRecordingOptions: Record<string, unknown> | undefined;
let mockDialogMode: 'DIALOG' | 'DEGRADED' | 'SILENT' = 'DIALOG';
let mockCloudConnected = true;
let mockSessionUserId: string | undefined = 'senior-user-1';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({}),
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
      id: 'topic-1',
      text: 'Tell me about your hometown.',
      isFromFamily: false,
    },
    isSpeaking: false,
    words: [],
    currentWordIndex: -1,
    replay: mockReplay,
    stop: jest.fn(),
    newTopic: mockNewTopic,
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
  useAuthStore: () => mockSessionUserId,
}));

jest.mock('@/components/ui/feedback/toast', () => ({
  showErrorToast: jest.fn(),
}));

jest.mock('@/lib/mmkv', () => ({
  mmkv: {
    getString: jest.fn(() => 'ai'),
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

jest.mock('@/features/recorder/hooks/useLiveKitDialog', () => ({
  useLiveKitDialog: () => ({
    connect: mockConnectCloudDialog,
    disconnect: mockDisconnectCloudDialog,
    isConnected: mockCloudConnected,
    connectionState: mockCloudConnected ? 'connected' : 'disconnected',
    skip: jest.fn(),
    continueDialog: jest.fn(),
    startWaitingForAiResponse: mockStartWaitingForAiResponse,
    dialogMode: mockDialogMode,
    networkQuality: mockCloudConnected ? 'GOOD' : 'OFFLINE',
    networkMetrics: null,
    transcripts: [],
    error: null,
  }),
}));

jest.mock('@/features/settings/services/cloudSettingsService', () => ({
  getCloudSettings: jest.fn(),
}));

describe('cloud ai main-flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMMKVString.mockReturnValue('ai');
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    capturedRecordingOptions = undefined;
    mockDialogMode = 'DIALOG';
    mockCloudConnected = true;
    mockSessionUserId = 'senior-user-1';
    mockConnectCloudDialog.mockResolvedValue(undefined);
    mockDisconnectCloudDialog.mockResolvedValue(undefined);
    mockGetCloudSettings.mockResolvedValue({
      cloudAIEnabled: true,
      lastUpdated: new Date().toISOString(),
    });

    mockStartRecordingStream.mockImplementation(async (options) => {
      capturedRecordingOptions = options as Record<string, unknown>;
      return {
        metadata: {
          id: 'rec-cloud-1',
          filePath: 'file:///recordings/rec-cloud-1.wav',
          uri: 'file:///recordings/rec-cloud-1.wav',
          startedAt: new Date(),
        },
        pause: jest.fn(),
        resume: jest.fn(),
        stop: jest.fn().mockResolvedValue({
          id: 'rec-cloud-1',
          filePath: 'file:///recordings/rec-cloud-1.wav',
          uri: 'file:///recordings/rec-cloud-1.wav',
          startedAt: new Date(),
          endedAt: new Date(),
        }),
      };
    });
  });

  it('wires cloud loop into recording start and timeout trigger path', async () => {
    const { result } = renderHook(() => useHomeLogic());

    await act(async () => {
      await result.current.actions.handleStartRecording();
    });

    expect(mockConnectCloudDialog).toHaveBeenCalledWith('rec-cloud-1');
    expect(capturedRecordingOptions).toBeDefined();

    const onSilenceThreshold = capturedRecordingOptions?.onSilenceThreshold as (() => void) | undefined;
    expect(onSilenceThreshold).toBeDefined();

    await act(async () => {
      onSilenceThreshold?.();
    });

    expect(mockStartWaitingForAiResponse).toHaveBeenCalled();
    expect(mockNewTopic).not.toHaveBeenCalled();
  });

  it('hard-gates cloud flow when cloudAIEnabled is false', async () => {
    mockGetCloudSettings.mockResolvedValueOnce({
      cloudAIEnabled: false,
      lastUpdated: new Date().toISOString(),
    });

    const { result } = renderHook(() => useHomeLogic());

    await waitFor(() => {
      expect(result.current.state.cloudAIEnabled).toBe(false);
    });

    await act(async () => {
      await result.current.actions.handleStartRecording();
    });

    const onSilence = capturedRecordingOptions?.onSilence as (() => void) | undefined;
    const onSilenceThreshold = capturedRecordingOptions?.onSilenceThreshold as (() => void) | undefined;

    await act(async () => {
      onSilence?.();
      onSilenceThreshold?.();
    });

    expect(mockConnectCloudDialog).not.toHaveBeenCalled();
    expect(mockReplay).toHaveBeenCalled();
    expect(mockNewTopic).toHaveBeenCalled();
    expect(mockStartWaitingForAiResponse).not.toHaveBeenCalled();
  });

  it('falls back to local prompt behavior when dialog mode is DEGRADED', async () => {
    mockDialogMode = 'DEGRADED';

    const { result } = renderHook(() => useHomeLogic());

    await act(async () => {
      await result.current.actions.handleStartRecording();
    });

    const onSilenceThreshold = capturedRecordingOptions?.onSilenceThreshold as (() => void) | undefined;

    await act(async () => {
      onSilenceThreshold?.();
    });

    expect(mockStartWaitingForAiResponse).not.toHaveBeenCalled();
    expect(mockNewTopic).toHaveBeenCalled();
  });

  it('connects cloud dialog when switching from classic to ai mid-recording', async () => {
    mockGetMMKVString.mockReturnValue('basic');
    mockCloudConnected = false;

    const { result } = renderHook(() => useHomeLogic());

    await act(async () => {
      await result.current.actions.handleStartRecording();
    });

    expect(mockConnectCloudDialog).not.toHaveBeenCalled();

    await act(async () => {
      result.current.actions.setRecordingMode('ai');
    });

    await waitFor(() => {
      expect(mockConnectCloudDialog).toHaveBeenCalledWith('rec-cloud-1');
    });
  });

  it('still attempts cloud dialog connection when auth store user id is temporarily unavailable', async () => {
    mockSessionUserId = undefined;

    const { result } = renderHook(() => useHomeLogic());

    await act(async () => {
      await result.current.actions.handleStartRecording();
    });

    expect(mockConnectCloudDialog).toHaveBeenCalledWith('rec-cloud-1');
  });

  it('ignores duplicate start requests while recording bootstrap is in flight', async () => {
    let resolveStart!: (value: {
      metadata: {
        id: string;
        filePath: string;
        uri: string;
        startedAt: Date;
      };
      pause: jest.Mock;
      resume: jest.Mock;
      stop: jest.Mock;
    }) => void;

    const startPromise = new Promise<{
      metadata: {
        id: string;
        filePath: string;
        uri: string;
        startedAt: Date;
      };
      pause: jest.Mock;
      resume: jest.Mock;
      stop: jest.Mock;
    }>((resolve) => {
      resolveStart = resolve;
    });

    mockStartRecordingStream.mockImplementationOnce(() => startPromise);

    const { result } = renderHook(() => useHomeLogic());

    let firstCall!: Promise<void>;
    let secondCall!: Promise<void>;

    await act(async () => {
      firstCall = result.current.actions.handleStartRecording();
      secondCall = result.current.actions.handleStartRecording();
      await Promise.resolve();
    });

    expect(mockStartRecordingStream).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveStart({
        metadata: {
          id: 'rec-cloud-1',
          filePath: 'file:///recordings/rec-cloud-1.wav',
          uri: 'file:///recordings/rec-cloud-1.wav',
          startedAt: new Date(),
        },
        pause: jest.fn(),
        resume: jest.fn(),
        stop: jest.fn().mockResolvedValue({
          id: 'rec-cloud-1',
          filePath: 'file:///recordings/rec-cloud-1.wav',
          uri: 'file:///recordings/rec-cloud-1.wav',
          startedAt: new Date(),
          endedAt: new Date(),
        }),
      });
      await Promise.all([firstCall, secondCall]);
    });

    expect(result.current.state.recordingHandle?.metadata.id).toBe('rec-cloud-1');
  });
});
