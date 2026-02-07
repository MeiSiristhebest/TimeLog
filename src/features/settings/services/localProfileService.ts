import { db } from '@/db/client';
import { localProfiles } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export type LocalProfile = {
  id: string;
  displayName: string | null;
  birthDate: string | null;
  language: string | null;
  fontScaleIndex: number | null;
  avatarUri: string | null;
  avatarUrl: string | null;
  role: 'storyteller' | 'family';
  isAnonymous: boolean;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

export type LocalProfileUpdate = Partial<
  Pick<
    LocalProfile,
    | 'displayName'
    | 'birthDate'
    | 'language'
    | 'fontScaleIndex'
    | 'avatarUri'
    | 'avatarUrl'
    | 'role'
    | 'isAnonymous'
  >
> & { updatedAt?: number };

function mapRow(row: typeof localProfiles.$inferSelect): LocalProfile {
  return {
    id: row.id,
    displayName: row.displayName ?? null,
    birthDate: row.birthDate ?? null,
    language: row.language ?? null,
    fontScaleIndex: row.fontScaleIndex ?? null,
    avatarUri: row.avatarUri ?? null,
    avatarUrl: row.avatarUrl ?? null,
    role: row.role ?? 'storyteller',
    isAnonymous: Boolean(row.isAnonymous),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getLocalProfile(userId: string): Promise<LocalProfile | null> {
  const row = await db.query.localProfiles.findFirst({
    where: eq(localProfiles.id, userId),
  });
  return row ? mapRow(row) : null;
}

export async function getLatestLocalProfile(): Promise<LocalProfile | null> {
  const row = await db.query.localProfiles.findFirst({
    orderBy: [desc(localProfiles.updatedAt)],
  });
  return row ? mapRow(row) : null;
}

export async function upsertLocalProfile(profile: LocalProfile): Promise<LocalProfile> {
  await db
    .insert(localProfiles)
    .values(profile)
    .onConflictDoUpdate({
      target: localProfiles.id,
      set: {
        displayName: profile.displayName,
        birthDate: profile.birthDate,
        language: profile.language,
        fontScaleIndex: profile.fontScaleIndex,
        avatarUri: profile.avatarUri,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        isAnonymous: profile.isAnonymous,
        updatedAt: profile.updatedAt,
      },
    });

  const fresh = await getLocalProfile(profile.id);
  if (!fresh) {
    throw new Error('Failed to persist local profile');
  }
  return fresh;
}

export async function updateLocalProfile(
  userId: string,
  updates: LocalProfileUpdate
): Promise<LocalProfile> {
  const now = updates.updatedAt ?? Date.now();
  const setValues = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  await db
    .update(localProfiles)
    .set({
      ...setValues,
      updatedAt: now,
    })
    .where(eq(localProfiles.id, userId));

  const updated = await getLocalProfile(userId);
  if (!updated) {
    throw new Error('Local profile not found');
  }
  return updated;
}

export async function ensureLocalProfile(
  userId: string,
  defaults: Partial<LocalProfile> = {}
): Promise<LocalProfile> {
  const existing = await getLocalProfile(userId);
  if (existing) return existing;

  const now = Date.now();
  const profile: LocalProfile = {
    id: userId,
    displayName: defaults.displayName ?? null,
    birthDate: defaults.birthDate ?? null,
    language: defaults.language ?? null,
    fontScaleIndex: defaults.fontScaleIndex ?? null,
    avatarUri: defaults.avatarUri ?? null,
    avatarUrl: defaults.avatarUrl ?? null,
    role: defaults.role ?? 'storyteller',
    isAnonymous: defaults.isAnonymous ?? true,
    createdAt: defaults.createdAt ?? now,
    updatedAt: defaults.updatedAt ?? now,
  };

  return upsertLocalProfile(profile);
}
