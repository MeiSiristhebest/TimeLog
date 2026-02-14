import * as FileSystem from 'expo-file-system/legacy';
import { db } from '@/db/client';
import {
  activityEvents,
  appSettings,
  audioRecordings,
  familyQuestions,
  localProfiles,
  storyReactions,
  syncQueue,
  transcriptSegments,
} from '@/db/schema';
import { mmkv } from '@/lib/mmkv';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import { signOut } from '@/features/auth/services/authService';
import { clearStoredRole } from '@/features/auth/services/roleStorage';
import { getCurrentUserId } from '@/features/auth/services/sessionService';

const FS = FileSystem as typeof FileSystem & {
  documentDirectory?: string | null;
  cacheDirectory?: string | null;
};

type LocalRecordingRow = {
  id: string;
  filePath: string;
};

type DeleteAccountResult = {
  warnings: string[];
};

type HardDeleteAccountResponse = {
  success: boolean;
  deletedUserId: string;
  warnings?: string[];
};

function isLocalFilePath(path: string): boolean {
  return path.startsWith('file://') || path.includes(':/');
}

function getAnalysisPath(filePath: string): string {
  if (filePath.toLowerCase().endsWith('.wav')) {
    return filePath.replace(/\.wav$/i, '.analysis.json');
  }
  return `${filePath}.analysis.json`;
}

async function deleteLocalRecordingFiles(recordings: LocalRecordingRow[]): Promise<void> {
  for (const recording of recordings) {
    if (!recording.filePath || recording.filePath === 'OFFLOADED' || !isLocalFilePath(recording.filePath)) {
      continue;
    }

    await FileSystem.deleteAsync(recording.filePath, { idempotent: true }).catch((error: unknown) => {
      devLog.warn('[accountDeletionService] Failed to delete local recording file', error);
    });

    await FileSystem.deleteAsync(getAnalysisPath(recording.filePath), { idempotent: true }).catch(
      (error: unknown) => {
        devLog.warn('[accountDeletionService] Failed to delete local analysis cache', error);
      }
    );
  }

  const normalizedBaseDir = FS.documentDirectory ?? FS.cacheDirectory;
  if (!normalizedBaseDir) return;

  const recordingsDir = `${normalizedBaseDir}recordings/`;
  await FileSystem.deleteAsync(recordingsDir, { idempotent: true }).catch((error: unknown) => {
    devLog.warn('[accountDeletionService] Failed to delete recordings directory', error);
  });
}

async function purgeLocalDatabase(): Promise<void> {
  await db.delete(activityEvents);
  await db.delete(storyReactions);
  await db.delete(transcriptSegments);
  await db.delete(familyQuestions);
  await db.delete(syncQueue);
  await db.delete(audioRecordings);
  await db.delete(localProfiles);
  await db.delete(appSettings);
}

async function invokeRemoteHardDelete(userId: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke<HardDeleteAccountResponse>(
    'hard-delete-account',
    {
      body: { userId },
    }
  );

  if (error) {
    throw new Error(`remote hard-delete failed: ${error.message}`);
  }

  if (!data?.success) {
    throw new Error('remote hard-delete failed: server did not confirm success');
  }

  if (data.deletedUserId !== userId) {
    throw new Error('remote hard-delete failed: mismatched user id in server response');
  }

  return data.warnings ?? [];
}

export async function deleteAccountData(): Promise<DeleteAccountResult> {
  const warnings: string[] = [];
  const userId = await getCurrentUserId();

  if (userId) {
    const remoteWarnings = await invokeRemoteHardDelete(userId);
    warnings.push(...remoteWarnings);
  } else {
    warnings.push('no active user id; skipped remote hard delete');
  }

  const localRecordings = await db
    .select({
      id: audioRecordings.id,
      filePath: audioRecordings.filePath,
    })
    .from(audioRecordings);

  await deleteLocalRecordingFiles(localRecordings as LocalRecordingRow[]);
  await purgeLocalDatabase();

  mmkv.clearAll();

  try {
    await signOut();
  } catch (error) {
    warnings.push(error instanceof Error ? `sign out failed: ${error.message}` : 'sign out failed');
  }

  await clearStoredRole().catch((error: unknown) => {
    warnings.push(error instanceof Error ? `role cleanup failed: ${error.message}` : 'role cleanup failed');
  });

  return { warnings };
}
