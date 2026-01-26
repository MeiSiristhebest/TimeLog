import type { TopicQuestion } from '@/types/entities';

/**
 * Initial set of topic questions for elderly story recording.
 * Questions are designed to evoke meaningful memories and stories.
 */
export const TOPIC_QUESTIONS: TopicQuestion[] = [
  {
    id: 'q-001',
    text: 'What was your favorite game as a child?',
    category: 'childhood',
  },
  {
    id: 'q-002',
    text: 'Do you remember your first day of school?',
    category: 'childhood',
  },
  {
    id: 'q-003',
    text: 'Who was your best friend when you were young?',
    category: 'memories',
  },
  {
    id: 'q-004',
    text: 'How did you meet your spouse?',
    category: 'family',
  },
  {
    id: 'q-005',
    text: 'What is your proudest achievement in life?',
    category: 'memories',
  },
  {
    id: 'q-006',
    text: 'What was your most memorable trip?',
    category: 'memories',
  },
  {
    id: 'q-007',
    text: 'What is the most important lesson your parents taught you?',
    category: 'wisdom',
  },
  {
    id: 'q-008',
    text: 'What do you want your descendants to remember about you?',
    category: 'wisdom',
  },
  {
    id: 'q-009',
    text: 'What was your dream when you were young?',
    category: 'career',
  },
  {
    id: 'q-010',
    text: 'What is your favorite holiday and why?',
    category: 'family',
  },
  {
    id: 'q-011',
    text: 'What was your childhood home like?',
    category: 'childhood',
  },
  {
    id: 'q-012',
    text: 'What was your first job?',
    category: 'career',
  },
  {
    id: 'q-013',
    text: 'What is your favorite food? Any special story behind it?',
    category: 'general',
  },
  {
    id: 'q-014',
    text: 'What was the biggest challenge you faced in life?',
    category: 'wisdom',
  },
  {
    id: 'q-015',
    text: 'What advice would you share with your children or grandchildren?',
    category: 'wisdom',
  },
];

// Track the last shown question to avoid immediate repeats
let lastQuestionId: string | null = null;

/**
 * Get a random question from the topic library.
 * Avoids returning the same question twice in a row.
 *
 * @returns A random TopicQuestion
 */
export function getRandomQuestion(): TopicQuestion {
  // Filter out the last shown question to avoid immediate repeats
  const availableQuestions =
    lastQuestionId && TOPIC_QUESTIONS.length > 1
      ? TOPIC_QUESTIONS.filter((q) => q.id !== lastQuestionId)
      : TOPIC_QUESTIONS;

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const selected = availableQuestions[randomIndex];

  // Update last shown question
  lastQuestionId = selected.id;

  return selected;
}

/**
 * Get a specific question by ID.
 *
 * @param id - The question ID
 * @returns The question or undefined if not found
 */
export function getQuestionById(id: string): TopicQuestion | undefined {
  return TOPIC_QUESTIONS.find((q) => q.id === id);
}

/**
 * Get all questions in a specific category.
 *
 * @param category - The category to filter by
 * @returns Array of questions in that category
 */
export function getQuestionsByCategory(category: TopicQuestion['category']): TopicQuestion[] {
  return TOPIC_QUESTIONS.filter((q) => q.category === category);
}

/**
 * Reset the last question tracker (useful for testing).
 */
export function resetLastQuestion(): void {
  lastQuestionId = null;
}
