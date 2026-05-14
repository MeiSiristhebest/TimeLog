import { supabase } from '@/lib/supabase';
import type { SyncEventInput } from '@/types/entities';

const MAX_ERROR_MESSAGE_LENGTH = 200;

function sanitizeErrorMessage(input?: string | null): string | null {
  if (!input) {
    return null;
  }

  let value = input;

  // Mask common credential patterns before persisting.
  value = value.replace(/(token|apikey|api_key|authorization)=([^&\s]+)/gi, '$1=[redacted]');
  value = value.replace(/bearer\s+[a-z0-9\-._~+/]+=*/gi, 'bearer [redacted]');

  if (value.length > MAX_ERROR_MESSAGE_LENGTH) {
    return value.slice(0, MAX_ERROR_MESSAGE_LENGTH);
  }

  return value;
}

export async function recordSyncEvent(input: SyncEventInput): Promise<void> {
  try {
    const { error } = await supabase.from('sync_events').insert([
      {
        user_id: input.userId,
        recording_id: input.recordingId ?? null,
        queue_item_id: input.queueItemId ?? null,
        event_type: input.eventType,
        bucket: input.bucket,
        storage_path: input.storagePath,
        attempt: input.attempt,
        error_message: sanitizeErrorMessage(input.errorMessage),
      },
    ]);

    if (error) {
      // Just log and don't throw to avoid blocking the caller's main logic
      console.warn('[metrics] Failed to record sync event:', error.message);
    }
  } catch (err) {
    console.warn('[metrics] Unexpected error while recording sync event:', err);
  }
}
