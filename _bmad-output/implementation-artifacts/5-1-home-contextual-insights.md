# Story 5.1: Home Contextual Insights

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Senior User,
I want to see important updates directly on my home screen,
So that I don't have to dig through menus to know if my family interacted with me.

## Acceptance Criteria

1. **Given** I open the app and have unread interactions
   **When** the Home screen loads
   **Then** I see a prominent "Activity Card" at the top (e.g., "Alice liked your story")
   **And** the card has distinct visual hierarchy with Heritage Palette colors
   **And** the most recent interaction is shown first

2. **Given** I tap the Activity Card
   **When** I interact with it
   **Then** tapping it takes me directly to the relevant content (story detail with comments)
   **And** deep linking opens the correct story playback page

3. **Given** I have viewed the activity
   **When** I return to the Home screen
   **Then** the card disappears or moves to history section
   **And** the read state persists locally in SQLite

4. **Given** I have unread interactions
   **When** the Home screen loads
   **Then** the App Icon shows a numeric badge matching the unread count
   **And** the badge uses `expo-notifications` badge API

## Tasks / Subtasks

- [ ] Task 1: Extend database schema for activity tracking (AC: 1, 3, 4)
  - [ ] 1.1: Add `activity_events` table to `src/db/schema.ts`
  - [ ] 1.2: Add `activity_read_at` column to track viewed activities
  - [ ] 1.3: Generate Drizzle migration
  - [ ] 1.4: Create Supabase schema for activity events

- [ ] Task 2: Create Activity Aggregation Service (AC: 1, 4)
  - [ ] 2.1: Create `src/features/home/services/activityService.ts`
  - [ ] 2.2: Implement `getUnreadActivities()` function
  - [ ] 2.3: Implement activity count aggregation from comments + reactions
  - [ ] 2.4: Subscribe to Supabase Realtime for new activity events

- [ ] Task 3: Create ActivityCard Component (AC: 1)
  - [ ] 3.1: Create `src/features/home/components/ActivityCard.tsx`
  - [ ] 3.2: Design card UI with Heritage Palette (Warm Terracotta/Cream)
  - [ ] 3.3: Show activity type icon (comment, reaction, etc.)
  - [ ] 3.4: Display family member name and activity summary
  - [ ] 3.5: Ensure touch target ≥48dp

- [ ] Task 4: Implement deep linking from activities (AC: 2)
  - [ ] 4.1: Add deep link handler to `app/_layout.tsx`
  - [ ] 4.2: Create navigation helper `navigateToStory(storyId, commentId?)`
  - [ ] 4.3: Link ActivityCard tap to correct story detail view
  - [ ] 4.4: Scroll to specific comment if activity is comment-based

- [ ] Task 5: Track activity read state (AC: 3)
  - [ ] 5.1: Implement `markActivityAsRead(activityId)` function
  - [ ] 5.2: Update local SQLite `activity_read_at` timestamp
  - [ ] 5.3: Remove activity from unread list in real-time
  - [ ] 5.4: Store read state persistently for offline access

- [ ] Task 6: Update app icon badge (AC: 4)
  - [ ] 6.1: Create `src/lib/notifications/badgeService.ts`
  - [ ] 6.2: Implement `updateAppBadge(count)` using `expo-notifications`
  - [ ] 6.3: Calculate badge count from unread activities
  - [ ] 6.4: Update badge on app foreground and when activities change

- [ ] Task 7: Integrate into Home screen (AC: 1-4)
  - [ ] 7.1: Update `app/(tabs)/index.tsx` to include ActivityCard
  - [ ] 7.2: Position ActivityCard at top of Home screen
  - [ ] 7.3: Use `useUnreadActivities` hook for data fetching
  - [ ] 7.4: Handle loading state with skeleton placeholder

- [ ] Task 8: Testing and accessibility (AC: 1-4)
  - [ ] 8.1: Add unit tests for activityService
  - [ ] 8.2: Add component tests for ActivityCard
  - [ ] 8.3: Test deep linking navigation
  - [ ] 8.4: Verify badge count updates correctly
  - [ ] 8.5: Test screen reader announces activity summary

## Dev Notes

### 🔥 CRITICAL CONTEXT: Home Screen Activity Awareness

This story implements the **Contextual Insights** feature that surfaces important family interactions directly on the Home screen, preventing elderly users from missing engagement buried in navigation. This is a core part of FR25 (unread message badges) and Epic 5's engagement strategy.

### Architecture Guardrails

**Activity Event System**
Activities are aggregated from multiple sources (comments, reactions, story shares). This story creates a unified activity feed that prioritizes recent family engagement.

**Database Schema:**

```typescript
// src/db/schema.ts - Local SQLite
export const activityEvents = sqliteTable('activity_events', {
  id: text('id').primaryKey(), // UUID
  type: text('type').notNull(), // 'comment', 'reaction', 'story_share'
  story_id: text('story_id').notNull().references(() => audioRecordings.id),
  actor_user_id: text('actor_user_id').notNull(), // Family member who performed action
  target_user_id: text('target_user_id').notNull(), // Senior user (owner of story)
  metadata: text('metadata'), // JSON: comment text, reaction type, etc.
  created_at: integer('created_at').notNull(),
  read_at: integer('read_at'), // NULL = unread, timestamp when marked as read
  synced_at: integer('synced_at'),
});

// Index for fast unread queries
export const activityEventsUnreadIndex = index('activity_events_unread_idx')
  .on(activityEvents.target_user_id, activityEvents.read_at);
```

**Supabase Schema:**

```sql
-- supabase/migrations/YYYYMMDD_create_activity_events.sql
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('comment', 'reaction', 'story_share')),
  story_id UUID NOT NULL REFERENCES audio_recordings(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Index for unread activities
CREATE INDEX activity_events_unread_idx
  ON activity_events(target_user_id, read_at)
  WHERE read_at IS NULL;

-- RLS: Users can see activities where they are the target
CREATE POLICY "users_view_own_activities"
  ON activity_events FOR SELECT
  USING (target_user_id = auth.uid());

-- RLS: Activities are created by system (Edge Function), not directly by users
CREATE POLICY "system_create_activities"
  ON activity_events FOR INSERT
  WITH CHECK (false); -- Manual inserts blocked, only via Edge Function
```

**Activity Service Pattern:**

```typescript
// src/features/home/services/activityService.ts
import { db } from '@/db/client';
import { activityEvents, audioRecordings } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, isNull, desc, and } from 'drizzle-orm';

export interface Activity {
  id: string;
  type: 'comment' | 'reaction' | 'story_share';
  story_id: string;
  story_title: string;
  actor_name: string;
  actor_user_id: string;
  metadata: {
    comment_text?: string;
    reaction_type?: string;
    comment_id?: string;
  };
  created_at: number;
  read_at: number | null;
}

/**
 * Get unread activities for current user
 */
export async function getUnreadActivities(userId: string): Promise<Activity[]> {
  // Query from Supabase for latest activities
  const { data: events, error } = await supabase
    .from('activity_events')
    .select(`
      id,
      type,
      story_id,
      actor_user_id,
      metadata,
      created_at,
      read_at,
      audio_recordings!inner(title),
      profiles!actor_user_id(name)
    `)
    .eq('target_user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Failed to fetch activities:', error);
    return [];
  }

  return events.map(event => ({
    id: event.id,
    type: event.type,
    story_id: event.story_id,
    story_title: event.audio_recordings.title,
    actor_name: event.profiles.name,
    actor_user_id: event.actor_user_id,
    metadata: event.metadata,
    created_at: new Date(event.created_at).getTime(),
    read_at: event.read_at ? new Date(event.read_at).getTime() : null,
  }));
}

/**
 * Mark activity as read
 */
export async function markActivityAsRead(activityId: string): Promise<void> {
  const now = new Date().toISOString();

  // Update in Supabase
  const { error } = await supabase
    .from('activity_events')
    .update({ read_at: now })
    .eq('id', activityId);

  if (error) {
    console.error('Failed to mark activity as read:', error);
    return;
  }

  // Update local cache
  await db
    .update(activityEvents)
    .set({ read_at: Date.now() })
    .where(eq(activityEvents.id, activityId));
}

/**
 * Get total unread count for badge
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('activity_events')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Subscribe to new activities (Realtime)
 */
export function subscribeToActivities(
  userId: string,
  onNewActivity: (activity: Activity) => void
): () => void {
  const channel = supabase
    .channel('activity_events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_events',
        filter: `target_user_id=eq.${userId}`,
      },
      async payload => {
        // Fetch full activity with joined data
        const { data } = await supabase
          .from('activity_events')
          .select(`
            id,
            type,
            story_id,
            actor_user_id,
            metadata,
            created_at,
            audio_recordings!inner(title),
            profiles!actor_user_id(name)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          onNewActivity({
            id: data.id,
            type: data.type,
            story_id: data.story_id,
            story_title: data.audio_recordings.title,
            actor_name: data.profiles.name,
            actor_user_id: data.actor_user_id,
            metadata: data.metadata,
            created_at: new Date(data.created_at).getTime(),
            read_at: null,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

**ActivityCard Component:**

```tsx
// src/features/home/components/ActivityCard.tsx
import { View, Text, Pressable } from 'react-native';
import { Activity } from '../services/activityService';
import { formatAbsoluteDate } from '@/utils/dateUtils';

interface ActivityCardProps {
  activity: Activity;
  onPress: () => void;
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const getActivityMessage = () => {
    switch (activity.type) {
      case 'comment':
        return `${activity.actor_name} commented on your story "${activity.story_title}"`;
      case 'reaction':
        return `${activity.actor_name} liked your story "${activity.story_title}"`;
      case 'story_share':
        return `${activity.actor_name} shared your story "${activity.story_title}"`;
      default:
        return 'New activity';
    }
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'comment':
        return '💬';
      case 'reaction':
        return '❤️';
      case 'story_share':
        return '🔗';
      default:
        return '📢';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface border border-primary rounded-2xl p-4 mb-4"
      accessibilityRole="button"
      accessibilityLabel={getActivityMessage()}
      accessibilityHint="Double tap to view"
    >
      <View className="flex-row items-start gap-3">
        {/* Icon */}
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-2xl">{getActivityIcon()}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-onSurface mb-1">
            {getActivityMessage()}
          </Text>
          {activity.metadata?.comment_text && (
            <Text
              className="text-sm text-onSurface/70 mb-2"
              numberOfLines={2}
            >
              "{activity.metadata.comment_text}"
            </Text>
          )}
          <Text className="text-sm text-onSurface/50">
            {formatAbsoluteDate(activity.created_at)}
          </Text>
        </View>

        {/* Indicator */}
        <View className="w-3 h-3 rounded-full bg-warning" />
      </View>
    </Pressable>
  );
}
```

**useUnreadActivities Hook:**

```typescript
// src/features/home/hooks/useUnreadActivities.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getUnreadActivities,
  subscribeToActivities,
  Activity
} from '../services/activityService';

export function useUnreadActivities() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['unread-activities', user?.id];

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getUnreadActivities(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToActivities(user.id, newActivity => {
      queryClient.setQueryData<Activity[]>(queryKey, old => {
        if (!old) return [newActivity];
        return [newActivity, ...old];
      });
    });

    return unsubscribe;
  }, [user, queryClient]);

  return {
    activities,
    isLoading,
    error,
    hasUnread: activities.length > 0,
  };
}
```

**App Badge Service:**

```typescript
// src/lib/notifications/badgeService.ts
import * as Notifications from 'expo-notifications';
import { getUnreadCount } from '@/features/home/services/activityService';

/**
 * Update app icon badge count
 */
export async function updateAppBadge(userId: string): Promise<void> {
  const count = await getUnreadCount(userId);
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear app badge
 */
export async function clearAppBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
```

**Deep Linking Navigation:**

```typescript
// src/lib/navigation/deepLinkHandlers.ts
import { router } from 'expo-router';

export function navigateToStory(storyId: string, commentId?: string) {
  if (commentId) {
    // Navigate to story with comment highlighted
    router.push(`/story/${storyId}?commentId=${commentId}`);
  } else {
    // Navigate to story detail
    router.push(`/story/${storyId}`);
  }
}
```

### Naming Conventions

**Database:**

- Table: `activity_events` (snake_case)
- Columns: `actor_user_id`, `target_user_id`, `read_at`, `created_at`

**TypeScript:**

- Service: `activityService.ts` (camelCase)
- Functions: `getUnreadActivities`, `markActivityAsRead`, `getUnreadCount`
- Component: `ActivityCard.tsx` (PascalCase)
- Hook: `useUnreadActivities.ts` (camelCase with 'use' prefix)

**Files:**

- Service: `src/features/home/services/activityService.ts`
- Component: `src/features/home/components/ActivityCard.tsx`
- Hook: `src/features/home/hooks/useUnreadActivities.ts`
- Badge Service: `src/lib/notifications/badgeService.ts`

### UX Patterns (CRITICAL - ELDERLY ENGAGEMENT DESIGN)

**From UX Spec - Contextual Insights Philosophy:**

> Important updates should be surfaced prominently on the Home screen to prevent seniors from missing family engagement.

**Activity Card Flow:**

1. **Trigger:** New comment/reaction from family member
2. **Event Creation:** Edge Function creates activity_event record
3. **Real-time Update:** Supabase Realtime pushes to senior's app
4. **Display:** ActivityCard appears at top of Home screen
5. **Navigation:** Tap card → Opens story detail with comment highlighted
6. **Read State:** Activity marked as read, removed from Home screen

**Accessibility Requirements (WCAG 2.2 AAA):**

- Touch target ≥48dp for entire ActivityCard
- Screen reader announces full activity message
- Color is not the only indicator (icon + text + badge dot)
- Absolute timestamps (no "2 hours ago" per UX anti-patterns)

### Technical Requirements

**Real-time Subscription:**

- Use Supabase Realtime for instant activity updates
- Subscribe to `postgres_changes` on `activity_events` table
- Filter by `target_user_id` to only receive relevant activities

**Badge Count Management:**

- Use `expo-notifications` `setBadgeCountAsync(count)`
- Update on app foreground (`AppState.currentState === 'active'`)
- Clear badge when all activities are read

**Activity Aggregation:**

- Activities come from: Comments (Story 4.3), Reactions (Story 4.6)
- Future: Story shares, family question submissions
- Aggregate by time (most recent first)
- Limit to 10 most recent activities for performance

### Library/Framework Requirements

**Required Packages (Already Installed):**

- `expo-notifications` - App badge management
- `expo-router` - Deep linking navigation
- `@tanstack/react-query` - Caching and real-time updates
- `drizzle-orm` - Database ORM
- `uuid` - Client-side ID generation

**Installation Note:**

- NO new packages needed
- Verify `expo-notifications` permissions are configured

### File Structure Requirements

**New Files to Create:**

```
src/features/home/
├── components/
│   └── ActivityCard.tsx                 # Activity display component
├── hooks/
│   └── useUnreadActivities.ts           # React Query hook
├── services/
│   └── activityService.ts               # Activity CRUD operations

src/lib/notifications/
└── badgeService.ts                      # App badge management

src/db/
└── schema.ts                            # Add activity_events table

supabase/migrations/
└── YYYYMMDD_create_activity_events.sql  # Cloud schema + RLS

drizzle/
└── 000X_add_activity_events.sql         # Local migration
```

**Files to Modify:**

```
app/(tabs)/index.tsx                     # Add ActivityCard to Home screen
app/_layout.tsx                          # Add deep link handler
```

### Previous Story Intelligence

**From Story 4.5 (Senior Interaction Feedback):**

- Pattern: Comment badge counts using `last_comment_read_at`
- Pattern: React Query for caching and real-time updates
- Learning: Senior-facing interaction visibility uses same badge patterns
- Integration: Activity events can aggregate comment badges

**From Story 4.3 (Realtime Comment System):**

- Pattern: Supabase Realtime subscriptions
- Pattern: Optimistic UI with React Query
- Learning: Real-time updates are crucial for family engagement features

**From Story 3.3 (Soft Delete):**

- Pattern: Service layer handles local + cloud logic
- Pattern: `read_at` column tracks state
- Learning: Use same pattern for `activity_read_at` tracking

**From Story 2.6 (Sync Status Indicator):**

- Pattern: Badge indicators for unsynced items
- Learning: Warning/Amber color for attention-grabbing badges

### Architecture Compliance Checklist

**Feature-First Structure:**

- ✅ Home feature module in `src/features/home/`
- ✅ Service logic in `services/`
- ✅ Components in `components/`
- ✅ Hooks in `hooks/`

**Dependency Rule:**

- ✅ `activityService.ts` can import from `@/lib/supabase/`
- ✅ Components import from services, NOT direct DB access
- ✅ Badge service is shared utility in `@/lib/notifications/`

**Network as State:**

- ✅ Activities cached locally
- ✅ Real-time updates via Supabase
- ✅ Offline shows last cached activities

**Database Patterns:**

- ✅ Use Drizzle ORM
- ✅ Column names `snake_case`
- ✅ Indexes for fast unread queries

**UX Patterns:**

- ✅ Absolute timestamps (no relative time)
- ✅ Touch target ≥48dp
- ✅ Heritage Palette colors (Primary border, Warning badge dot)

**Accessibility (WCAG 2.2 AAA):**

- ✅ Screen reader labels
- ✅ `accessibilityRole="button"`
- ✅ Color + icon pairing

### Testing Requirements

**Manual Testing Checklist:**

1. New comment posted → ActivityCard appears on Home
2. Tap ActivityCard → Opens correct story with comment
3. Return to Home → ActivityCard removed (marked as read)
4. App icon badge shows correct unread count
5. Offline → Last cached activities still visible
6. Real-time → New activity appears instantly

**Unit Tests:**

- `activityService.test.ts` - Get, mark read, subscribe
- `ActivityCard.test.tsx` - Renders correctly, calls onPress
- `useUnreadActivities.test.ts` - Real-time updates work

**Integration Tests:**

- Comment posted → Activity event created → Appears in Home
- Activity marked as read → Removed from unread list
- Badge count updates when activities change

**Accessibility Testing:**

- VoiceOver announces activity message
- Touch target verified ≥48dp
- Absolute timestamp announced correctly

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: _bmad-output/planning-artifacts/epics.md#FR25]
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase Realtime]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Heritage Palette]
- [Source: Story 4.5#Comment Badge Pattern]
- [Source: Story 4.3#Realtime Subscription Pattern]

### Latest Technical Information

**Expo Notifications (SDK 54):**

- `setBadgeCountAsync(count)` for app icon badge
- Requires notification permissions (request on first launch)
- Badge auto-clears on iOS when all notifications dismissed

**Supabase Realtime (2026):**

- `postgres_changes` event for table INSERTs
- Filter by column value: `filter: 'target_user_id=eq.${userId}'`
- Join data requires separate query after receiving event

**React Query (v5):**

- `setQueryData` for optimistic real-time updates
- `invalidateQueries` to refetch after mutations
- `staleTime: 30s` for frequent-but-not-instant refresh

### Implementation Warnings

**⚠️ CRITICAL: Activities Must Be Created by Edge Function**

```sql
-- ❌ WRONG - Allow direct inserts
CREATE POLICY "users_create_activities"
  ON activity_events FOR INSERT
  WITH CHECK (actor_user_id = auth.uid());

-- ✅ CORRECT - Only Edge Function creates activities
CREATE POLICY "system_create_activities"
  ON activity_events FOR INSERT
  WITH CHECK (false);
```

**⚠️ CRITICAL: Badge Count Must Update on App Foreground**

```typescript
// ❌ WRONG - Badge never updates
useEffect(() => {
  updateAppBadge(userId);
}, []);

// ✅ CORRECT - Update on foreground
useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      updateAppBadge(userId);
    }
  });
  return () => subscription.remove();
}, [userId]);
```

**⚠️ CRITICAL: Deep Link Must Handle Missing Story**

```typescript
// ❌ WRONG - Crash if story deleted
router.push(`/story/${storyId}`);

// ✅ CORRECT - Check story exists first
const story = await getStory(storyId);
if (story) {
  router.push(`/story/${storyId}`);
} else {
  Toast.show('Story no longer available');
}
```

### Performance Requirements

**From PRD (NFR Requirements):**

- Cold Start: <2s (activity card should not block startup)
- Home Screen Load: <1s (activities cached locally)

**Story-Specific Performance:**

- Activity query: <100ms (indexed by `target_user_id`, `read_at`)
- Real-time latency: <500ms (Supabase Realtime SLA)
- Badge update: <50ms (local operation)

### Privacy & Compliance Notes

**Data Visibility:**

- Activities only visible to target user (senior)
- RLS policies enforce access control
- Activities deleted when story is deleted (CASCADE)

**Audit Trail:**

- `actor_user_id` for accountability
- `created_at` timestamp for activity time
- `metadata` JSONB for flexible context

## Dev Agent Record

### Agent Model Used

<!-- To be filled by dev agent -->

### Debug Log References

<!-- To be filled by dev agent -->

### Completion Notes List

<!-- To be filled by dev agent -->

### File List

<!-- To be filled by dev agent -->
