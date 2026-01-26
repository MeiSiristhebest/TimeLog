import { supabase } from '@/lib/supabase';
import { AudioRecording, SyncStatus } from '@/types/entities';

/**
 * Supabase row type for audio_recordings table.
 * Maps to snake_case column names from the database.
 */
interface AudioRecordingRow {
  id: string;
  file_path: string;
  title: string | null;
  duration_ms: number;
  size_bytes: number;
  created_at: string; // ISO timestamp from Supabase
  ended_at: string | null;
  sync_status: SyncStatus;
  checksum_md5: string | null;
  topic_id: string | null;
  user_id: string;
  device_id: string | null;
  deleted_at: number | null;
}

export async function fetchFamilyStories(): Promise<AudioRecording[]> {
  const { data, error } = await supabase
    .from('audio_recordings')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as AudioRecordingRow[];

  return rows.map((item) => ({
    id: item.id,
    filePath: item.file_path,
    title: item.title,
    durationMs: item.duration_ms,
    sizeBytes: item.size_bytes,
    startedAt: new Date(item.created_at).getTime(),
    endedAt: item.ended_at ? new Date(item.ended_at).getTime() : undefined,
    syncStatus: item.sync_status,
    checksumMd5: item.checksum_md5,
    topicId: item.topic_id,
    userId: item.user_id,
    deviceId: item.device_id,
    isDeleted: !!item.deleted_at,
    deletedAt: item.deleted_at,
  }));
}
