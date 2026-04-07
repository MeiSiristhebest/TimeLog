/**
 * Topic Service - Topic prioritization and recommendation.
 *
 * Story 5.5: Personalized Topic Recommendation (AC: 1, 2)
 */

import { supabase } from '@/lib/supabase';
import {
  loadInspirationLibrary,
  getUnansweredQuestions,
  markQuestionAsAnswered as markQuestionAnswered,
} from '@/features/family-listener/services/questionService';
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
 * Get recommended topics for senior user
 * Family questions appear first, then library questions
 */
export async function getRecommendedTopics(seniorUserId: string): Promise<Topic[]> {
  // 1. Fetch unanswered family questions and inspiration library in parallel
  const [familyQuestions, library] = await Promise.all([
    getUnansweredQuestions(seniorUserId),
    loadInspirationLibrary(),
  ]);
  const libraryQuestions = library.categories.flatMap((category) =>
    category.questions.map((q, index) => ({
      id: `${category.id}-${index}`,
      text: q,
      categoryName: category.name,
    }))
  );

  // 3. Convert to Topic interface
  const familyTopics: Topic[] = await Promise.all(
    familyQuestions.map(async (fq) => {
      // Fetch family member name
      // Note: In production, this should be optimized with a join
      let familyMemberName = 'Family Member';
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', fq.familyUserId)
          .single();
        if (data) {
          familyMemberName = data.display_name || 'Family Member';
        }
      } catch (error) {
        devLog.error('Failed to fetch family member name:', error);
      }

      return {
        id: fq.id,
        text: fq.questionText,
        source: 'family' as const,
        familyMemberName,
        familyQuestionId: fq.id,
        priority: 100,
      };
    })
  );

  const libraryTopics: Topic[] = libraryQuestions.map((lq) => ({
    id: lq.id,
    text: lq.text,
    source: 'library' as const,
    priority: 50,
  }));

  // 4. Combine and sort by priority
  const allTopics = [...familyTopics, ...libraryTopics];
  allTopics.sort((a, b) => b.priority - a.priority);

  return allTopics;
}

/**
 * Mark question as answered and create activity event
 */
export async function markQuestionAsAnswered(
  familyQuestionId: string,
  recordingId: string
): Promise<void> {
  await markQuestionAnswered(familyQuestionId, recordingId);

  // Create activity event for family notification
  try {
    // We need to fetch the question to get the family user ID
    const { data: question } = await supabase
      .from('family_questions')
      .select('family_user_id, senior_user_id')
      .eq('id', familyQuestionId)
      .single();

    if (question) {
      // Import dynamically to avoid circular dependency if any
      const { insertActivity } = await import('@/features/home/services/activityService');

      await insertActivity(
        'reaction', // Using reaction type as closest match for 'answered' or add new type
        recordingId, // Linking to the new recording (story)
        question.senior_user_id, // Actor = Senior
        question.family_user_id, // Target = Family Member
        {
          reactionType: 'heart', // Placeholder or add 'answer' metadata
          commentText: 'Answered your question',
        }
      );
    }
  } catch (error) {
    devLog.error('[topicService] Failed to create activity event:', error);
    // Don't fail the main operation if notification fails
  }
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
