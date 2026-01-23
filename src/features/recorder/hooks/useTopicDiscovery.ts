import { useState, useCallback } from 'react';
import { getRandomQuestion } from '../data/topicQuestions';
import type { TopicQuestion } from '@/types/entities';

export type UseTopicDiscoveryReturn = {
  /** Current question being displayed in discovery */
  currentQuestion: TopicQuestion;
  /** Get a new random question for discovery */
  nextTopic: () => void;
};

/**
 * Hook for managing topic discovery state.
 *
 * Implements AC: 2 from Story 3.4
 * - Manages the current question displayed in the discovery view
 * - Provides a nextTopic function to cycle through questions
 * - Leverages getRandomQuestion's built-in no-repeat logic
 *
 * @returns Topic discovery state and controls
 */
export const useTopicDiscovery = (): UseTopicDiscoveryReturn => {
  const [currentQuestion, setCurrentQuestion] = useState<TopicQuestion>(() =>
    getRandomQuestion()
  );

  const nextTopic = useCallback(() => {
    const newQuestion = getRandomQuestion();
    setCurrentQuestion(newQuestion);
  }, []);

  return {
    currentQuestion,
    nextTopic,
  };
};

export default useTopicDiscovery;
