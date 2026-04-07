/**
 * Discovery Service - Fetch dynamic questions for Discovery feature
 *
 * Provides question fetching from Supabase discovery_questions table.
 * Questions are cached locally for offline access.
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import { TOPIC_QUESTIONS } from '@/features/recorder/data/topicQuestions';

export interface DiscoveryQuestion {
    id: string;
    text: string;
    category: string;
    priority: number;
    tags: string[];
    createdAt?: string;
}

/**
 * Raw response from Supabase
 */
interface DiscoveryQuestionRow {
    id: string;
    question_text: string;
    category: string;
    priority: number;
    tags: string[];
    created_at?: string;
}

/**
 * Transform raw DB row to DiscoveryQuestion
 */
function transformQuestion(row: DiscoveryQuestionRow): DiscoveryQuestion {
    return {
        id: row.id,
        text: row.question_text,
        category: row.category,
        priority: row.priority,
        tags: row.tags || [],
        createdAt: row.created_at,
    };
}



function transformLocalPresetQuestion(
  question: (typeof TOPIC_QUESTIONS)[number],
  index: number
): DiscoveryQuestion {
  return {
    id: `preset-${question.id}`,
    text: question.text,
    category: question.category ?? 'general',
    priority: Math.max(0, TOPIC_QUESTIONS.length - index),
    tags: ['preset', question.category ?? 'general'],
  };
}

const CATEGORY_QUERY_EXPANSION: Record<string, string[]> = {
  childhood: ['childhood'],
  family: ['family', 'family_history'],
  career: ['career', 'education'],
  hobbies: ['hobbies', 'food', 'friendship'],
  travel: ['travel'],
  general: ['general', 'memories', 'wisdom', 'history', 'celebrations'],
};

function expandCategories(categories?: string[]): string[] | undefined {
  if (!categories || categories.length === 0) {
    return undefined;
  }

  const expanded = new Set<string>();
  categories.forEach((category) => {
    const values = CATEGORY_QUERY_EXPANSION[category] ?? [category];
    values.forEach((value) => expanded.add(value));
  });

  return [...expanded];
}

function scoreForPriority(question: DiscoveryQuestion): number {
  const isFamilyTagged = question.tags.some((tag) => tag.toLowerCase().includes('family'));
  const isFamilyCategory = question.category === 'family_history' || question.category === 'family';
  const familyBoost = isFamilyTagged || isFamilyCategory ? 1000 : 0;
  return familyBoost + question.priority;
}

function normalizeQuestionText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function dedupeByQuestionText(questions: DiscoveryQuestion[]): DiscoveryQuestion[] {
  const seen = new Set<string>();
  const deduped: DiscoveryQuestion[] = [];

  questions.forEach((question) => {
    const key = normalizeQuestionText(question.text);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(question);
    }
  });

  return deduped;
}

function sortQuestions(a: DiscoveryQuestion, b: DiscoveryQuestion): number {
  const priorityDelta = scoreForPriority(b) - scoreForPriority(a);
  if (priorityDelta !== 0) return priorityDelta;

  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return bTime - aTime;
}

function buildLocalPresetQuestions(
  limit: number,
  expandedCategories?: string[]
): DiscoveryQuestion[] {
  const categorySet = expandedCategories ? new Set(expandedCategories) : null;

  return TOPIC_QUESTIONS
    .filter((question) => {
      if (!categorySet) {
        return true;
      }
      const normalizedCategory = (question.category ?? 'general').toLowerCase();
      return categorySet.has(normalizedCategory);
    })
    .map((question, index) => transformLocalPresetQuestion(question, index))
    .slice(0, limit);
}

/**
 * Fetch discovery questions from Supabase
 * Ordered by priority (descending) then creation date (newest first)
 *
 * @param limit - Maximum number of questions to fetch (default: 100)
 * @param categories - Optional array of categories to filter by (F3.2)
 * @param seniorUserId - Optional senior user id to merge unanswered family questions (F3.3)
 * @returns Array of discovery questions
 */
export async function fetchDiscoveryQuestions(
    limit = 100,
    categories?: string[],
    seniorUserId?: string
): Promise<DiscoveryQuestion[]> {
    const expandedCategories = expandCategories(categories);
    const localPresetQuestions = buildLocalPresetQuestions(limit, expandedCategories);

    try {
      let discoveryQuery = supabase
        .from('discovery_questions')
        .select('id, question_text, category, priority, tags, created_at')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (expandedCategories && expandedCategories.length > 0) {
        discoveryQuery = discoveryQuery.in('category', expandedCategories);
      }

      const { data, error } = await discoveryQuery;

      if (error) {
        devLog.error('[discoveryService] Failed to fetch discovery questions:', error);
        return localPresetQuestions;
      }

      const remoteDiscoveryQuestions: DiscoveryQuestion[] = (data ?? []).map((row: any) => ({
        id: row.id,
        text: row.question_text,
        category: row.category,
        priority: row.priority,
        tags: row.tags || [],
        createdAt: row.created_at,
      }));

      const mergedLibrary = dedupeByQuestionText([
        ...localPresetQuestions,
        ...remoteDiscoveryQuestions,
      ]).sort(sortQuestions);

      return mergedLibrary.slice(0, limit);
    } catch (error) {
      devLog.error('[discoveryService] Error fetching discovery questions:', error);
      return localPresetQuestions;
    }
}

/**
 * Fetch questions by category
 *
 * @param category - Category to filter by (e.g., 'childhood', 'family')
 * @param limit - Maximum number of questions (default: 50)
 * @returns Array of discovery questions in that category
 */
export async function fetchDiscoveryQuestionsByCategory(
    category: string,
    limit = 50
): Promise<DiscoveryQuestion[]> {
    return fetchDiscoveryQuestions(limit, [category]);
}
