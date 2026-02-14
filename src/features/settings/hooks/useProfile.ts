/**
 * useProfile Hook
 *
 * Manages user profile state with loading and error handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  UserProfile,
  ProfileUpdate,
} from '../services/profileService';
import { mergeRemoteIntoLocal } from '../services/profileMerge';
import {
  ensureLocalProfile,
  getLocalProfile,
  getLatestLocalProfile,
  updateLocalProfile,
  upsertLocalProfile,
  type LocalProfile,
} from '../services/localProfileService';
import { isAnonymousUser } from '@/features/auth/services/anonymousAuthService';
import { devLog } from '@/lib/devLogger';
import { useDisplaySettingsStore } from '../store/displaySettingsStore';
import { getSystemLocale } from '../utils/languageOptions';
import { DEFAULT_FONT_SCALE_INDEX } from '@/theme/heritage';
import { useCurrentUserId } from '@/features/auth/hooks/useCurrentUserId';
import { syncQueueService } from '@/lib/sync-engine/queue';
import type { ProfileSyncPayload } from '@/types/entities';

type UseProfileResult = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfileData: (updates: ProfileUpdate) => Promise<void>;
  uploadProfileAvatar: (imageUri: string) => Promise<string | null>;
  refetch: () => Promise<void>;
};

export function useProfile(): UseProfileResult {
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { currentUserId: resolvedCurrentUserId } = useCurrentUserId({
    enabled: !sessionUserId,
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const setFontScaleIndex = useDisplaySettingsStore((state) => state.setFontScaleIndex);
  const systemLocale = getSystemLocale();
  const hasLoadedProfileRef = useRef(false);

  const mapLocalToProfile = useCallback(
    (local: LocalProfile): UserProfile => ({
      id: local.id,
      userId: local.id,
      displayName: local.displayName,
      birthDate: local.birthDate,
      language: local.language,
      fontScaleIndex: local.fontScaleIndex,
      avatarUri: local.avatarUri,
      avatarUrl: local.avatarUrl,
      role: local.role,
      bio: null,
      isAnonymous: local.isAnonymous,
      createdAt: new Date(local.createdAt).toISOString(),
      updatedAt: new Date(local.updatedAt).toISOString(),
    }),
    []
  );

  const resolveUserId = useCallback(async (): Promise<string | null> => {
    if (sessionUserId) {
      return sessionUserId;
    }

    if (resolvedCurrentUserId) {
      return resolvedCurrentUserId;
    }

    // MMKV/session can be unavailable in some dev-build states; keep profile editable locally.
    const latestLocal = await getLatestLocalProfile();
    return latestLocal?.id ?? null;
  }, [sessionUserId, resolvedCurrentUserId]);

  const fetchProfile = useCallback(async () => {
    const userId = await resolveUserId();
    if (!userId) {
      setIsLoading(false);
      setProfile(null);
      return;
    }

    if (!hasLoadedProfileRef.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      let local = await getLocalProfile(userId);
      if (!local) {
        local = await ensureLocalProfile(userId, {
          displayName: 'Storyteller',
          role: 'storyteller',
          isAnonymous: true,
          language: systemLocale,
          fontScaleIndex: DEFAULT_FONT_SCALE_INDEX,
        });
      } else {
        const needsLanguage = !local.language;
        const needsFontScale = local.fontScaleIndex === null || local.fontScaleIndex === undefined;
        if (needsLanguage || needsFontScale) {
          local = await updateLocalProfile(userId, {
            language: needsLanguage ? systemLocale : local.language,
            fontScaleIndex: needsFontScale ? DEFAULT_FONT_SCALE_INDEX : local.fontScaleIndex,
          });
        }
      }

      setIsAnonymous(local.isAnonymous);
      setProfile(mapLocalToProfile(local));
      if (local.fontScaleIndex !== null && local.fontScaleIndex !== undefined) {
        setFontScaleIndex(local.fontScaleIndex);
      }
      setIsLoading(false);

      void (async () => {
        let localSnapshot = local;
        let resolvedAnonymous = localSnapshot.isAnonymous;

        try {
          resolvedAnonymous = await isAnonymousUser();
          if (resolvedAnonymous !== localSnapshot.isAnonymous) {
            localSnapshot = await updateLocalProfile(userId, {
              isAnonymous: resolvedAnonymous,
            });
            setProfile(mapLocalToProfile(localSnapshot));
          }
          setIsAnonymous(resolvedAnonymous);
        } catch (err) {
          devLog.warn('[useProfile] Failed to refresh anonymous status, keeping local value', err);
        }

        if (resolvedAnonymous) {
          return;
        }

        try {
          const hasPendingProfileSync = await syncQueueService.hasPendingProfileUpsert(userId);
          if (hasPendingProfileSync) {
            devLog.info('[useProfile] Skipping remote merge while local profile sync is pending');
            return;
          }

          const remote = await getProfile(userId);
          if (remote) {
            const merged = mergeRemoteIntoLocal(localSnapshot, remote);
            if (merged.updatedAt !== localSnapshot.updatedAt) {
              const nextLocal = await upsertLocalProfile(merged);
              setProfile(mapLocalToProfile(nextLocal));
              if (nextLocal.fontScaleIndex !== null && nextLocal.fontScaleIndex !== undefined) {
                setFontScaleIndex(nextLocal.fontScaleIndex);
              }
            }
          }
        } catch (remoteErr) {
          devLog.warn('[useProfile] Remote fetch failed, keeping local profile', remoteErr);
        }
      })();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      hasLoadedProfileRef.current = true;
      setIsLoading(false);
    }
  }, [resolveUserId, setFontScaleIndex, systemLocale, mapLocalToProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfileData = useCallback(
    async (updates: ProfileUpdate) => {
      const resolvedUserId = await resolveUserId();
      const userId = resolvedUserId ?? profile?.id ?? null;
      if (!userId) {
        throw new Error('No active user session');
      }

      try {
        const existing = await getLocalProfile(userId);
        if (!existing) {
          await ensureLocalProfile(userId, {
            displayName: updates.displayName ?? 'Storyteller',
            role: updates.role ?? 'storyteller',
            isAnonymous,
            language: updates.language ?? systemLocale,
            fontScaleIndex:
              updates.fontScaleIndex ?? DEFAULT_FONT_SCALE_INDEX,
          });
        }

        const local = await updateLocalProfile(userId, {
          displayName: updates.displayName,
          birthDate: updates.birthDate,
          language: updates.language,
          fontScaleIndex: updates.fontScaleIndex,
          avatarUri: updates.avatarUri,
          avatarUrl: updates.avatarUrl,
          role: updates.role,
          isAnonymous,
        });

        setProfile(mapLocalToProfile(local));
        if (updates.fontScaleIndex !== undefined) {
          setFontScaleIndex(updates.fontScaleIndex);
        }

        if (!isAnonymous) {
          const remoteUpdates: ProfileUpdate = {
            displayName: updates.displayName,
            birthDate: updates.birthDate,
            language: updates.language,
            fontScaleIndex: updates.fontScaleIndex,
            avatarUri: updates.avatarUri,
            avatarUrl: updates.avatarUrl,
            role: updates.role,
            bio: updates.bio,
          };

          const hasRemoteChanges = Object.values(remoteUpdates).some(
            (value) => value !== undefined
          );

          if (hasRemoteChanges) {
            try {
              const updatedRemote = await updateProfile(userId, remoteUpdates);
              const merged = mergeRemoteIntoLocal(local, updatedRemote);
              setProfile(mapLocalToProfile(merged));
            } catch (remoteErr) {
              // Local-first: keep local save successful even if remote sync fails.
              devLog.warn('[useProfile] Remote profile sync failed, keeping local changes', remoteErr);
              const queuePayload: ProfileSyncPayload = {
                userId,
                displayName: local.displayName,
                birthDate: local.birthDate,
                language: local.language,
                fontScaleIndex: local.fontScaleIndex,
                avatarUri: local.avatarUri,
                avatarUrl: local.avatarUrl,
                role: local.role,
                bio: updates.bio ?? null,
                updatedAt: new Date(local.updatedAt).toISOString(),
              };

              try {
                await syncQueueService.enqueueProfileUpsert(queuePayload);
              } catch (queueErr) {
                devLog.warn('[useProfile] Failed to enqueue profile retry after remote sync error', queueErr);
              }
            }
          }
        }
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to update profile');
      }
    },
    [resolveUserId, profile?.id, isAnonymous, mapLocalToProfile, setFontScaleIndex, systemLocale]
  );

  const uploadProfileAvatar = useCallback(
    async (imageUri: string): Promise<string | null> => {
      const resolvedUserId = await resolveUserId();
      const userId = resolvedUserId ?? profile?.id ?? null;
      if (!userId) {
        throw new Error('No active user session');
      }

      try {
        const existing = await getLocalProfile(userId);
        if (!existing) {
          await ensureLocalProfile(userId, {
            displayName: 'Storyteller',
            role: 'storyteller',
            isAnonymous,
            language: systemLocale,
            fontScaleIndex: DEFAULT_FONT_SCALE_INDEX,
          });
        }

        const local = await updateLocalProfile(userId, {
          avatarUri: imageUri,
        });

        setProfile(mapLocalToProfile(local));

        if (!isAnonymous) {
          try {
            const newAvatarUrl = await uploadAvatar(userId, imageUri);
            const updated = await updateLocalProfile(userId, {
              avatarUrl: newAvatarUrl,
            });
            setProfile(mapLocalToProfile(updated));
            return newAvatarUrl;
          } catch (remoteErr) {
            devLog.warn('[useProfile] Remote avatar upload failed, keeping local avatar uri', remoteErr);
            return null;
          }
        }

        return null;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to upload avatar');
      }
    },
    [resolveUserId, profile?.id, isAnonymous, mapLocalToProfile, systemLocale]
  );

  return {
    profile,
    isLoading,
    error,
    updateProfileData,
    uploadProfileAvatar,
    refetch: fetchProfile,
  };
}
