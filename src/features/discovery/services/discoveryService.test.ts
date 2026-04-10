import { fetchDiscoveryQuestions } from './discoveryService';

const mockFrom = jest.fn();

const mockDiscoveryLimit = jest.fn();
const mockDiscoveryOrder = jest.fn();
const mockDiscoverySelect = jest.fn();
const mockDiscoveryIn = jest.fn();

const discoveryQuery = {
  select: (...args: unknown[]) => mockDiscoverySelect(...args),
  order: (...args: unknown[]) => mockDiscoveryOrder(...args),
  limit: (...args: unknown[]) => mockDiscoveryLimit(...args),
  in: (...args: unknown[]) => mockDiscoveryIn(...args),
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe('fetchDiscoveryQuestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue(discoveryQuery);

    mockDiscoverySelect.mockReturnValue(discoveryQuery);
    mockDiscoveryOrder.mockReturnValue(discoveryQuery);
    mockDiscoveryIn.mockReturnValue(discoveryQuery);
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
