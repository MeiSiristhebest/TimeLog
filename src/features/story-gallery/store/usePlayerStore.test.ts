import { renderHook, act } from '@testing-library/react-native';
import { usePlayerStore } from './usePlayerStore';
import { playerService } from '../services/playerService';

jest.mock('../services/playerService');

describe('usePlayerStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePlayerStore.getState().reset();
  });

  it('should load audio and update state', async () => {
    const uri = 'file://test.wav';
    (playerService.loadAudio as jest.Mock).mockImplementation((u, callback) => {
      callback({
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 10000,
        rate: 1.0,
        isBuffering: false,
        didJustFinish: false,
      });
      return Promise.resolve();
    });

    const { result } = renderHook(() => usePlayerStore());

    await act(async () => {
      await result.current.load(uri);
    });

    expect(result.current.currentUri).toBe(uri);
    expect(result.current.durationMillis).toBe(10000);
    expect(result.current.isLoading).toBe(false);
  });

  it('should toggle playback', async () => {
    const { result } = renderHook(() => usePlayerStore());

    act(() => {
      usePlayerStore.setState({ currentUri: 'file://test.wav', isPlaying: false });
    });

    await act(async () => {
      await result.current.togglePlayback();
    });

    expect(playerService.play).toHaveBeenCalled();

    act(() => {
      usePlayerStore.setState({ isPlaying: true });
    });

    await act(async () => {
      await result.current.togglePlayback();
    });

    expect(playerService.pause).toHaveBeenCalled();
  });

  it('should set playback rate', async () => {
    const { result } = renderHook(() => usePlayerStore());

    await act(async () => {
      await result.current.setRate(1.25);
    });

    expect(playerService.setRate).toHaveBeenCalledWith(1.25);
    expect(result.current.rate).toBe(1.25);
  });

  it('should set output mode', async () => {
    const { result } = renderHook(() => usePlayerStore());

    await act(async () => {
      await result.current.setOutputMode('earpiece');
    });

    expect(playerService.setOutputMode).toHaveBeenCalledWith('earpiece');
    expect(result.current.outputMode).toBe('earpiece');
  });
});
