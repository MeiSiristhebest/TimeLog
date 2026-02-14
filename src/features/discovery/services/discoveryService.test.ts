import { fetchDiscoveryQuestions } from './discoveryService';

const mockFrom = jest.fn();

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

describe('fetchDiscoveryQuestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

    expect(result[0]?.id).toBe('family');
    expect(result[1]?.id).toBe('normal');
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

    mockFamilyLimit.mockResolvedValue({
      data: [
        {
          id: 'family-1',
          question_text: 'Question from daughter',
          category: 'family',
          created_at: '2026-01-03T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await fetchDiscoveryQuestions(100, undefined, 'senior-123');

    expect(result[0]?.id).toBe('family-1');
    expect(result[0]?.tags).toContain('family');
    expect(result[1]?.id).toBe('lib-1');
    expect(mockFrom).toHaveBeenCalledWith('family_questions');
  });
});
