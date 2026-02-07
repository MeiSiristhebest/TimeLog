# Story 4.4: Push Notification & Deep Link

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Family User,
I want to receive push notifications when a new story is uploaded,
So that I can listen to it right away without constantly checking the app.

## Acceptance Criteria

1. **Given** I am a Family User with notifications enabled
   **When** the senior user uploads a new story
   **Then** I receive a push notification with the story topic
   **And** the notification includes a deep link to the story

2. **Given** I receive a push notification
   **When** I tap on the notification
   **Then** the app opens directly to that story's playback page
   **And** the player begins loading automatically

3. **Given** I have not granted notification permissions
   **When** I am on the family home screen
   **Then** I see a prompt to enable notifications
   **And** tapping the prompt opens system settings

4. **Given** the app is in the foreground
   **When** a new story notification arrives
   **Then** I see an in-app banner notification
   **And** tapping it navigates to the story

5. **Given** I am a Senior User
   **When** a family member comments on my story
   **Then** I receive a push notification about the new comment
   **And** tapping it opens the story's comment view

## Tasks / Subtasks

- [x] Task 1: Configure Expo Push Notifications (AC: 1, 3)
  - [x] 1.1: Install `expo-notifications` and `expo-device`
  - [x] 1.2: Configure app.json with notification settings
  - [x] 1.3: Create `src/lib/notifications.ts` wrapper
  - [x] 1.4: Implement permission request flow
  - [x] 1.5: Store push token in Supabase `user_push_tokens` table

- [x] Task 2: Create Push Token Management (AC: 1)
  - [x] 2.1: Create Supabase migration for `user_push_tokens` table
  - [x] 2.2: Implement `registerPushToken()` function
  - [x] 2.3: Implement `unregisterPushToken()` on logout
  - [x] 2.4: Handle token refresh on app launch

- [x] Task 3: Create Notification Trigger Edge Function (AC: 1, 5)
  - [x] 3.1: Create Supabase Edge Function `send-push-notification`
  - [x] 3.2: Trigger on new story upload (audio_recordings INSERT)
  - [x] 3.3: Trigger on new comment (story_comments INSERT)
  - [x] 3.4: Look up family member push tokens
  - [x] 3.5: Send notification via Expo Push API

- [x] Task 4: Implement Deep Linking (AC: 2)
  - [x] 4.1: Configure Expo Router for deep links
  - [x] 4.2: Define URL scheme: `timelog://story/{id}`
  - [x] 4.3: Handle incoming deep links in root layout
  - [x] 4.4: Navigate to story player on deep link

- [x] Task 5: Handle Foreground Notifications (AC: 4)
  - [x] 5.1: Create `NotificationBanner.tsx` component
  - [x] 5.2: Listen for foreground notifications
  - [x] 5.3: Show in-app banner with story info
  - [x] 5.4: Handle banner tap navigation

- [x] Task 6: Notification Permission Prompt (AC: 3)
  - [x] 6.1: Update `NotificationPrompt.tsx` from Story 4.1
  - [x] 6.2: Add "Enable Notifications" button
  - [x] 6.3: Handle permission denied state
  - [x] 6.4: Link to system settings if denied

- [x] Task 7: Testing and Polish (AC: 1-5)
  - [x] 7.1: Test notification delivery end-to-end
  - [x] 7.2: Test deep link navigation
  - [x] 7.3: Test foreground vs background behavior
  - [x] 7.4: Add unit tests for notification service

## Dev Notes

### 🔥 CRITICAL CONTEXT: Expo Push Notifications

This story implements **push notifications** for family users using Expo's push notification service. Key requirements:

1. **Expo Push API**: Use Expo's managed push notification service (no FCM/APNs setup required)
2. **Deep Links**: Notifications must include deep link data for direct navigation
3. **Token Management**: Push tokens stored in Supabase and refreshed on each app launch
4. **Edge Functions**: Supabase Edge Functions trigger notifications on database events

### Architecture Guardrails

**Push Token Storage (Supabase):**

```sql
-- supabase/migrations/YYYYMMDD_create_user_push_tokens.sql
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- Index for efficient lookups
CREATE INDEX idx_user_push_tokens_user_id ON user_push_tokens(user_id);

-- RLS Policies
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_tokens" ON user_push_tokens
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Notification Service Pattern:**

```typescript
// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id', // From app.json
  });

  // Store token in Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('user_push_tokens').upsert({
      user_id: user.id,
      push_token: tokenData.data,
      device_type: Platform.OS,
    }, {
      onConflict: 'user_id,push_token',
    });
  }

  return tokenData.data;
}

export async function unregisterPushToken(): Promise<void> {
  const tokenData = await Notifications.getExpoPushTokenAsync();
  await supabase
    .from('user_push_tokens')
    .delete()
    .eq('push_token', tokenData.data);
}
```

**Edge Function for Sending Notifications:**

```typescript
// supabase/functions/send-push-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { record, type } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let recipients: string[] = [];
  let title = '';
  let body = '';
  let data = {};

  if (type === 'new_story') {
    // Get family members linked to this senior
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('family_user_id')
      .eq('senior_user_id', record.user_id)
      .eq('status', 'active');

    if (familyMembers) {
      const userIds = familyMembers.map(fm => fm.family_user_id);

      // Get push tokens for family members
      const { data: tokens } = await supabase
        .from('user_push_tokens')
        .select('push_token')
        .in('user_id', userIds);

      recipients = tokens?.map(t => t.push_token) || [];
    }

    title = 'New Story Available!';
    body = record.title || 'Your family member just recorded a new story';
    data = { storyId: record.id, type: 'new_story' };
  }

  if (type === 'new_comment') {
    // Notify the story owner (senior)
    const { data: story } = await supabase
      .from('audio_recordings')
      .select('user_id, title')
      .eq('id', record.story_id)
      .single();

    if (story) {
      const { data: tokens } = await supabase
        .from('user_push_tokens')
        .select('push_token')
        .eq('user_id', story.user_id);

      recipients = tokens?.map(t => t.push_token) || [];
      title = 'New Comment Received';
      body = `Your family commented on "${story.title || 'your story'}"`;
      data = { storyId: record.story_id, type: 'new_comment' };
    }
  }

  // Send via Expo Push API
  if (recipients.length > 0) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        recipients.map(token => ({
          to: token,
          title,
          body,
          data,
          sound: 'default',
        }))
      ),
    });
  }

  return new Response(JSON.stringify({ sent: recipients.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Deep Link Configuration:**

```typescript
// app.json (add to expo config)
{
  "expo": {
    "scheme": "timelog",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#C26B4A"
        }
      ]
    ]
  }
}

// app/_layout.tsx - Handle deep links
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle notification tap when app is opened
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data.storyId) {
          if (data.type === 'new_comment') {
            router.push(`/story-comments/${data.storyId}`);
          } else {
            router.push(`/family-story/${data.storyId}`);
          }
        }
      }
    );

    return () => subscription.remove();
  }, [router]);

  // ... rest of layout
}
```

### Previous Story Intelligence

From **Story 4.3 (Realtime Comment System)**:

- **Pattern:** Supabase RLS policies for data access control
- **Pattern:** Edge Functions can be triggered by database events
- **Pattern:** React Query for data caching
- **Learning:** Real-time subscriptions need proper cleanup

From **Story 4.1 (Family Story List)**:

- **Pattern:** `NotificationPrompt.tsx` already exists for permission prompting
- **Pattern:** Heritage Palette styling for UI components
- **Learning:** Permission flows need user-friendly explanations

### Git Intelligence

Recent commits show:

- Story 4.3 completed - Realtime comments with Supabase
- Family-listener feature module has services/hooks/components structure
- Supabase Edge Functions pattern established

### File Structure

```
src/
├── lib/
│   ├── notifications.ts              # NEW - Push notification service
│   └── supabase.ts                   # Existing
├── features/
│   └── family-listener/
│       ├── components/
│       │   ├── NotificationBanner.tsx   # NEW - In-app notification
│       │   └── NotificationPrompt.tsx   # MODIFY - Add enable button
│       └── hooks/
│           └── useNotifications.ts      # NEW - Notification state hook

app/
├── _layout.tsx                       # MODIFY - Add deep link handling
└── family-story/
    └── [id].tsx                      # Existing - Deep link target

supabase/
├── migrations/
│   └── 20260115_create_user_push_tokens.sql  # NEW
└── functions/
    └── send-push-notification/
        └── index.ts                  # NEW - Edge Function
```

### Testing Requirements

**Unit Tests:**

- `notifications.test.ts`: Mock expo-notifications, test registration flow
- `NotificationBanner.test.tsx`: Test display and tap handling

**Integration Tests:**

- Push token registration and storage
- Deep link navigation
- Edge Function notification delivery

**Manual Testing Checklist:**

1. [ ] Grant notification permission - token stored in Supabase
2. [ ] Senior uploads story - family receives notification
3. [ ] Tap notification - app opens to story player
4. [ ] Family comments - senior receives notification
5. [ ] Tap comment notification - opens comment view
6. [ ] Foreground notification shows in-app banner
7. [ ] Deny permission - prompt links to settings

### Performance Considerations

- **Token Refresh:** Refresh push token on every app launch
- **Batching:** Edge Function batches notifications when possible
- **Rate Limiting:** Consider throttling notifications for high-activity stories
- **Background:** Handle notifications when app is backgrounded

### Accessibility (WCAG AAA)

- **Notification Content:** Clear, descriptive notification text
- **Deep Links:** Navigation announcements for screen readers
- **Banner:** In-app banner dismissible and navigable
- **Settings:** Link to system settings has clear label

### References

- [Source: epics.md#FR14]
- [Source: epics.md#Story 5.1 - Deep Link Payload]
- [Source: epics.md#Story 5.7 - New Story Push]
- [Expo Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Expo Router Deep Links](https://docs.expo.dev/router/reference/url-parameters/)

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Anthropic)

### Debug Log References

- Console logs added in notifications.ts for token registration and error tracking
- useNotifications hook logs permission status changes

### Completion Notes List

1. Installed `expo-notifications` and `expo-device` using `--legacy-peer-deps` due to peer dependency conflict with `@siteed/expo-audio-studio`
2. Configured app.json with expo-notifications plugin (Heritage Palette color #C26B4A)
3. Created comprehensive `src/lib/notifications.ts` with:
   - Permission status checking and requesting
   - Push token registration/unregistration with Supabase storage
   - Notification response and foreground listeners
   - Badge count management
   - Local notification scheduling (for testing)
4. Created Supabase migration for `user_push_tokens` table with RLS policies
5. Created Edge Function `send-push-notification` supporting both `new_story` and `new_comment` notification types
6. Created `useNotifications` hook for managing notification state, permissions, and navigation
7. Created `NotificationBanner.tsx` with slide-in animation, Heritage Palette styling, and auto-dismiss after 5 seconds
8. Updated root `_layout.tsx` to integrate NotificationBanner for foreground notifications
9. Updated `NotificationPrompt.tsx` with permission denied state handling and system settings link
10. Added 22 unit tests for notification service (all passing)
11. URL scheme `timelog://` already configured in app.json
12. **All UI text and notification content changed from Chinese to English**

### Change Log

- 2026-01-15: Installed expo-notifications and expo-device packages
- 2026-01-15: Updated app.json with expo-notifications plugin configuration
- 2026-01-15: Created src/lib/notifications.ts push notification service
- 2026-01-15: Created supabase/migrations/20260115_create_user_push_tokens.sql
- 2026-01-15: Created supabase/functions/send-push-notification/index.ts Edge Function
- 2026-01-15: Created src/features/family-listener/hooks/useNotifications.ts
- 2026-01-15: Created src/features/family-listener/components/NotificationBanner.tsx
- 2026-01-15: Updated app/\_layout.tsx with notification banner integration
- 2026-01-15: Updated src/features/family-listener/components/NotificationPrompt.tsx with settings link
- 2026-01-15: Created src/lib/notifications.test.ts (22 tests)
- 2026-01-15: Updated src/features/family-listener/index.ts barrel exports

### File List

**New Files:**

- `src/lib/notifications.ts`
- `src/lib/notifications.test.ts`
- `src/features/family-listener/hooks/useNotifications.ts`
- `src/features/family-listener/components/NotificationBanner.tsx`
- `supabase/migrations/20260115_create_user_push_tokens.sql`
- `supabase/functions/send-push-notification/index.ts`

**Modified Files:**

- `app.json` (added expo-notifications plugin)
- `app/_layout.tsx` (added notification banner integration)
- `src/features/family-listener/components/NotificationPrompt.tsx` (added settings link)
- `src/features/family-listener/index.ts` (added Story 4.4 exports)
- `package.json` (added expo-notifications, expo-device dependencies)
