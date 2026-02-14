import type { LocalProfile } from './localProfileService';
import type { UserProfile } from './profileService';

const CLOCK_SKEW_TOLERANCE_MS = 2 * 60 * 1000;

export function mergeRemoteIntoLocal(local: LocalProfile, remote: UserProfile): LocalProfile {
  const remoteUpdatedAt = Date.parse(remote.updatedAt);
  const localUpdatedAt = local.updatedAt;

  if (
    Number.isFinite(remoteUpdatedAt) &&
    remoteUpdatedAt > localUpdatedAt + CLOCK_SKEW_TOLERANCE_MS
  ) {
    return {
      ...local,
      displayName: remote.displayName ?? local.displayName,
      birthDate: remote.birthDate ?? local.birthDate,
      language: remote.language ?? local.language,
      fontScaleIndex: remote.fontScaleIndex ?? local.fontScaleIndex,
      avatarUri: remote.avatarUri ?? local.avatarUri,
      avatarUrl: remote.avatarUrl ?? local.avatarUrl,
      role: remote.role ?? local.role,
      isAnonymous: remote.isAnonymous ?? local.isAnonymous,
      updatedAt: remoteUpdatedAt,
    };
  }

  return local;
}
