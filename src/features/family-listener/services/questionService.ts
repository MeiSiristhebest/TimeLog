/**
 * Question Service - Family question submission and management.
 *
 * Story 5.4: Family Prompts & Inspiration (AC: 2, 3)
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

export const FAMILY_QUESTION_CATEGORIES = {
  GENERAL: 'general',
  CHILDHOOD: 'childhood',
  FAMILY: 'family',
  CAREER: 'career',
  HOBBIES: 'hobbies',
  TRAVEL: 'travel',
} as const;

export type FamilyQuestionCategory =
  (typeof FAMILY_QUESTION_CATEGORIES)[keyof typeof FAMILY_QUESTION_CATEGORIES];

function normalizeFamilyQuestionCategory(category?: string | null): FamilyQuestionCategory {
  const normalized = category?.trim().toLowerCase();
  if (!normalized) return FAMILY_QUESTION_CATEGORIES.GENERAL;

  if (normalized === 'childhood') return FAMILY_QUESTION_CATEGORIES.CHILDHOOD;
  if (normalized === 'family' || normalized === 'family_history') {
    return FAMILY_QUESTION_CATEGORIES.FAMILY;
  }
  if (normalized === 'career' || normalized === 'education') {
    return FAMILY_QUESTION_CATEGORIES.CAREER;
  }
  if (normalized === 'hobbies') return FAMILY_QUESTION_CATEGORIES.HOBBIES;
  if (normalized === 'travel') return FAMILY_QUESTION_CATEGORIES.TRAVEL;

  return FAMILY_QUESTION_CATEGORIES.GENERAL;
}

export interface FamilyQuestion {
  id: string;
  seniorUserId: string;
  familyUserId: string;
  questionText: string;
  category: FamilyQuestionCategory;
  createdAt: string;
  answeredAt: string | null;
}

interface FamilyQuestionRow {
  id: string;
  senior_user_id: string;
  family_user_id: string;
  question_text: string;
  category: string | null;
  created_at: string;
  answered_at: string | null;
}

/**
 * Submit a question from family member to senior
 */
export async function submitQuestion(
  questionText: string,
  seniorUserId: string,
  familyUserId: string,
  category?: string
): Promise<FamilyQuestion> {
  const normalizedCategory = normalizeFamilyQuestionCategory(category);

  const { data, error } = await supabase
    .from('family_questions')
    .insert({
      senior_user_id: seniorUserId,
      family_user_id: familyUserId,
      question_text: questionText,
      category: normalizedCategory,
    })
    .select(
      `
      id,
      senior_user_id,
      family_user_id,
      question_text,
      category,
      created_at,
      answered_at
    `
    )
    .single();

  if (error) {
    devLog.error('[questionService] Failed to submit question:', error);
    throw error;
  }

  return {
    id: data.id,
    seniorUserId: data.senior_user_id,
    familyUserId: data.family_user_id,
    questionText: data.question_text,
    category: normalizeFamilyQuestionCategory(data.category),
    createdAt: data.created_at,
    answeredAt: data.answered_at,
  };
}

/**
 * Get unanswered questions for a senior user
 */
export async function getUnansweredQuestions(seniorUserId: string): Promise<FamilyQuestion[]> {
  const { data, error } = await supabase
    .from('family_questions')
    .select(
      `
      id,
      senior_user_id,
      family_user_id,
      question_text,
      category,
      created_at,
      answered_at
    `
    )
    .eq('senior_user_id', seniorUserId)
    .is('answered_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    devLog.error('[questionService] Failed to fetch unanswered questions:', error);
    return [];
  }

  return ((data || []) as FamilyQuestionRow[]).map((q) => ({
    id: q.id,
    seniorUserId: q.senior_user_id,
    familyUserId: q.family_user_id,
    questionText: q.question_text,
    category: normalizeFamilyQuestionCategory(q.category),
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
    devLog.error('[questionService] Failed to mark question as answered:', error);
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
    devLog.error('[questionService] Failed to load inspiration library:', error);
    // Return empty library on error
    return { categories: [] };
  }
}
