import { mergeRemoteIntoLocal } from './profileMerge';
import type { LocalProfile } from './localProfileService';
import type { UserProfile } from './profileService';

describe('mergeRemoteIntoLocal', () => {
  const local: LocalProfile = {
    id: 'user-1',
    displayName: 'Local',
    birthDate: '1950-01-01',
    language: 'en',
    fontScaleIndex: 1,
    avatarUri: 'local://avatar',
    avatarUrl: 'https://local/avatar.jpg',
    role: 'storyteller',
    isAnonymous: true,
    createdAt: 1000,
    updatedAt: 2000,
  };

  const remote: UserProfile = {
    id: 'remote-id',
    userId: 'user-1',
    displayName: 'Remote',
    birthDate: '1940-12-31',
    language: 'fr',
    fontScaleIndex: 3,
    avatarUri: 'remote://avatar',
    avatarUrl: 'https://remote/avatar.jpg',
    role: 'family',
    bio: null,
    isAnonymous: false,
    createdAt: new Date(1000).toISOString(),
    updatedAt: new Date(3000).toISOString(),
  };

  it('merges remote values when remote is newer', () => {
    const merged = mergeRemoteIntoLocal(local, remote);
    expect(merged.displayName).toBe('Remote');
    expect(merged.birthDate).toBe('1940-12-31');
    expect(merged.language).toBe('fr');
    expect(merged.fontScaleIndex).toBe(3);
    expect(merged.avatarUri).toBe('remote://avatar');
    expect(merged.avatarUrl).toBe('https://remote/avatar.jpg');
    expect(merged.role).toBe('family');
    expect(merged.isAnonymous).toBe(false);
    expect(merged.updatedAt).toBe(3000);
  });

  it('returns local when remote is older', () => {
    const olderRemote = { ...remote, updatedAt: new Date(1500).toISOString() };
    const merged = mergeRemoteIntoLocal(local, olderRemote);
    expect(merged).toEqual(local);
  });
});
