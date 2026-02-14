import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

/**
 * Family Questions - Questions submitted by family members for seniors to answer.
 *
 * Story 5.4: Family Prompts & Inspiration (AC: 2, 3)
 */
export const familyQuestions = sqliteTable(
  'family_questions',
  {
    id: text('id').primaryKey(), // UUID
    seniorUserId: text('senior_user_id').notNull(),
    familyUserId: text('family_user_id').notNull(),
    questionText: text('question_text').notNull(),
    createdAt: integer('created_at').notNull(), // Unix timestamp
    answeredAt: integer('answered_at'), // NULL = unanswered
    recordingId: text('recording_id'), // Link to answer recording
    syncedAt: integer('synced_at'), // NULL = not synced
  },
  (table) => ({
    // Index for fetching unanswered questions for a senior
    seniorUnansweredIdx: index('family_questions_senior_unanswered_idx').on(
      table.seniorUserId,
      table.answeredAt
    ),
  })
);

export const QUESTION_CATEGORIES = {
  GENERAL: 'general',
  CHILDHOOD: 'childhood',
  FAMILY: 'family',
  CAREER: 'career',
  HOBBIES: 'hobbies',
  TRAVEL: 'travel',
} as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[keyof typeof QUESTION_CATEGORIES];
