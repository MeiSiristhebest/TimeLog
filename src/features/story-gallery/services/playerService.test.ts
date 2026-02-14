import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { playerService } from './playerService';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

describe('playerService', () => {
  let mockPlayer: {
    isLoaded: boolean;
    play: jest.Mock;
    pause: jest.Mock;
    seekTo: jest.Mock;
    setPlaybackRate: jest.Mock;
    addListener: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    playerService.cleanup();

    mockPlayer = {
      isLoaded: true,
      play: jest.fn(),
      pause: jest.fn(),
      seekTo: jest.fn(),
      setPlaybackRate: jest.fn(),
      addListener: jest.fn(),
      remove: jest.fn(),
    };

    (createAudioPlayer as jest.Mock).mockReturnValue(mockPlayer);
  });

  it('loads audio and creates player', async () => {
    await playerService.loadAudio('file://test.wav', jest.fn());

    expect(createAudioPlayer).toHaveBeenCalledWith('file://test.wav');
    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
      })
    );
    expect(mockPlayer.addListener).toHaveBeenCalledWith(
      'playbackStatusUpdate',
      expect.any(Function)
    );
  });

  it('switches output mode between speaker and earpiece', async () => {
    await playerService.setOutputMode('earpiece');
    expect(setAudioModeAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        shouldRouteThroughEarpiece: true,
      })
    );

    await playerService.setOutputMode('speaker');
    expect(setAudioModeAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        shouldRouteThroughEarpiece: false,
      })
    );
  });

  it('plays, pauses, seeks and sets rate', async () => {
    await playerService.loadAudio('file://test.wav', jest.fn());

    playerService.play();
    playerService.pause();
    playerService.seekTo(5000);
    playerService.setRate(1.25);

    expect(mockPlayer.play).toHaveBeenCalled();
    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(5);
    expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(1.25);
  });

  it('stops by pausing and seeking to zero', async () => {
    await playerService.loadAudio('file://test.wav', jest.fn());

    playerService.stop();

    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
  });
});
