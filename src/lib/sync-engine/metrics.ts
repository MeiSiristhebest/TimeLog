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
    throw new Error(error.message);
  }
}

