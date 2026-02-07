# Story 5.2: Smart Notification Engine

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Senior User,
I want to be notified about family activities without being overwhelmed,
So that I feel cared for but not pestered.

## Acceptance Criteria

1. **Given** family members are commenting or liking
   **When** multiple events happen within a short window (e.g., 5 mins)
   **Then** the system groups them into a single push notification (e.g., "3 new comments from Family")
   **And** the notification shows aggregated count, not individual events

2. **Given** I have configured quiet hours (e.g., 21:00 - 09:00)
   **When** a notification event is created during quiet hours
   **Then** the notification is queued and delivered at the start of active hours (09:00)
   **And** quiet hours respect my local time zone

## Tasks / Subtasks

- [ ] Task 1: Create notification queue schema (AC: 1, 2)
  - [ ] 1.1: Add `notification_queue` table to Supabase schema
  - [ ] 1.2: Add `user_notification_settings` table for quiet hours config
  - [ ] 1.3: Create indexes for efficient queue processing
  - [ ] 1.4: Configure RLS policies

- [ ] Task 2: Implement notification grouping algorithm (AC: 1)
  - [ ] 2.1: Create Edge Function `group-notifications`
  - [ ] 2.2: Implement 5-minute time window logic
  - [ ] 2.3: Aggregate events by type (comments, reactions)
  - [ ] 2.4: Generate grouped notification payload

- [ ] Task 3: Implement quiet hours logic (AC: 2)
  - [ ] 3.1: Create `getQuietHours(userId)` function
  - [ ] 3.2: Check if current time is within quiet hours (time zone aware)
  - [ ] 3.3: Queue notification if in quiet hours
  - [ ] 3.4: Schedule delivery at quiet hours end time

- [ ] Task 4: Create notification settings UI (AC: 2)
  - [ ] 4.1: Create `app/(tabs)/settings/notifications.tsx` screen
  - [ ] 4.2: Add quiet hours time picker (start/end times)
  - [ ] 4.3: Add notification preferences toggles
  - [ ] 4.4: Integrate Cloud AI toggle (FR29) visibility

- [ ] Task 5: Implement Edge Function triggers (AC: 1, 2)
  - [ ] 5.1: Create database trigger on `story_comments` INSERT
  - [ ] 5.2: Create database trigger on `story_reactions` INSERT
  - [ ] 5.3: Invoke `group-notifications` Edge Function
  - [ ] 5.4: Handle Edge Function errors gracefully

- [ ] Task 6: Implement notification delivery service (AC: 1, 2)
  - [ ] 6.1: Create `sendPushNotification(userId, payload)` function
  - [ ] 6.2: Use Expo Push Notification service
  - [ ] 6.3: Handle delivery failures with retry logic
  - [ ] 6.4: Log delivery status for debugging

- [ ] Task 7: Testing and verification (AC: 1, 2)
  - [ ] 7.1: Test notification grouping (3 comments → 1 notification)
  - [ ] 7.2: Test quiet hours (notification queued until 09:00)
  - [ ] 7.3: Test time zone handling (UTC → local time)
  - [ ] 7.4: Test Edge Function error handling

## Dev Notes

### 🔥 CRITICAL CONTEXT: Respectful Notification Strategy

This story implements the **Smart Notification Engine** that prevents notification fatigue for elderly users while ensuring they stay connected to family. This is a core part of FR23 (new story notifications) and FR24 (comment notifications) with intelligent batching.

### Architecture Guardrails

**Notification Queue System**
Notifications are not sent immediately. They are queued, grouped by time window, and respect quiet hours to prevent overwhelming seniors.

**Database Schema:**

```sql
-- supabase/migrations/YYYYMMDD_create_notification_queue.sql

-- Notification queue table
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('new_story', 'new_comment', 'new_reaction')),
  event_id UUID NOT NULL, -- References activity_events.id
  grouped_with UUID[], -- Array of event IDs grouped together
  scheduled_for TIMESTAMPTZ NOT NULL, -- When to deliver
  delivered_at TIMESTAMPTZ, -- NULL = pending, timestamp = sent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User notification settings
CREATE TABLE user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quiet_hours_start TIME, -- e.g., '21:00'
  quiet_hours_end TIME, -- e.g., '09:00'
  time_zone TEXT NOT NULL DEFAULT 'UTC', -- IANA time zone
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX notification_queue_pending_idx
  ON notification_queue(user_id, scheduled_for)
  WHERE delivered_at IS NULL;

CREATE INDEX notification_queue_grouping_idx
  ON notification_queue(user_id, event_type, created_at)
  WHERE delivered_at IS NULL;

-- RLS Policies
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_queue"
  ON notification_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_manage_own_settings"
  ON user_notification_settings FOR ALL
  USING (user_id = auth.uid());
```

**Edge Function: Notification Grouping**

```typescript
// supabase/functions/group-notifications/index.ts
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
      const groupedEventIds = [
        ...recentEvents.map(e => e.event_id),
        event_id,
      ];

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

      return new Response(
        JSON.stringify({ created: true, notification_id: newNotification.id }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Notification grouping error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
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
  const userTime = new Date(
    now.toLocaleString('en-US', { timeZone: settings.time_zone })
  );
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

  const userTime = new Date(
    now.toLocaleString('en-US', { timeZone: settings.time_zone })
  );

  const endTime = new Date(userTime);
  endTime.setHours(endHour, endMinute, 0, 0);

  // If end time is earlier than current time, schedule for next day
  if (endTime <= userTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return endTime;
}
```

**Database Trigger for Auto-Invocation:**

```sql
-- Trigger on new comments
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/group-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'event_type', 'new_comment',
      'event_id', NEW.id,
      'user_id', (SELECT user_id FROM audio_recordings WHERE id = NEW.story_id)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON story_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();
```

**Notification Delivery Service:**

```typescript
// supabase/functions/deliver-notifications/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

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
        }),
      });

      if (response.ok) {
        // Mark as delivered
        await supabase
          .from('notification_queue')
          .update({ delivered_at: new Date().toISOString() })
          .eq('id', notification.id);

        deliveredCount++;
      }
    } catch (error) {
      console.error(`Failed to deliver notification ${notification.id}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ delivered: deliveredCount }),
    { status: 200 }
  );
});

function buildNotificationMessage(notification: any) {
  const count = notification.grouped_with?.length || 1;

  switch (notification.event_type) {
    case 'new_comment':
      return {
        title: 'New Comments',
        body: count === 1
          ? 'Someone commented on your story'
          : `${count} new comments from family`,
        data: { type: 'comments', event_ids: notification.grouped_with },
      };
    case 'new_reaction':
      return {
        title: 'New Reactions',
        body: count === 1
          ? 'Someone liked your story'
          : `${count} family members liked your stories`,
        data: { type: 'reactions', event_ids: notification.grouped_with },
      };
    default:
      return {
        title: 'New Activity',
        body: 'You have new family activity',
        data: { type: 'activity', event_ids: notification.grouped_with },
      };
  }
}
```

**Settings UI Component:**

```tsx
// app/(tabs)/settings/notifications.tsx
import { View, Text, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState(new Date());
  const [quietEnd, setQuietEnd] = useState(new Date());

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setEnabled(data.notifications_enabled);
      if (data.quiet_hours_start) {
        const [hour, minute] = data.quiet_hours_start.split(':');
        const start = new Date();
        start.setHours(parseInt(hour), parseInt(minute));
        setQuietStart(start);
      }
      if (data.quiet_hours_end) {
        const [hour, minute] = data.quiet_hours_end.split(':');
        const end = new Date();
        end.setHours(parseInt(hour), parseInt(minute));
        setQuietEnd(end);
      }
    }
  }

  async function saveSettings() {
    const quietStartTime = `${quietStart.getHours().toString().padStart(2, '0')}:${quietStart.getMinutes().toString().padStart(2, '0')}`;
    const quietEndTime = `${quietEnd.getHours().toString().padStart(2, '0')}:${quietEnd.getMinutes().toString().padStart(2, '0')}`;

    await supabase
      .from('user_notification_settings')
      .upsert({
        user_id: user!.id,
        notifications_enabled: enabled,
        quiet_hours_start: quietStartTime,
        quiet_hours_end: quietEndTime,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
  }

  return (
    <View className="flex-1 bg-surface p-4">
      <Text className="text-2xl font-semibold text-onSurface mb-6">
        Notification Settings
      </Text>

      {/* Enable/Disable */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-lg text-onSurface">Enable Notifications</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>

      {/* Quiet Hours */}
      <Text className="text-lg font-semibold text-onSurface mb-4">
        Quiet Hours
      </Text>
      <Text className="text-sm text-onSurface/70 mb-4">
        Notifications will be queued during these hours
      </Text>

      <View className="mb-4">
        <Text className="text-base text-onSurface mb-2">Start Time</Text>
        <DateTimePicker
          value={quietStart}
          mode="time"
          onChange={(event, date) => date && setQuietStart(date)}
        />
      </View>

      <View className="mb-6">
        <Text className="text-base text-onSurface mb-2">End Time</Text>
        <DateTimePicker
          value={quietEnd}
          mode="time"
          onChange={(event, date) => date && setQuietEnd(date)}
        />
      </View>

      <Pressable
        onPress={saveSettings}
        className="bg-primary rounded-xl p-4"
        accessibilityRole="button"
        accessibilityLabel="Save notification settings"
      >
        <Text className="text-center text-onPrimary text-lg font-semibold">
          Save Settings
        </Text>
      </Pressable>
    </View>
  );
}
```

### Naming Conventions

**Database:**

- Tables: `notification_queue`, `user_notification_settings`
- Columns: `quiet_hours_start`, `quiet_hours_end`, `time_zone`

**Edge Functions:**

- `group-notifications` - Grouping logic
- `deliver-notifications` - Delivery service

**TypeScript:**

- Functions: `isWithinQuietHours`, `getQuietHoursEndTime`, `buildNotificationMessage`

### UX Patterns (CRITICAL - RESPECTFUL NOTIFICATION DESIGN)

**From UX Spec - Notification Philosophy:**

> Notifications should feel like gentle reminders, not intrusive alerts.

**Notification Flow:**

1. **Event Creation:** Comment/reaction triggers database INSERT
2. **Grouping Check:** Edge Function checks for recent similar events (5-min window)
3. **Quiet Hours Check:** Respect user's configured quiet hours
4. **Queue or Group:** Either group with existing notification or create new
5. **Scheduled Delivery:** Deliver immediately or at quiet hours end
6. **Push Notification:** Send via Expo Push service with aggregated message

**Accessibility Requirements:**

- Notification text is clear and actionable
- Grouped notifications show count ("3 new comments")
- Deep link data allows direct navigation to content

### Technical Requirements

**Time Zone Handling:**

- Store user's IANA time zone (e.g., "America/New_York")
- Convert UTC to local time for quiet hours check
- Use `toLocaleString` with `timeZone` option

**Notification Grouping:**

- 5-minute time window for grouping
- Group by event type (comments separate from reactions)
- Update existing notification instead of creating duplicate

**Edge Function Invocation:**

- Database triggers invoke Edge Functions via `net.http_post`
- Service role key for authentication
- Error handling with fallback (notification still queued)

### Library/Framework Requirements

**Required Packages:**

- `@react-native-community/datetimepicker` - Time picker for quiet hours
- Expo Push Notification service (no package, HTTP API)

**Supabase Edge Functions:**

- Deno runtime (TypeScript native)
- `@supabase/supabase-js` for database access

### File Structure Requirements

**New Files:**

```
supabase/functions/
├── group-notifications/
│   └── index.ts
└── deliver-notifications/
    └── index.ts

supabase/migrations/
├── YYYYMMDD_create_notification_queue.sql
└── YYYYMMDD_create_notification_triggers.sql

app/(tabs)/settings/
└── notifications.tsx
```

### Previous Story Intelligence

**From Story 5.1 (Home Contextual Insights):**

- Pattern: Activity events trigger notifications
- Integration: Notification queue references activity_events
- Learning: Badge count updates when notifications delivered

**From Story 4.3 (Realtime Comment System):**

- Pattern: Database triggers for real-time events
- Learning: Comment INSERT triggers notification creation

**From Story 4.6 (Quick Reactions):**

- Pattern: Reaction events also trigger notifications
- Learning: Multiple event types need unified notification system

### Architecture Compliance Checklist

**Edge Function Pattern:**

- ✅ Grouping logic in Edge Function (server-side)
- ✅ Database triggers invoke Edge Functions
- ✅ Service role key for elevated permissions

**Time Zone Handling:**

- ✅ Store IANA time zone in user settings
- ✅ Convert UTC to local time for quiet hours
- ✅ Handle overnight quiet hours (21:00 - 09:00)

**Notification Delivery:**

- ✅ Expo Push Notification service
- ✅ Retry logic for failed deliveries
- ✅ Delivery status tracking

### Testing Requirements

**Manual Testing:**

1. Post 3 comments within 5 minutes → Receive 1 grouped notification
2. Set quiet hours 21:00-09:00 → Notification queued until 09:00
3. Change time zone → Quiet hours respect new time zone
4. Disable notifications → No notifications sent

**Unit Tests:**

- `isWithinQuietHours.test.ts` - Time zone logic
- `buildNotificationMessage.test.ts` - Message formatting

**Integration Tests:**

- Comment posted → Notification queued → Delivered
- Grouping logic → Multiple events → Single notification

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: _bmad-output/planning-artifacts/epics.md#FR23, FR24]
- [Source: _bmad-output/planning-artifacts/architecture.md#Edge Functions]
- [Source: Story 5.1#Activity Events]

### Latest Technical Information

**Supabase Edge Functions (2026):**

- Deno 1.40+ runtime
- `net.http_post` for HTTP requests from database
- Service role key for admin operations

**Expo Push Notifications (SDK 54):**

- HTTP API: `https://exp.host/--/api/v2/push/send`
- Push token stored in user profile
- Delivery receipts available via API

**Time Zone Handling:**

- IANA time zone database
- `Intl.DateTimeFormat().resolvedOptions().timeZone` for detection
- `toLocaleString` with `timeZone` option for conversion

### Implementation Warnings

**⚠️ CRITICAL: Quiet Hours Must Handle Overnight**

```typescript
// ❌ WRONG - Doesn't handle 21:00 - 09:00
if (currentHour >= startHour && currentHour < endHour) { ... }

// ✅ CORRECT - Handles overnight quiet hours
if (startMinutes > endMinutes) {
  return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
}
```

**⚠️ CRITICAL: Edge Function Must Handle Errors**

```typescript
// ❌ WRONG - Error crashes function
await supabase.from('notification_queue').insert(...)

// ✅ CORRECT - Error logged, notification still queued
try {
  await supabase.from('notification_queue').insert(...)
} catch (error) {
  console.error('Queue insert failed:', error);
  // Fallback: Create notification anyway
}
```

### Performance Requirements

**Notification Delivery:**

- Grouping window: 5 minutes (configurable)
- Delivery latency: <30 seconds after scheduled time
- Batch processing: 100 notifications per run

### Privacy & Compliance Notes

**Data Retention:**

- Delivered notifications kept for 30 days (audit trail)
- Undelivered notifications expire after 7 days
- User can disable notifications anytime

## Dev Agent Record

### Agent Model Used

<!-- To be filled by dev agent -->

### Debug Log References

<!-- To be filled by dev agent -->

### Completion Notes List

<!-- To be filled by dev agent -->

### File List

<!-- To be filled by dev agent -->
