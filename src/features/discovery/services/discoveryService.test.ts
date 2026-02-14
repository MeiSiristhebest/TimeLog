import { fetchDiscoveryQuestions } from './discoveryService';

const mockFrom = jest.fn();
const mockGetUnansweredQuestions = jest.fn();

const mockDiscoveryLimit = jest.fn();
const mockDiscoveryOrder = jest.fn();
const mockDiscoverySelect = jest.fn();
const mockDiscoveryIn = jest.fn();

const mockFamilyLimit = jest.fn();
const mockFamilyOrder = jest.fn();
const mockFamilySelect = jest.fn();
const mockFamilyEq = jest.fn();
const mockFamilyIs = jest.fn();
const mockFamilyIn = jest.fn();

const discoveryQuery = {
  select: (...args: unknown[]) => mockDiscoverySelect(...args),
  order: (...args: unknown[]) => mockDiscoveryOrder(...args),
  limit: (...args: unknown[]) => mockDiscoveryLimit(...args),
  in: (...args: unknown[]) => mockDiscoveryIn(...args),
};

const familyQuery = {
  select: (...args: unknown[]) => mockFamilySelect(...args),
  eq: (...args: unknown[]) => mockFamilyEq(...args),
  is: (...args: unknown[]) => mockFamilyIs(...args),
  order: (...args: unknown[]) => mockFamilyOrder(...args),
  limit: (...args: unknown[]) => mockFamilyLimit(...args),
  in: (...args: unknown[]) => mockFamilyIn(...args),
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@/features/family-listener/services/questionService', () => ({
  getUnansweredQuestions: (...args: unknown[]) => mockGetUnansweredQuestions(...args),
}));

describe('fetchDiscoveryQuestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUnansweredQuestions.mockResolvedValue([]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'family_questions') {
        return familyQuery;
      }
      return discoveryQuery;
    });

    mockDiscoverySelect.mockReturnValue(discoveryQuery);
    mockDiscoveryOrder.mockReturnValue(discoveryQuery);
    mockDiscoveryIn.mockReturnValue(discoveryQuery);

    mockFamilySelect.mockReturnValue(familyQuery);
    mockFamilyEq.mockReturnValue(familyQuery);
    mockFamilyIs.mockReturnValue(familyQuery);
    mockFamilyOrder.mockReturnValue(familyQuery);
    mockFamilyIn.mockReturnValue(familyQuery);
  });

  it('prioritizes family-tagged topics from discovery list', async () => {
    mockDiscoveryLimit.mockResolvedValue({
      data: [
        {
          id: 'normal',
          question_text: 'Normal question',
          category: 'general',
          priority: 100,
          tags: [],
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'family',
          question_text: 'Family question',
          category: 'family_history',
          priority: 1,
          tags: ['family'],
          created_at: '2026-01-02T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await fetchDiscoveryQuestions();

    const familyQuestion = result.find((question) => question.id === 'family');
    const normalQuestion = result.find((question) => question.id === 'normal');

    expect(familyQuestion).toBeTruthy();
    expect(normalQuestion).toBeTruthy();
    expect(result.findIndex((question) => question.id === 'family')).toBeLessThan(
      result.findIndex((question) => question.id === 'normal')
    );
  });

  it('merges unanswered family questions for a senior and keeps them at top', async () => {
    mockDiscoveryLimit.mockResolvedValue({
      data: [
        {
          id: 'lib-1',
          question_text: 'Library question',
          category: 'general',
          priority: 500,
          tags: [],
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    });

    mockGetUnansweredQuestions.mockResolvedValue([
      {
        id: 'family-1',
        seniorUserId: 'senior-123',
        familyUserId: 'family-user-1',
        questionText: 'Question from daughter',
        category: 'family',
        createdAt: '2026-01-03T00:00:00Z',
        answeredAt: null,
      },
    ]);

    const result = await fetchDiscoveryQuestions(100, undefined, 'senior-123');

    expect(result[0]?.id).toBe('family-1');
    expect(result[0]?.tags).toContain('family');
    expect(result.some((item) => item.id === 'lib-1')).toBe(true);
    expect(mockGetUnansweredQuestions).toHaveBeenCalledWith('senior-123');
  });

  it('returns local preset questions when remote fetch fails', async () => {
    mockDiscoveryLimit.mockResolvedValue({
      data: null,
      error: { message: 'network down' },
    });

    const result = await fetchDiscoveryQuestions();

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((item) => item.id.startsWith('preset-'))).toBe(true);
  });

  it('dedupes local and remote by normalized question text', async () => {
    mockDiscoveryLimit.mockResolvedValue({
      data: [
        {
          id: 'remote-dup',
          question_text: '  What was your favorite game as a child?  ',
          category: 'childhood',
          priority: 999,
          tags: [],
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await fetchDiscoveryQuestions();
    const matchingText = result.filter(
      (item) => item.text.trim().toLowerCase() === 'what was your favorite game as a child?'
    );

    expect(matchingText).toHaveLength(1);
    expect(matchingText[0]?.id).toBe('preset-q-001');
  });
});
