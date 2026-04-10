import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getFamilyMemberRowIdsForCleanup,
  type FamilyMemberContractRow,
} from '../_shared/family-contract.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUDIO_STORAGE_BUCKET = 'audio-recordings';
const STORAGE_REMOVE_CHUNK_SIZE = 50;

type RemoteRecordingRow = {
  id: string;
  file_path: string | null;
};

type FamilyMemberCleanupRow = {
  id: string;
  family_id: string;
  user_id: string | null;
  invited_by: string | null;
  status: string;
};

type HardDeleteResponse = {
  success: boolean;
  deletedUserId: string;
  warnings: string[];
};

function isMissingRelationError(message: string): boolean {
  return message.includes('relation') && message.includes('does not exist');
}

function toStoragePath(recording: RemoteRecordingRow, userId: string): string[] {
  if (recording.file_path) {
    const normalized = recording.file_path.replace(/^recordings\//, '').trim();
    if (normalized) return [normalized];
  }

  return [
    `${userId}/${recording.id}.opus`,
    `${userId}/${recording.id}.wav`,
    `${recording.id}.opus`,
    `${recording.id}.wav`,
  ];
}

async function deleteRemoteStorageObjects(
  adminClient: ReturnType<typeof createClient>,
  paths: string[]
): Promise<void> {
  for (let index = 0; index < paths.length; index += STORAGE_REMOVE_CHUNK_SIZE) {
    const chunk = paths.slice(index, index + STORAGE_REMOVE_CHUNK_SIZE);
    const { error } = await adminClient.storage.from(AUDIO_STORAGE_BUCKET).remove(chunk);
    if (error) {
      throw new Error(error.message);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Supabase environment variables are not fully configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Invalid authorization header');
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !authUser) {
      throw new Error('Invalid JWT');
    }

    const body = await req.json().catch(() => ({})) as { userId?: string };
    const requestedUserId = body.userId ?? authUser.id;
    if (requestedUserId !== authUser.id) {
      throw new Error('Forbidden: requested user does not match authenticated user');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const warnings: string[] = [];

    const { data: remoteRecordings, error: recordingsError } = await adminClient
      .from('audio_recordings')
      .select('id, file_path')
      .eq('user_id', requestedUserId);

    if (recordingsError) {
      warnings.push(`audio_recordings lookup failed: ${recordingsError.message}`);
    }

    const storagePaths = Array.from(
      new Set(
        ((remoteRecordings ?? []) as RemoteRecordingRow[]).flatMap((recording) =>
          toStoragePath(recording, requestedUserId)
        )
      )
    );

    if (storagePaths.length > 0) {
      try {
        await deleteRemoteStorageObjects(adminClient, storagePaths);
      } catch (error) {
        warnings.push(
          error instanceof Error ? `storage cleanup failed: ${error.message}` : 'storage cleanup failed'
        );
      }
    }

    const deleteTasks: { label: string; run: () => Promise<void> }[] = [
      {
        label: 'family_members',
        run: async () => {
          const { data, error } = await adminClient
            .from('family_members')
            .select('id, family_id, user_id, invited_by, status')
            .or(
              `family_id.eq.${requestedUserId},user_id.eq.${requestedUserId},invited_by.eq.${requestedUserId}`
            );

          if (error) throw new Error(error.message);

          const rowIds = getFamilyMemberRowIdsForCleanup(
            ((data ?? []) as FamilyMemberCleanupRow[]).map((row) => ({
              id: row.id,
              family_id: row.family_id,
              user_id: row.user_id,
              invited_by: row.invited_by,
              status: row.status,
            })) as FamilyMemberContractRow[],
            requestedUserId
          );

          if (rowIds.length === 0) {
            return;
          }

          const { error: deleteError } = await adminClient
            .from('family_members')
            .delete()
            .in('id', rowIds);

          if (deleteError) throw new Error(deleteError.message);
        },
      },
      {
        label: 'story_comments',
        run: async () => {
          const { error } = await adminClient.from('story_comments').delete().eq('user_id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'story_reactions',
        run: async () => {
          const { error } = await adminClient.from('story_reactions').delete().eq('user_id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'activity_events',
        run: async () => {
          const { error } = await adminClient
            .from('activity_events')
            .delete()
            .or(`actor_user_id.eq.${requestedUserId},target_user_id.eq.${requestedUserId}`);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'sync_events',
        run: async () => {
          const { error } = await adminClient.from('sync_events').delete().eq('user_id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'family_questions',
        run: async () => {
          const { error } = await adminClient
            .from('family_questions')
            .delete()
            .or(`family_user_id.eq.${requestedUserId},senior_user_id.eq.${requestedUserId}`);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'family_connections',
        run: async () => {
          const { error } = await adminClient
            .from('family_connections')
            .delete()
            .or(`member_id.eq.${requestedUserId},senior_id.eq.${requestedUserId}`);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'notification_queue',
        run: async () => {
          const { error } = await adminClient.from('notification_queue').delete().eq('user_id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'user_notification_settings',
        run: async () => {
          const { error } = await adminClient
            .from('user_notification_settings')
            .delete()
            .eq('user_id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'user_push_tokens',
        run: async () => {
          const { error } = await adminClient.from('user_push_tokens').delete().eq('user_id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'user_settings',
        run: async () => {
          const { error } = await adminClient.from('user_settings').delete().eq('user_id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'audio_recordings',
        run: async () => {
          const { error } = await adminClient.from('audio_recordings').delete().eq('user_id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
      {
        label: 'profiles',
        run: async () => {
          const { error } = await adminClient.from('profiles').delete().eq('id', requestedUserId);
          if (error) throw new Error(error.message);
        },
      },
    ];

    for (const task of deleteTasks) {
      try {
        await task.run();
      } catch (error) {
        const message = error instanceof Error ? error.message : `${task.label} cleanup failed`;
        if (isMissingRelationError(message)) {
          warnings.push(`${task.label} table missing`);
          continue;
        }
        throw new Error(`${task.label} cleanup failed: ${message}`);
      }
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(requestedUserId);
    if (deleteUserError) {
      throw new Error(`auth user delete failed: ${deleteUserError.message}`);
    }

    const response: HardDeleteResponse = {
      success: true,
      deletedUserId: requestedUserId,
      warnings,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
