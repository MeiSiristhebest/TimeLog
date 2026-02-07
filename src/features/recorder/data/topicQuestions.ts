import type { TopicQuestion } from '@/types/entities';

/**
 * Initial set of topic questions for elderly story recording.
 * Questions are designed to evoke meaningful memories and stories.
 */
export const TOPIC_QUESTIONS: TopicQuestion[] = [
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
    id: 'q-014',
    text: 'What was the biggest challenge you faced in life?',
    category: 'wisdom',
  },
  {
    id: 'q-015',
    text: 'What advice would you share with your children or grandchildren?',
    category: 'wisdom',
  },

  // Childhood (4 questions)
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
    id: 'q-011',
    text: 'What was your childhood home like?',
    category: 'childhood',
  },
  {
    id: 'q-024',
    text: 'Did you have a favorite toy or treasured possession growing up?',
    category: 'childhood',
  },

  // Travel (4 questions)
  {
    id: 'q-006',
    text: 'What was your most memorable trip?',
    category: 'travel',
  },
  {
    id: 'q-016',
    text: 'What is the most beautiful place you have ever visited?',
    category: 'travel',
  },
  {
    id: 'q-017',
    text: 'Tell me about a travel mishap that is funny now.',
    category: 'travel',
  },
  {
    id: 'q-025',
    text: 'What culture or country surprised you the most during your travels?',
    category: 'travel',
  },

  // Education (4 questions)
  {
    id: 'q-009',
    text: 'What was your dream when you were young?',
    category: 'career', // Maps to Education
  },
  {
    id: 'q-012',
    text: 'What was your first job?',
    category: 'career', // Maps to Education
  },
  {
    id: 'q-018',
    text: 'Who was your favorite teacher and why?',
    category: 'education',
  },
  {
    id: 'q-026',
    text: 'What is a skill you learned outside of school that has been most useful?',
    category: 'education',
  },

  // History (4 questions - mapped from 'history' and 'memories')
  {
    id: 'q-003',
    text: 'Who was your best friend when you were young?',
    category: 'memories', // Maps to History
  },
  {
    id: 'q-005',
    text: 'What is your proudest achievement in life?',
    category: 'memories', // Maps to History
  },
  {
    id: 'q-023',
    text: 'What historical event made the biggest impact on you?',
    category: 'history',
  },
  {
    id: 'q-027',
    text: 'What was the most significant change you’ve seen in the world during your lifetime?',
    category: 'history',
  },

  // Celebration (4 questions - mapped from 'celebrations', 'family')
  {
    id: 'q-004',
    text: 'How did you meet your spouse?',
    category: 'family', // Maps to Celebration
  },
  {
    id: 'q-010',
    text: 'What is your favorite holiday and why?',
    category: 'family', // Maps to Celebration
  },
  {
    id: 'q-020',
    text: 'What is your favorite family tradition?',
    category: 'celebrations',
  },
  {
    id: 'q-028',
    text: 'How did you celebrate your most memorable birthday?',
    category: 'celebrations',
  },

  // Hobbies (4 questions)
  {
    id: 'q-019',
    text: 'How did you get into your favorite hobby?',
    category: 'hobbies',
  },
  {
    id: 'q-029',
    text: 'What brings you the most joy when doing your favorite hobby?',
    category: 'hobbies',
  },
  {
    id: 'q-030',
    text: 'Have you ever collected anything? Tell me about your collection.',
    category: 'hobbies',
  },
  {
    id: 'q-031',
    text: 'Is there a hobby or skill you always wanted to learn but haven’t yet?',
    category: 'hobbies',
  },

  // Food (4 questions)
  {
    id: 'q-013',
    text: 'What is your favorite food? Any special story behind it?',
    category: 'food',
  },
  {
    id: 'q-021',
    text: 'Is there a family recipe that is special to you?',
    category: 'food',
  },
  {
    id: 'q-032',
    text: 'What was your favorite comfort food growing up?',
    category: 'food',
  },
  {
    id: 'q-033',
    text: 'Do you prefer cooking at home or eating out, and why?',
    category: 'food',
  },

  // Friendship (4 questions)
  {
    id: 'q-022',
    text: 'Tell me about a friend who changed your life.',
    category: 'friendship',
  },
  {
    id: 'q-034',
    text: 'What qualities do you value most in a good friend?',
    category: 'friendship',
  },
  {
    id: 'q-035',
    text: 'Do you still keep in touch with any friends from your childhood?',
    category: 'friendship',
  },
  {
    id: 'q-036',
    text: 'What is the funniest memory you have with a friend?',
    category: 'friendship',
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
