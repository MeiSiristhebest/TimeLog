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
    };
}

/**
 * Fetch discovery questions from Supabase
 * Ordered by priority (descending) then creation date (newest first)
 *
 * @param limit - Maximum number of questions to fetch (default: 100)
 * @param categories - Optional array of categories to filter by (F3.2)
 * @returns Array of discovery questions
 */
export async function fetchDiscoveryQuestions(
    limit = 100,
    categories?: string[]
): Promise<DiscoveryQuestion[]> {
    try {
        let query = supabase
            .from('discovery_questions')
            .select('id, question_text, category, priority, tags')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        // F3.2: Apply category filter if provided
        if (categories && categories.length > 0) {
            query = query.in('category', categories);
        }

        const { data, error } = await query;

        if (error) {
            devLog.error('[discoveryService] Failed to fetch questions:', error);
            throw error;
        }

        return (data || []).map((row: DiscoveryQuestionRow) => transformQuestion(row));
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
