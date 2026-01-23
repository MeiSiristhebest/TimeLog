-- Story 5.2: Smart Notification Engine
-- Database triggers to invoke notification grouping Edge Function

-- Trigger function for new comments
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  story_owner_id UUID;
BEGIN
  -- Get the owner of the story being commented on
  SELECT user_id INTO story_owner_id
  FROM audio_recordings
  WHERE id = NEW.story_id;

  -- Only notify if not commenting on own story
  IF story_owner_id IS NOT NULL AND story_owner_id != NEW.user_id THEN
    -- Invoke Edge Function asynchronously
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/group-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'event_type', 'new_comment',
        'event_id', NEW.id,
        'user_id', story_owner_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on story_comments INSERT
DROP TRIGGER IF EXISTS comment_notification_trigger ON story_comments;
CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON story_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- Trigger function for new reactions
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  story_owner_id UUID;
BEGIN
  -- Get the owner of the story being reacted to
  SELECT user_id INTO story_owner_id
  FROM audio_recordings
  WHERE id = NEW.story_id;

  -- Only notify if not reacting to own story
  IF story_owner_id IS NOT NULL AND story_owner_id != NEW.user_id THEN
    -- Invoke Edge Function asynchronously
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/group-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'event_type', 'new_reaction',
        'event_id', NEW.id,
        'user_id', story_owner_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on story_reactions INSERT
DROP TRIGGER IF EXISTS reaction_notification_trigger ON story_reactions;
CREATE TRIGGER reaction_notification_trigger
  AFTER INSERT ON story_reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_reaction();

-- Configuration settings (to be set during deployment)
-- ALTER DATABASE postgres SET app.supabase_url = 'https://[project-ref].supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = '[service-role-key]';

COMMENT ON FUNCTION notify_on_comment() IS 'Triggers notification grouping when new comment is posted';
COMMENT ON FUNCTION notify_on_reaction() IS 'Triggers notification grouping when story is reacted to';
