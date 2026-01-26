import { useState, useCallback, useRef, useEffect } from 'react';

import { getRandomQuestion } from '../data/topicQuestions';
import { TTSService } from '../services/ttsService';

import type { TopicQuestion } from '@/types/entities';

export type UseTTSOptions = {
  /** Auto-play TTS when hook mounts */
  autoPlay?: boolean;
  /** Initial question to display (random if not provided) */
  initialQuestion?: TopicQuestion;
};

export type UseTTSReturn = {
  /** Current question being displayed */
  currentQuestion: TopicQuestion;
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Speak the current question */
  speak: () => void;
  /** Replay the current question */
  replay: () => void;
  /** Stop TTS playback */
  stop: () => void;
  /** Get a new random question and speak it */
  newTopic: () => void;
};

/**
 * Hook for managing TTS playback of topic questions.
 *
 * Provides state and controls for:
 * - Speaking the current question
 * - Replaying the current question
 * - Cycling to a new random question
 * - Stopping playback
 *
 * @param options - Configuration options
 * @returns TTS controls and state
 */
export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const { autoPlay = false, initialQuestion } = options;

  // State
  const [currentQuestion, setCurrentQuestion] = useState<TopicQuestion>(
    () => initialQuestion ?? getRandomQuestion()
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Speak the given text
  const speakText = useCallback((text: string) => {
    if (!isMountedRef.current) return;

    setIsSpeaking(true);

    TTSService.speak(text, {
      onDone: () => {
        if (isMountedRef.current) {
          setIsSpeaking(false);
        }
      },
      onStopped: () => {
        if (isMountedRef.current) {
          setIsSpeaking(false);
        }
      },
      onError: () => {
        if (isMountedRef.current) {
          setIsSpeaking(false);
        }
      },
    });
  }, []);

  // Speak the current question
  const speak = useCallback(() => {
    speakText(currentQuestion.text);
  }, [currentQuestion.text, speakText]);

  // Replay the current question (same as speak)
  const replay = useCallback(() => {
    speakText(currentQuestion.text);
  }, [currentQuestion.text, speakText]);

  // Stop TTS playback
  const stop = useCallback(() => {
    TTSService.stop();
    if (isMountedRef.current) {
      setIsSpeaking(false);
    }
  }, []);

  // Get a new random question and speak it
  const newTopic = useCallback(() => {
    const newQuestion = getRandomQuestion();
    setCurrentQuestion(newQuestion);
    speakText(newQuestion.text);
  }, [speakText]);

  // Sync with initialQuestion if it changes (e.g., from navigation params)
  useEffect(() => {
    if (initialQuestion && initialQuestion.id !== currentQuestion.id) {
      setCurrentQuestion(initialQuestion);
      if (autoPlay) {
        speakText(initialQuestion.text);
      }
    }
  }, [initialQuestion, autoPlay, speakText, currentQuestion.id]);

  // Auto-play when enabled and no initial question is provided
  useEffect(() => {
    if (autoPlay && !initialQuestion) {
      speak();
    }
  }, [autoPlay, initialQuestion, speak]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      TTSService.stop();
    };
  }, []);

  return {
    currentQuestion,
    isSpeaking,
    speak,
    replay,
    stop,
    newTopic,
  };
}

export default useTTS;
