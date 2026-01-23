import { Audio } from 'expo-av';
import { playerService } from './playerService';

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

describe('playerService', () => {
  let mockSound: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSound = {
      unloadAsync: jest.fn().mockResolvedValue({}),
      playAsync: jest.fn().mockResolvedValue({}),
      pauseAsync: jest.fn().mockResolvedValue({}),
      stopAsync: jest.fn().mockResolvedValue({}),
      setPositionAsync: jest.fn().mockResolvedValue({}),
      setRateAsync: jest.fn().mockResolvedValue({}),
    };
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({ sound: mockSound });
  });

  it('should load audio', async () => {
    const onStatusUpdate = jest.fn();
    await playerService.loadAudio('file://test.wav', onStatusUpdate);
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: 'file://test.wav' },
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should play audio', async () => {
    const onStatusUpdate = jest.fn();
    await playerService.loadAudio('file://test.wav', onStatusUpdate);
    await playerService.play();
    expect(mockSound.playAsync).toHaveBeenCalled();
  });

  it('should pause audio', async () => {
    const onStatusUpdate = jest.fn();
    await playerService.loadAudio('file://test.wav', onStatusUpdate);
    await playerService.pause();
    expect(mockSound.pauseAsync).toHaveBeenCalled();
  });

  it('should seek to position', async () => {
    const onStatusUpdate = jest.fn();
    await playerService.loadAudio('file://test.wav', onStatusUpdate);
    await playerService.seekTo(5000);
    expect(mockSound.setPositionAsync).toHaveBeenCalledWith(5000);
  });
});
