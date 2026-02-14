import { mmkv } from '@/lib/mmkv';
import { hasSeenWelcome, setWelcomeSeen } from './onboardingStorage';

const mockStore = new Map<string, string>();

jest.mock('@/lib/mmkv', () => ({
  mmkv: {
    getString: jest.fn((key: string) => mockStore.get(key)),
    set: jest.fn((key: string, value: string) => mockStore.set(key, value)),
    delete: jest.fn((key: string) => mockStore.delete(key)),
  },
}));

describe('onboardingStorage', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it('returns false when onboarding flag is missing', async () => {
    const seen = await hasSeenWelcome();
    expect(seen).toBe(false);
  });

  it('persists and reads onboarding seen flag', async () => {
    await setWelcomeSeen(true);
    expect(mmkv.set).toHaveBeenCalledWith('timelog.onboarding.welcome_seen', '1');
    const seen = await hasSeenWelcome();
    expect(seen).toBe(true);
  });

  it('can persist unseen value', async () => {
    await setWelcomeSeen(false);
    expect(mmkv.set).toHaveBeenCalledWith('timelog.onboarding.welcome_seen', '0');
  });
});

