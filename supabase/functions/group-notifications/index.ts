/**
 * Group Notifications Edge Function
 *
 * Story 5.2: Smart Notification Engine (AC: 1, 2)
 *
 * This function groups notifications within a 5-minute window and respects quiet hours.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROUPING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  try {
    const { event_type, event_id, user_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user's notification settings
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!settings?.notifications_enabled) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    // Check if within quiet hours
    const now = new Date();
    const scheduledFor = isWithinQuietHours(now, settings)
      ? getQuietHoursEndTime(now, settings)
      : now;

    // Check for recent similar events to group
    const windowStart = new Date(now.getTime() - GROUPING_WINDOW_MS);
    const { data: recentEvents } = await supabase
      .from('notification_queue')
      .select('id, event_id')
      .eq('user_id', user_id)
      .eq('event_type', event_type)
      .is('delivered_at', null)
      .gte('created_at', windowStart.toISOString());

    if (recentEvents && recentEvents.length > 0) {
      // Group with existing notification
      const existingNotification = recentEvents[0];
      const groupedEventIds = [...recentEvents.map((e) => e.event_id), event_id];

      await supabase
        .from('notification_queue')
        .update({
          grouped_with: groupedEventIds,
          scheduled_for: scheduledFor.toISOString(),
        })
        .eq('id', existingNotification.id);

      return new Response(
        JSON.stringify({ grouped: true, notification_id: existingNotification.id }),
        { status: 200 }
      );
    } else {
      // Create new notification
      const { data: newNotification } = await supabase
        .from('notification_queue')
        .insert({
          user_id,
          event_type,
          event_id,
          grouped_with: [event_id],
          scheduled_for: scheduledFor.toISOString(),
        })
        .select()
        .single();

      return new Response(JSON.stringify({ created: true, notification_id: newNotification.id }), {
        status: 200,
      });
    }
  } catch (error) {
    console.error('Notification grouping error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

function isWithinQuietHours(
  now: Date,
  settings: { quiet_hours_start: string; quiet_hours_end: string; time_zone: string }
): boolean {
  if (!settings.quiet_hours_start || !settings.quiet_hours_end) {
    return false;
  }

  // Convert to user's local time
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: settings.time_zone }));
  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = settings.quiet_hours_start.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;

  const [endHour, endMinute] = settings.quiet_hours_end.split(':').map(Number);
  const endMinutes = endHour * 60 + endMinute;

  // Handle overnight quiet hours (e.g., 21:00 - 09:00)
  if (startMinutes > endMinutes) {
    return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
  } else {
    return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
  }
}

function getQuietHoursEndTime(
  now: Date,
  settings: { quiet_hours_end: string; time_zone: string }
): Date {
  const [endHour, endMinute] = settings.quiet_hours_end.split(':').map(Number);

  const userTime = new Date(now.toLocaleString('en-US', { timeZone: settings.time_zone }));

  const endTime = new Date(userTime);
  endTime.setHours(endHour, endMinute, 0, 0);

  // If end time is earlier than current time, schedule for next day
  if (endTime <= userTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return endTime;
}
