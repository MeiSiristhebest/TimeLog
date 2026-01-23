import { renderHook, act } from '@testing-library/react-native';
import { useTopicDiscovery } from './useTopicDiscovery';
import * as topicQuestions from '../data/topicQuestions';

// Mock topicQuestions data layer
jest.mock('../data/topicQuestions', () => ({
  getRandomQuestion: jest.fn(),
}));

describe('useTopicDiscovery', () => {
  const mockQuestion1 = { id: 'q1', text: 'Question 1' };
  const mockQuestion2 = { id: 'q2', text: 'Question 2' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with a random question', () => {
    (topicQuestions.getRandomQuestion as jest.Mock).mockReturnValue(mockQuestion1);
    const { result } = renderHook(() => useTopicDiscovery());

    expect(result.current.currentQuestion).toEqual(mockQuestion1);
    expect(topicQuestions.getRandomQuestion).toHaveBeenCalledTimes(1);
  });

  it('should update currentQuestion when nextTopic is called', () => {
    (topicQuestions.getRandomQuestion as jest.Mock)
      .mockReturnValueOnce(mockQuestion1)
      .mockReturnValueOnce(mockQuestion2);

    const { result } = renderHook(() => useTopicDiscovery());

    expect(result.current.currentQuestion).toEqual(mockQuestion1);

    act(() => {
      result.current.nextTopic();
    });

    expect(result.current.currentQuestion).toEqual(mockQuestion2);
    expect(topicQuestions.getRandomQuestion).toHaveBeenCalledTimes(2);
  });
});
