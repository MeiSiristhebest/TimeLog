-- Story 5.2: Smart Notification Engine
-- Create notification queue and user settings tables

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK
(
    event_type
    IN
(
    'new_story',
    'new_comment',
    'new_reaction'
)),
    event_id UUID NOT NULL,
    grouped_with UUID[] DEFAULT ARRAY[]::UUID[],
    scheduled_for TIMESTAMPTZ NOT NULL,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );

-- User notification settings table
CREATE TABLE IF NOT EXISTS user_notification_settings
(
    user_id
    UUID
    PRIMARY
    KEY
    REFERENCES
    auth
    .
    users
(
    id
) ON DELETE CASCADE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    time_zone TEXT NOT NULL DEFAULT 'UTC',
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS notification_queue_pending_idx
    ON notification_queue(user_id, scheduled_for)
    WHERE delivered_at IS NULL;

CREATE INDEX IF NOT EXISTS notification_queue_grouping_idx
    ON notification_queue(user_id, event_type, created_at)
    WHERE delivered_at IS NULL;

CREATE INDEX IF NOT EXISTS notification_queue_user_idx
    ON notification_queue(user_id);

-- Row Level Security
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_queue
DROP
POLICY IF EXISTS "users_view_own_queue" ON notification_queue;
CREATE
POLICY "users_view_own_queue"
  ON notification_queue FOR
SELECT
    USING (user_id = auth.uid());

DROP
POLICY IF EXISTS "service_manage_queue" ON notification_queue;
CREATE
POLICY "service_manage_queue"
  ON notification_queue FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_notification_settings
DROP
POLICY IF EXISTS "users_manage_own_settings" ON user_notification_settings;
CREATE
POLICY "users_manage_own_settings"
  ON user_notification_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Comments
COMMENT
ON TABLE notification_queue IS 'Queue for batched and scheduled push notifications';
COMMENT
ON TABLE user_notification_settings IS 'User preferences for notification delivery';
COMMENT
ON COLUMN user_notification_settings.quiet_hours_start IS 'Start time for quiet hours (e.g., 21:00)';
COMMENT
ON COLUMN user_notification_settings.quiet_hours_end IS 'End time for quiet hours (e.g., 09:00)';
COMMENT
ON COLUMN user_notification_settings.time_zone IS 'IANA time zone (e.g., Asia/Shanghai)';
