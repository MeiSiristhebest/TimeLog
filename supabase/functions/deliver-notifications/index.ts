/**
 * Deliver Notifications Edge Function
 *
 * Story 5.2: Smart Notification Engine (AC: 1, 2)
 *
 * This function delivers pending notifications via Expo Push Notification service.
 * Should be triggered by a cron job (e.g., every minute).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Get pending notifications scheduled for now or earlier
    const { data: pendingNotifications } = await supabase
      .from('notification_queue')
      .select('*')
      .is('delivered_at', null)
      .lte('scheduled_for', new Date().toISOString())
      .limit(100);

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ delivered: 0 }), { status: 200 });
    }

    let deliveredCount = 0;
    const errors = [];

    for (const notification of pendingNotifications) {
      try {
        // Get user's push token
        const { data: profile } = await supabase
          .from('profiles')
          .select('expo_push_token')
          .eq('id', notification.user_id)
          .single();

        if (!profile?.expo_push_token) {
          console.log(`No push token for user ${notification.user_id}`);
          // Mark as delivered anyway to avoid retry
          await supabase
            .from('notification_queue')
            .update({ delivered_at: new Date().toISOString() })
            .eq('id', notification.id);
          continue;
        }

        // Build notification message
        const message = buildNotificationMessage(notification);

        // Send via Expo Push Notification service
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: profile.expo_push_token,
            title: message.title,
            body: message.body,
            data: message.data,
            sound: 'default',
            priority: 'default',
          }),
        });

        if (response.ok) {
          // Mark as delivered
          await supabase
            .from('notification_queue')
            .update({ delivered_at: new Date().toISOString() })
            .eq('id', notification.id);

          deliveredCount++;
        } else {
          const errorText = await response.text();
          errors.push({
            notification_id: notification.id,
            error: errorText,
          });
        }
      } catch (error) {
        console.error(`Failed to deliver notification ${notification.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          notification_id: notification.id,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        delivered: deliveredCount,
        total: pendingNotifications.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delivery service error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});

function buildNotificationMessage(notification: any) {
  const count = notification.grouped_with?.length || 1;

  switch (notification.event_type) {
    case 'new_comment':
      return {
        title: 'New Comments',
        body: count === 1 ? 'Someone commented on your story' : `${count} new comments from family`,
        data: { type: 'comments', event_ids: notification.grouped_with },
      };
    case 'new_reaction':
      return {
        title: 'New Reactions',
        body:
          count === 1 ? 'Someone liked your story' : `${count} family members liked your stories`,
        data: { type: 'reactions', event_ids: notification.grouped_with },
      };
    case 'new_story':
      return {
        title: 'New Story',
        body:
          count === 1 ? 'A family member shared a new story' : `${count} new stories from family`,
        data: { type: 'stories', event_ids: notification.grouped_with },
      };
    default:
      return {
        title: 'New Activity',
        body: 'You have new family activity',
        data: { type: 'activity', event_ids: notification.grouped_with },
      };
  }
}
