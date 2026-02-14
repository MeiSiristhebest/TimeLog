import { db } from '@/db/client';
import { getUnansweredQuestions } from './questionService';

type FamilyQuestionRow = {
  id: string;
  senior_user_id: string;
  family_user_id: string;
  question_text: string;
  category: string | null;
  created_at: string;
  answered_at: string | null;
};

const localRows: {
  id: string;
  seniorUserId: string;
  familyUserId: string;
  questionText: string;
  category: string;
  createdAt: number;
  answeredAt: number | null;
}[] = [];

const mockRemoteOrder = jest.fn();
const mockRemoteIs = jest.fn();
const mockRemoteEq = jest.fn();
const mockRemoteSelect = jest.fn();
const mockRemoteInsertSelect = jest.fn();
const mockRemoteInsert = jest.fn();
const mockRemoteUpdateEq = jest.fn();
const mockRemoteUpdate = jest.fn();
const mockSupabaseFrom = jest.fn();

function createThenableMock(returnValue: unknown = undefined) {
  const mock: any = jest.fn(() => mock);
  mock.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(returnValue).then(resolve, reject);
  mock.values = jest.fn(() => mock);
  mock.onConflictDoUpdate = jest.fn(() => mock);
  return mock;
}

jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(async () => [...localRows]),
        })),
      })),
    })),
    insert: jest.fn(),
  },
}));

jest.mock('@/db/schema', () => ({
  familyQuestions: {
    id: 'id',
    seniorUserId: 'senior_user_id',
    answeredAt: 'answered_at',
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

describe('questionService local-first sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localRows.length = 0;

    const insertChain = createThenableMock(undefined);
    insertChain.values.mockImplementation((payload: unknown) => {
      const rows = (Array.isArray(payload) ? payload : [payload]) as {
        id: string;
        seniorUserId: string;
        familyUserId: string;
        questionText: string;
        category: string;
        createdAt: number;
        answeredAt: number | null;
      }[];

      rows.forEach((row) => {
        const existingIndex = localRows.findIndex((item) => item.id === row.id);
        if (existingIndex >= 0) {
          localRows[existingIndex] = row;
        } else {
          localRows.push(row);
        }
      });

      return insertChain;
    });
    (db.insert as jest.Mock).mockReturnValue(insertChain);

    mockRemoteOrder.mockResolvedValue({ data: [], error: null });
    mockRemoteIs.mockReturnValue({ order: (...args: unknown[]) => mockRemoteOrder(...args) });
    mockRemoteEq.mockReturnValue({ is: (...args: unknown[]) => mockRemoteIs(...args) });
    mockRemoteSelect.mockReturnValue({ eq: (...args: unknown[]) => mockRemoteEq(...args) });

    mockRemoteInsertSelect.mockResolvedValue({
      data: {
        id: 'new-q',
        senior_user_id: 'senior-1',
        family_user_id: 'family-1',
        question_text: 'New question',
        category: 'family',
        created_at: '2026-02-14T00:00:00.000Z',
        answered_at: null,
      },
      error: null,
    });
    mockRemoteInsert.mockReturnValue({ select: (...args: unknown[]) => mockRemoteInsertSelect(...args) });

    mockRemoteUpdateEq.mockResolvedValue({ error: null });
    mockRemoteUpdate.mockReturnValue({ eq: (...args: unknown[]) => mockRemoteUpdateEq(...args) });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'family_questions') {
        return {
          select: (...args: unknown[]) => mockRemoteSelect(...args),
          insert: (...args: unknown[]) => mockRemoteInsert(...args),
          update: (...args: unknown[]) => mockRemoteUpdate(...args),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
  });

  it('returns locally cached unanswered questions when cloud fetch fails', async () => {
    localRows.push({
      id: 'local-q-1',
      seniorUserId: 'senior-1',
      familyUserId: 'family-1',
      questionText: 'Local cached question',
      category: 'family',
      createdAt: Date.now(),
      answeredAt: null,
    });
    mockRemoteOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'network down' },
    });

    const result = await getUnansweredQuestions('senior-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('local-q-1');
    expect(db.select).toHaveBeenCalled();
  });

  it('persists cloud family questions into local sqlite before returning', async () => {
    const remoteRows: FamilyQuestionRow[] = [
      {
        id: 'remote-q-1',
        senior_user_id: 'senior-1',
        family_user_id: 'family-2',
        question_text: 'How did you meet grandma?',
        category: 'family',
        created_at: '2026-02-14T09:00:00.000Z',
        answered_at: null,
      },
    ];
    mockRemoteOrder.mockResolvedValueOnce({
      data: remoteRows,
      error: null,
    });

    const result = await getUnansweredQuestions('senior-1');

    expect(db.insert).toHaveBeenCalled();
    expect(result.some((item) => item.id === 'remote-q-1')).toBe(true);
  });
});
