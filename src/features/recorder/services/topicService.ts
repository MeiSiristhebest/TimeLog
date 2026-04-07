/**
 * Topic Service - Topic prioritization and recommendation.
 *
 * Story 5.5: Personalized Topic Recommendation (AC: 1, 2)
 */

import { supabase } from '@/lib/supabase';
import { TOPIC_QUESTIONS, getQuestionById } from '@/features/recorder/data/topicQuestions';
import { devLog } from '@/lib/devLogger';

export interface Topic {
  id: string;
  text: string;
  source: 'family' | 'library';
  familyMemberName?: string;
  familyQuestionId?: string;
  priority: number;
}

/**
 * Get topic priority score
 * Family questions have highest priority (100)
 * Library questions have lower priority (50)
 */
export function getTopicPriority(topic: Topic): number {
  if (topic.source === 'family') {
    return 100;
  }
  return 50;
}

/**
 * Get recommended topics for senior user from the local library.
 */
export async function getRecommendedTopics(_seniorUserId: string): Promise<Topic[]> {
  // Convert local TOPIC_QUESTIONS to Topic interface
  const libraryTopics: Topic[] = TOPIC_QUESTIONS.map((q) => ({
    id: q.id,
    text: q.text,
    source: 'library' as const,
    priority: 50,
  }));

  // Simple shuffle to keep it fresh
  return [...libraryTopics].sort(() => Math.random() - 0.5);
}

/**
 * Mark question as answered (No-op in storyteller mode since family questions are removed from mobile)
 */
export async function markQuestionAsAnswered(
  _familyQuestionId: string,
  _recordingId: string
): Promise<void> {
  // No-op for now as family questions aren't shown in the storyteller app
  return Promise.resolve();
}

/**
 * Shuffle library questions
 */
export function shuffleTopics(topics: Topic[]): Topic[] {
  const familyTopics = topics.filter((t) => t.source === 'family');
  const libraryTopics = topics.filter((t) => t.source === 'library');

  // Shuffle library questions
  const shuffled = [...libraryTopics].sort(() => Math.random() - 0.5);

  // Family questions always come first
  return [...familyTopics, ...shuffled];
}
