/**
 * Send Push Notification Edge Function
 *
 * Triggers push notifications via Expo Push API when:
 * - New story is uploaded (notify family members)
 * - New comment is posted (notify story owner)
 *
 * Story 4.4: Push Notification & Deep Link (AC: 1, 5)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getAcceptedFamilyRecipientIds,
  type FamilyMemberContractRow,
} from '../_shared/family-contract.ts';

const DEFAULT_EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function getExpoPushUrl(): string {
  const configured = Deno.env.get('EXPO_PUSH_URL')?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_EXPO_PUSH_URL;
}

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface RequestPayload {
  record: Record<string, unknown>;
  type: 'new_story' | 'new_comment';
  old_record?: Record<string, unknown>;
}

interface FamilyMemberRecipientRow {
  id: string;
  family_id: string;
  user_id: string | null;
  status: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: RequestPayload = await req.json();
    const { record, type } = payload;

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let recipients: string[] = [];
    let title = '';
    let body = '';
    let data: Record<string, unknown> = {};

    if (type === 'new_story') {
      // Get family members linked to this senior user
      const seniorUserId = record.user_id as string;
      const storyId = record.id as string;
      const storyTitle = (record.title as string) || '';

      const { data: familyMembers, error: familyError } = await supabase
        .from('family_members')
        .select('id, family_id, user_id, status')
        .eq('family_id', seniorUserId)
        .eq('status', 'accepted');

      if (familyError) {
        console.error('Error fetching family members:', familyError);
        throw familyError;
      }

      if (familyMembers && familyMembers.length > 0) {
        const userIds = getAcceptedFamilyRecipientIds(
          familyMembers as FamilyMemberRecipientRow[] as FamilyMemberContractRow[],
          seniorUserId
        );

        if (userIds.length > 0) {
          // Get push tokens for family members
          const { data: tokens, error: tokensError } = await supabase
            .from('user_push_tokens')
            .select('push_token')
            .in('user_id', userIds);

          if (tokensError) {
            console.error('Error fetching push tokens:', tokensError);
            throw tokensError;
          }

          recipients = tokens?.map((t) => t.push_token) || [];
        }
      }

      // English notification content
      title = 'New Story!';
      body = storyTitle || 'A new story has just been recorded';
      data = {
        storyId,
        type: 'new_story',
      };
    } else if (type === 'new_comment') {
      // Notify the story owner (senior) about new comment
      const storyId = record.story_id as string;
      const commenterId = record.user_id as string;

      // Get story details
      const { data: story, error: storyError } = await supabase
        .from('audio_recordings')
        .select('user_id, title')
        .eq('id', storyId)
        .single();

      if (storyError) {
        console.error('Error fetching story:', storyError);
        throw storyError;
      }

      if (story) {
        // Don't notify if commenter is the story owner
        if (story.user_id === commenterId) {
          return new Response(
            JSON.stringify({ sent: 0, reason: 'Self-comment, no notification needed' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Get push tokens for story owner
        const { data: tokens, error: tokensError } = await supabase
          .from('user_push_tokens')
          .select('push_token')
          .eq('user_id', story.user_id);

        if (tokensError) {
          console.error('Error fetching push tokens:', tokensError);
          throw tokensError;
        }

        recipients = tokens?.map((t) => t.push_token) || [];

        // English notification content
        title = 'New Comment';
        body = `A family member commented on "${story.title || 'your story'}"`;
        data = {
          storyId,
          type: 'new_comment',
        };
      }
    } else {
      return new Response(JSON.stringify({ error: 'Unknown notification type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notifications via Expo Push API
    if (recipients.length > 0) {
      const messages: PushMessage[] = recipients.map((token) => ({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      }));

      const pushResponse = await fetch(getExpoPushUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!pushResponse.ok) {
        const errorText = await pushResponse.text();
        console.error('Expo Push API error:', errorText);
        throw new Error(`Expo Push API failed: ${pushResponse.status}`);
      }

      const pushResult = await pushResponse.json();
      console.log('Push notifications sent:', pushResult);

      return new Response(
        JSON.stringify({
          sent: recipients.length,
          result: pushResult,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        sent: 0,
        reason: 'No recipients found',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
