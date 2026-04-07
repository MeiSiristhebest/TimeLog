/**
 * Question Service - Family question submission and management.
 *
 * Story 5.4: Family Prompts & Inspiration (AC: 2, 3)
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import { db } from '@/db/client';
import { familyQuestions } from '@/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';

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

type LocalFamilyQuestionRow = typeof familyQuestions.$inferSelect;

function toLocalTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function toIsoTimestamp(value: number | null): string | null {
  if (value === null) return null;
  return new Date(value).toISOString();
}

function mapLocalQuestion(row: LocalFamilyQuestionRow): FamilyQuestion {
  return {
    id: row.id,
    seniorUserId: row.seniorUserId,
    familyUserId: row.familyUserId,
    questionText: row.questionText,
    category: normalizeFamilyQuestionCategory(row.category),
    createdAt: new Date(row.createdAt).toISOString(),
    answeredAt: toIsoTimestamp(row.answeredAt),
  };
}

function mapRemoteQuestionRow(row: FamilyQuestionRow): typeof familyQuestions.$inferInsert {
  return {
    id: row.id,
    seniorUserId: row.senior_user_id,
    familyUserId: row.family_user_id,
    questionText: row.question_text,
    category: normalizeFamilyQuestionCategory(row.category),
    createdAt: toLocalTimestamp(row.created_at),
    answeredAt: row.answered_at ? toLocalTimestamp(row.answered_at) : null,
    recordingId: null,
    syncedAt: Date.now(),
  };
}

async function readLocalUnansweredQuestions(seniorUserId: string): Promise<FamilyQuestion[]> {
  const rows = await db
    .select()
    .from(familyQuestions)
    .where(and(eq(familyQuestions.seniorUserId, seniorUserId), isNull(familyQuestions.answeredAt)))
    .orderBy(desc(familyQuestions.createdAt));

  return rows.map(mapLocalQuestion);
}

async function upsertFamilyQuestionsLocally(rows: FamilyQuestionRow[]): Promise<void> {
  if (rows.length === 0) return;

  const localRows = rows.map(mapRemoteQuestionRow);
  for (const localRow of localRows) {
    await db
      .insert(familyQuestions)
      .values(localRow)
      .onConflictDoUpdate({
        target: familyQuestions.id,
        set: {
          seniorUserId: localRow.seniorUserId,
          familyUserId: localRow.familyUserId,
          questionText: localRow.questionText,
          category: localRow.category,
          createdAt: localRow.createdAt,
          answeredAt: localRow.answeredAt,
          syncedAt: localRow.syncedAt,
        },
      });
  }
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
  // 1. Validation
  const trimmedText = questionText.trim();
  if (!trimmedText) {
    throw new Error('Please enter a question.');
  }
  if (trimmedText.length > 500) {
    throw new Error('Question is too long. Please keep it under 500 characters.');
  }

  const normalizedCategory = normalizeFamilyQuestionCategory(category);

  const { data, error } = await supabase
    .from('family_questions')
    .insert({
      senior_user_id: seniorUserId,
      family_user_id: familyUserId,
      question_text: trimmedText,
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
    throw new Error('Failed to send your question. Please check your connection.');
  }

  const remoteRow = data as FamilyQuestionRow;
  const localRow = mapRemoteQuestionRow(remoteRow);
  await db
    .insert(familyQuestions)
    .values(localRow)
    .onConflictDoUpdate({
      target: familyQuestions.id,
      set: {
        seniorUserId: localRow.seniorUserId,
        familyUserId: localRow.familyUserId,
        questionText: localRow.questionText,
        category: localRow.category,
        createdAt: localRow.createdAt,
        answeredAt: localRow.answeredAt,
        syncedAt: localRow.syncedAt,
      },
    });

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
  const localSnapshot = await readLocalUnansweredQuestions(seniorUserId);

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
    return localSnapshot;
  }

  const remoteRows = (data || []) as FamilyQuestionRow[];
  await upsertFamilyQuestionsLocally(remoteRows);

  return readLocalUnansweredQuestions(seniorUserId);
}

/**
 * Mark a question as answered
 */
export async function markQuestionAsAnswered(
  questionId: string,
  recordingId: string
): Promise<void> {
  await db
    .update(familyQuestions)
    .set({
      answeredAt: Date.now(),
      recordingId,
      syncedAt: Date.now(),
    })
    .where(eq(familyQuestions.id, questionId));

  const { error } = await supabase
    .from('family_questions')
    .update({
      answered_at: new Date().toISOString(),
      recording_id: recordingId,
    })
    .eq('id', questionId);

  if (error) {
    devLog.error('[questionService] Failed to mark question as answered:', error);
    throw new Error('Failed to update question status. Your recording was saved safely.');
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
