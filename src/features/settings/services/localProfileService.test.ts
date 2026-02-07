import * as localProfileService from './localProfileService';
import { db } from '@/db/client';
import { localProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

const createChainableMock = (returnValue: any = undefined) => {
  const mock: any = jest.fn(() => mock);

  mock.then = (resolve: any, reject: any) => Promise.resolve(returnValue).then(resolve, reject);
  mock.values = jest.fn(() => mock);
  mock.onConflictDoUpdate = jest.fn(() => mock);
  mock.set = jest.fn(() => mock);
  mock.where = jest.fn(() => mock);

  return mock;
};

jest.mock('@/db/client', () => ({
  db: {
    insert: jest.fn(),
    update: jest.fn(),
    query: {
      localProfiles: {
        findFirst: jest.fn(),
      },
    },
  },
}));

describe('localProfileService', () => {
  const baseProfile: localProfileService.LocalProfile = {
    id: 'user-1',
    displayName: 'Storyteller',
    birthDate: null,
    language: 'en',
    fontScaleIndex: 2,
    avatarUri: null,
    avatarUrl: null,
    role: 'storyteller',
    isAnonymous: true,
    createdAt: 1000,
    updatedAt: 2000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (db.insert as jest.Mock).mockReturnValue(createChainableMock(undefined));
    (db.update as jest.Mock).mockReturnValue(createChainableMock(undefined));
    (db.query.localProfiles.findFirst as jest.Mock).mockResolvedValue(null);
  });

  it('returns null when local profile missing', async () => {
    const result = await localProfileService.getLocalProfile('missing');
    expect(result).toBeNull();
  });

  it('uses profile.id when reading back after upsert', async () => {
    (db.query.localProfiles.findFirst as jest.Mock).mockResolvedValue(baseProfile);
    (eq as jest.Mock).mockClear();

    await localProfileService.upsertLocalProfile(baseProfile);

    expect(db.insert).toHaveBeenCalledWith(localProfiles);
    expect(eq).toHaveBeenCalledWith(localProfiles.id, baseProfile.id);
  });
});
