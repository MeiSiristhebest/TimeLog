import { ensureStorytellerSession } from './storytellerSessionService';
import { getActiveSession } from './sessionService';
import { signInAnonymously } from './anonymousAuthService';

jest.mock('./sessionService', () => ({
  getActiveSession: jest.fn(),
}));

jest.mock('./anonymousAuthService', () => ({
  signInAnonymously: jest.fn(),
}));

describe('storytellerSessionService.ensureStorytellerSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns existing session user when active session exists', async () => {
    (getActiveSession as jest.Mock).mockResolvedValue({
      user: { id: 'existing-user' },
    });

    const result = await ensureStorytellerSession();

    expect(result).toEqual({
      userId: 'existing-user',
      source: 'existing',
    });
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('creates anonymous session when active session is missing', async () => {
    (getActiveSession as jest.Mock).mockResolvedValue(null);
    (signInAnonymously as jest.Mock).mockResolvedValue({
      userId: 'anon-user',
      isAnonymous: true,
      session: { access_token: 'token' },
    });

    const result = await ensureStorytellerSession();

    expect(signInAnonymously).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      userId: 'anon-user',
      source: 'anonymous-created',
    });
  });

  it('throws when anonymous sign-in does not return user id', async () => {
    (getActiveSession as jest.Mock).mockResolvedValue(null);
    (signInAnonymously as jest.Mock).mockResolvedValue({
      userId: '',
      isAnonymous: true,
      session: null,
    });

    await expect(ensureStorytellerSession()).rejects.toThrow(
      'Anonymous session bootstrap returned no user id'
    );
  });
});
