# Story 5.2 Deployment Guide

## Edge Functions Deployment

### 1. Deploy Edge Functions

```powershell
# Deploy group-notifications
npx supabase functions deploy group-notifications

# Deploy deliver-notifications
npx supabase functions deploy deliver-notifications
```

### 2. Configure Environment Variables

Set the following secrets in the Supabase Dashboard:

```
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### 3. Run Database Migrations

```powershell
# Apply migrations to Supabase
npx supabase db push

# Or manually execute SQL files
# 1. supabase/migrations/20260116_create_notification_queue.sql
# 2. supabase/migrations/20260116_create_notification_triggers.sql
```

### 4. Configure Database Settings

Execute in Supabase SQL Editor:

```sql
-- Replace [project-ref] and [service-role-key]
ALTER DATABASE postgres SET app.supabase_url = 'https://[project-ref].supabase.co';
ALTER DATABASE postgres SET app.service_role_key = '[service-role-key]';
```

### 5. Set Up Cron Job

In Supabase Dashboard > Edge Functions > Cron Jobs:

```
Function: deliver-notifications
Schedule: * * * * * (Every minute)
```

Or use pg_cron:

```sql
-- Call deliver-notifications every minute
SELECT cron.schedule(
  'deliver-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/deliver-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  );
  $$
);
```

## Testing

### 1. Manual Testing for Grouping

```powershell
# Call group-notifications
curl -X POST https://[project-ref].supabase.co/functions/v1/group-notifications \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "new_comment",
    "event_id": "uuid",
    "user_id": "user-uuid"
  }'
```

### 2. Test Delivery

```powershell
# Call deliver-notifications
curl -X POST https://[project-ref].supabase.co/functions/v1/deliver-notifications \
  -H "Authorization: Bearer [service-role-key]"
```

### 3. View Queue

```sql
SELECT * FROM notification_queue WHERE delivered_at IS NULL;
```

## Troubleshooting

### Edge Function Logs

```powershell
npx supabase functions logs group-notifications
npx supabase functions logs deliver-notifications
```

### Check Triggers

```sql
-- Check if triggers exist
SELECT * FROM information_schema.triggers
WHERE trigger_name IN ('comment_notification_trigger', 'reaction_notification_trigger');
```

### Test Quiet Hours Logic

```sql
-- Update user quiet hours settings
INSERT INTO user_notification_settings (user_id, quiet_hours_start, quiet_hours_end, time_zone)
VALUES ('user-uuid', '21:00', '09:00', 'Asia/Shanghai')
ON CONFLICT (user_id) DO UPDATE SET
  quiet_hours_start = EXCLUDED.quiet_hours_start,
  quiet_hours_end = EXCLUDED.quiet_hours_end,
  time_zone = EXCLUDED.time_zone;
```

## Dependencies

- Supabase pg_net extension (for http_post)
- Supabase pg_cron extension (for scheduled jobs)
- Expo Push Notification service (requires `expo_push_token`)

## Safety Notes

- Service role key should only be used server-side
- RLS policies are configured
- Users can only see their own notification queue and settings
