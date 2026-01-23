/**
 * Question Service - Family question submission and management.
 * 
 * Story 5.4: Family Prompts & Inspiration (AC: 2, 3)
 */

import { supabase } from '@/lib/supabase';

export interface FamilyQuestion {
    id: string;
    seniorUserId: string;
    familyUserId: string;
    questionText: string;
    createdAt: string;
    answeredAt: string | null;
}

/**
 * Submit a question from family member to senior
 */
export async function submitQuestion(
    questionText: string,
    seniorUserId: string,
    familyUserId: string
): Promise<FamilyQuestion> {
    const { data, error } = await supabase
        .from('family_questions')
        .insert({
            senior_user_id: seniorUserId,
            family_user_id: familyUserId,
            question_text: questionText,
        })
        .select(`
      id,
      senior_user_id,
      family_user_id,
      question_text,
      created_at,
      answered_at
    `)
        .single();

    if (error) {
        console.error('[questionService] Failed to submit question:', error);
        throw error;
    }

    return {
        id: data.id,
        seniorUserId: data.senior_user_id,
        familyUserId: data.family_user_id,
        questionText: data.question_text,
        createdAt: data.created_at,
        answeredAt: data.answered_at,
    };
}

/**
 * Get unanswered questions for a senior user
 */
export async function getUnansweredQuestions(
    seniorUserId: string
): Promise<FamilyQuestion[]> {
    const { data, error } = await supabase
        .from('family_questions')
        .select(`
      id,
      senior_user_id,
      family_user_id,
      question_text,
      created_at,
      answered_at
    `)
        .eq('senior_user_id', seniorUserId)
        .is('answered_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[questionService] Failed to fetch unanswered questions:', error);
        return [];
    }

    return (data || []).map((q) => ({
        id: q.id,
        seniorUserId: q.senior_user_id,
        familyUserId: q.family_user_id,
        questionText: q.question_text,
        createdAt: q.created_at,
        answeredAt: q.answered_at,
    }));
}

/**
 * Mark a question as answered
 */
export async function markQuestionAsAnswered(
    questionId: string,
    recordingId: string
): Promise<void> {
    const { error } = await supabase
        .from('family_questions')
        .update({
            answered_at: new Date().toISOString(),
            recording_id: recordingId,
        })
        .eq('id', questionId);

    if (error) {
        console.error('[questionService] Failed to mark question as answered:', error);
        throw error;
    }
}

/**
 * Load inspiration library from assets
 */
export interface QuestionCategory {
    id: string;
    name: string;
    icon: string;
    questions: string[];
}

export interface InspirationLibrary {
    categories: QuestionCategory[];
}

let cachedLibrary: InspirationLibrary | null = null;

export async function loadInspirationLibrary(): Promise<InspirationLibrary> {
    if (cachedLibrary) {
        return cachedLibrary;
    }

    try {
        // In React Native, we need to use require for JSON assets
        // Note: assets folder is at project root, not in src, so use relative path
        const library = require('../../../../assets/inspiration-library.json');
        cachedLibrary = library;
        return library;
    } catch (error) {
        console.error('[questionService] Failed to load inspiration library:', error);
        // Return empty library on error
        return { categories: [] };
    }
}
