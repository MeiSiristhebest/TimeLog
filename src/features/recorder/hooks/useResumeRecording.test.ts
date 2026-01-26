import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useResumeRecording } from './useResumeRecording';
import * as recorderService from '../services/recorderService';
import { useRecorderStore } from '../store/recorderStore';
import { devLog } from '@/lib/devLogger';

// Mock the recorder service
jest.mock('../services/recorderService');
jest.mock('../store/recorderStore');
jest.mock('@/lib/devLogger');

const mockGetPausedRecording = recorderService.getPausedRecording as jest.MockedFunction<
  typeof recorderService.getPausedRecording
>;
const mockDiscardPausedRecording = recorderService.discardPausedRecording as jest.MockedFunction<
  typeof recorderService.discardPausedRecording
>;
const mockStartRecordingStream = recorderService.startRecordingStream as jest.MockedFunction<
  typeof recorderService.startRecordingStream
>;

describe('useResumeRecording', () => {
  const mockSetCurrentRecording = jest.fn();
  const mockSetPausedRecordingId = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRecorderStore as unknown as jest.Mock).mockReturnValue({
      setCurrentRecording: mockSetCurrentRecording,
      setPausedRecordingId: mockSetPausedRecordingId,
    });
  });

  it('should detect paused recording on mount', async () => {
    const mockPausedRecording = {
      id: 'paused-123',
      filePath: '/path/to/recording.wav',
      uri: '/path/to/recording.wav',
      startedAt: new Date(),
      topicId: 'topic-1',
      userId: 'user-1',
      deviceId: 'device-1',
    };

    mockGetPausedRecording.mockResolvedValue(mockPausedRecording);

    const { result } = renderHook(() => useResumeRecording());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pausedRecording).toEqual(mockPausedRecording);
    expect(mockGetPausedRecording).toHaveBeenCalledTimes(1);
  });

  it('should return null when no paused recording exists', async () => {
    mockGetPausedRecording.mockResolvedValue(null);

    const { result } = renderHook(() => useResumeRecording());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pausedRecording).toBeNull();
  });

  it('should resume paused recording', async () => {
    const mockPausedRecording = {
      id: 'paused-123',
      filePath: '/path/to/recording.wav',
      uri: '/path/to/recording.wav',
      startedAt: new Date(),
      topicId: 'topic-1',
      userId: 'user-1',
      deviceId: 'device-1',
    };

    const mockHandle = {
      metadata: mockPausedRecording,
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
    };

    mockGetPausedRecording.mockResolvedValue(mockPausedRecording);
    mockStartRecordingStream.mockResolvedValue(mockHandle);

    const { result } = renderHook(() => useResumeRecording());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.resumeRecording();
    });

    expect(mockStartRecordingStream).toHaveBeenCalledWith({
      topicId: 'topic-1',
      userId: 'user-1',
      deviceId: 'device-1',
    });

    expect(mockSetCurrentRecording).toHaveBeenCalledWith(mockHandle);
    expect(mockSetPausedRecordingId).toHaveBeenCalledWith(null);
    expect(result.current.pausedRecording).toBeNull();
  });

  it('should discard paused recording', async () => {
    const mockPausedRecording = {
      id: 'paused-123',
      filePath: '/path/to/recording.wav',
      uri: '/path/to/recording.wav',
      startedAt: new Date(),
    };

    mockGetPausedRecording.mockResolvedValue(mockPausedRecording);
    mockDiscardPausedRecording.mockResolvedValue(undefined);

    const { result } = renderHook(() => useResumeRecording());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.discardRecording();
    });

    expect(mockDiscardPausedRecording).toHaveBeenCalledWith('paused-123');
    expect(mockSetPausedRecordingId).toHaveBeenCalledWith(null);
    expect(result.current.pausedRecording).toBeNull();
  });

  it('should handle errors when checking for paused recording', async () => {
    const mockDevLogError = jest.spyOn(devLog, 'error').mockImplementation();
    mockGetPausedRecording.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useResumeRecording());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockDevLogError).toHaveBeenCalledWith(
      'Failed to check for paused recording:',
      expect.any(Error)
    );
    expect(result.current.pausedRecording).toBeNull();

    mockDevLogError.mockRestore();
  });
});
