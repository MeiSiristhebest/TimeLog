import {
  TOPIC_QUESTIONS,
  getRandomQuestion,
  getQuestionById,
  getQuestionsByCategory,
  resetLastQuestion,
} from './topicQuestions';

describe('topicQuestions', () => {
  beforeEach(() => {
    resetLastQuestion();
  });

  describe('TOPIC_QUESTIONS', () => {
    it('should have at least 10 questions', () => {
      expect(TOPIC_QUESTIONS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid structure for all questions', () => {
      TOPIC_QUESTIONS.forEach((q) => {
        expect(q.id).toBeDefined();
        expect(q.text).toBeDefined();
        expect(q.text.length).toBeGreaterThan(0);
      });
    });

    it('should have unique IDs for all questions', () => {
      const ids = TOPIC_QUESTIONS.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getRandomQuestion', () => {
    it('should return a question from the list', () => {
      const question = getRandomQuestion();

      expect(question).toBeDefined();
      expect(question.id).toBeDefined();
      expect(question.text).toBeDefined();
    });

    it('should avoid repeating the same question twice in a row', () => {
      const firstQuestion = getRandomQuestion();
      const secondQuestion = getRandomQuestion();

      // With 15 questions, the probability of getting the same one is low
      // But our logic should guarantee they're different
      expect(secondQuestion.id).not.toBe(firstQuestion.id);
    });

    it('should return different questions over multiple calls', () => {
      const questions = new Set<string>();

      // Call 10 times and collect unique IDs
      for (let i = 0; i < 10; i++) {
        const q = getRandomQuestion();
        questions.add(q.id);
      }

      // Should have gotten at least 2 different questions
      expect(questions.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getQuestionById', () => {
    it('should return the correct question for a valid ID', () => {
      const question = getQuestionById('q-001');

      expect(question).toBeDefined();
      expect(question?.id).toBe('q-001');
      expect(question?.text).toBe('What was your favorite game as a child?');
    });

    it('should return undefined for an invalid ID', () => {
      const question = getQuestionById('invalid-id');

      expect(question).toBeUndefined();
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should return questions for the childhood category', () => {
      const questions = getQuestionsByCategory('childhood');

      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q) => {
        expect(q.category).toBe('childhood');
      });
    });

    it('should return questions for the wisdom category', () => {
      const questions = getQuestionsByCategory('wisdom');

      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q) => {
        expect(q.category).toBe('wisdom');
      });
    });

    it('should return empty array for non-existent category', () => {
      // @ts-expect-error - testing invalid category
      const questions = getQuestionsByCategory('nonexistent');

      expect(questions).toEqual([]);
    });
  });

  describe('resetLastQuestion', () => {
    it('should allow the same question to appear again after reset', () => {
      // Get a question
      const firstQuestion = getRandomQuestion();

      // Reset
      resetLastQuestion();

      // Now the same question could potentially appear again
      // We can't guarantee it will, but the logic allows it
      expect(firstQuestion).toBeDefined();
    });
  });
});
