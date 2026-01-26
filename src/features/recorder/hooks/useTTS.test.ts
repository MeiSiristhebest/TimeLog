import { renderHook, act } from '@testing-library/react-native';

import { useTTS } from './useTTS';
import { TTSService } from '../services/ttsService';
import { getRandomQuestion } from '../data/topicQuestions';

// Mock TTSService
jest.mock('../services/ttsService', () => ({
  TTSService: {
    speak: jest.fn(),
    stop: jest.fn(),
    isSpeaking: jest.fn().mockResolvedValue(false),
  },
}));

// Mock topicQuestions
jest.mock('../data/topicQuestions', () => ({
  getRandomQuestion: jest.fn(() => ({
    id: 'q-001',
    text: 'What was your favorite game as a child?',
    category: 'childhood',
  })),
  resetLastQuestion: jest.fn(),
}));

describe('useTTS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to return a fresh question
    (getRandomQuestion as jest.Mock).mockReturnValue({
      id: 'q-001',
      text: 'What was your favorite game as a child?',
      category: 'childhood',
    });
  });

  describe('initial state', () => {
    it('should initialize with a random question', () => {
      const { result } = renderHook(() => useTTS());

      expect(result.current.currentQuestion).toBeDefined();
      expect(result.current.currentQuestion.id).toBe('q-001');
      expect(result.current.isSpeaking).toBe(false);
    });

    it('should use initialQuestion if provided', () => {
      const customQuestion = {
        id: 'custom-001',
        text: 'Custom question',
        category: 'general' as const,
      };

      const { result } = renderHook(() => useTTS({ initialQuestion: customQuestion }));

      expect(result.current.currentQuestion.id).toBe('custom-001');
      expect(result.current.currentQuestion.text).toBe('Custom question');
    });

    it('should not auto-play by default', () => {
      renderHook(() => useTTS());

      expect(TTSService.speak).not.toHaveBeenCalled();
    });

    it('should auto-play when autoPlay option is true', () => {
      renderHook(() => useTTS({ autoPlay: true }));

      expect(TTSService.speak).toHaveBeenCalledTimes(1);
      expect(TTSService.speak).toHaveBeenCalledWith(
        'What was your favorite game as a child?',
        expect.any(Object)
      );
    });
  });

  describe('speak', () => {
    it('should call TTSService.speak with current question text', () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        result.current.speak();
      });

      expect(TTSService.speak).toHaveBeenCalledWith(
        'What was your favorite game as a child?',
        expect.any(Object)
      );
    });

    it('should set isSpeaking to true when speaking', () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        result.current.speak();
      });

      expect(result.current.isSpeaking).toBe(true);
    });
  });

  describe('replay', () => {
    it('should call TTSService.speak with the same question', () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        result.current.replay();
      });

      expect(TTSService.speak).toHaveBeenCalledWith(
        'What was your favorite game as a child?',
        expect.any(Object)
      );
    });
  });

  describe('stop', () => {
    it('should call TTSService.stop', () => {
      const { result } = renderHook(() => useTTS());

      act(() => {
        result.current.stop();
      });

      expect(TTSService.stop).toHaveBeenCalledTimes(1);
    });

    it('should set isSpeaking to false', () => {
      const { result } = renderHook(() => useTTS());

      // First start speaking
      act(() => {
        result.current.speak();
      });

      expect(result.current.isSpeaking).toBe(true);

      // Then stop
      act(() => {
        result.current.stop();
      });

      expect(result.current.isSpeaking).toBe(false);
    });
  });

  describe('newTopic', () => {
    it('should get a new random question', () => {
      const newQuestion = {
        id: 'q-002',
        text: 'Do you remember your first day of school?',
        category: 'childhood',
      };
      (getRandomQuestion as jest.Mock).mockReturnValueOnce(newQuestion);

      const { result } = renderHook(() => useTTS());

      act(() => {
        result.current.newTopic();
      });

      expect(getRandomQuestion).toHaveBeenCalled();
    });

    it('should speak the new question automatically', () => {
      const newQuestion = {
        id: 'q-002',
        text: 'New question',
        category: 'childhood',
      };
      (getRandomQuestion as jest.Mock).mockReturnValue(newQuestion);

      const { result } = renderHook(() => useTTS());

      act(() => {
        result.current.newTopic();
      });

      expect(TTSService.speak).toHaveBeenCalledWith('New question', expect.any(Object));
    });
  });

  describe('cleanup', () => {
    it('should stop TTS on unmount', () => {
      const { unmount } = renderHook(() => useTTS());

      unmount();

      expect(TTSService.stop).toHaveBeenCalled();
    });
  });
});
