/**
 * Discovery Service - Fetch dynamic questions for Discovery feature
 *
 * Provides question fetching from Supabase discovery_questions table.
 * Questions are cached locally for offline access.
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

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

interface FamilyQuestionRow {
  id: string;
  question_text: string;
  category: string | null;
  created_at: string;
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

function transformFamilyQuestion(row: FamilyQuestionRow): DiscoveryQuestion {
  return {
    id: row.id,
    text: row.question_text,
    category: row.category ?? 'family',
    priority: 0,
    tags: ['family'],
    createdAt: row.created_at,
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
    try {
        const expandedCategories = expandCategories(categories);

        let query = supabase
            .from('discovery_questions')
            .select('id, question_text, category, priority, tags, created_at')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        // F3.2: Apply category filter if provided
        if (expandedCategories && expandedCategories.length > 0) {
            query = query.in('category', expandedCategories);
        }

        const familyQueryPromise = seniorUserId
          ? (() => {
              let familyQuery = supabase
                .from('family_questions')
                .select('id, question_text, category, created_at')
                .eq('senior_user_id', seniorUserId)
                .is('answered_at', null)
                .order('created_at', { ascending: false })
                .limit(limit);

              if (expandedCategories && expandedCategories.length > 0) {
                familyQuery = familyQuery.in('category', expandedCategories);
              }

              return familyQuery;
            })()
          : Promise.resolve({ data: [], error: null });

        const [{ data, error }, { data: familyData, error: familyError }] = await Promise.all([
          query,
          familyQueryPromise,
        ]);

        if (error) {
            devLog.error('[discoveryService] Failed to fetch questions:', error);
            throw error;
        }

        if (familyError) {
          devLog.error('[discoveryService] Failed to fetch family questions:', familyError);
        }

        const merged = [
          ...(familyData || []).map((row: FamilyQuestionRow) => transformFamilyQuestion(row)),
          ...(data || []).map((row: DiscoveryQuestionRow) => transformQuestion(row)),
        ];

        const deduped = Array.from(new Map(merged.map((item) => [item.id, item])).values());

        return deduped.sort((a: DiscoveryQuestion, b: DiscoveryQuestion) => {
          const priorityDelta = scoreForPriority(b) - scoreForPriority(a);
          if (priorityDelta !== 0) return priorityDelta;

          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
    } catch (error) {
        devLog.error('[discoveryService] Error fetching discovery questions:', error);
        // Return empty array on error, caller should handle fallback
        return [];
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
    try {
        const { data, error } = await supabase
            .from('discovery_questions')
            .select('id, question_text, category, priority, tags')
            .eq('category', category)
            .order('priority', { ascending: false })
            .limit(limit);

        if (error) {
            devLog.error('[discoveryService] Failed to fetch questions by category:', error);
            throw error;
        }

        return (data || []).map((row: DiscoveryQuestionRow) => transformQuestion(row));
    } catch (error) {
        devLog.error('[discoveryService] Error fetching questions by category:', error);
        return [];
    }
}
