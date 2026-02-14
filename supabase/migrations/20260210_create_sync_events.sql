-- Create sync_events table for sync observability.
-- Scope: delete_file success/failure telemetry.

CREATE TABLE IF NOT EXISTS public.sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  recording_id uuid NULL REFERENCES public.audio_recordings (id) ON DELETE SET NULL,
  queue_item_id text NULL,
  event_type text NOT NULL CHECK (event_type IN ('delete_file_success', 'delete_file_failed')),
  bucket text NOT NULL,
  storage_path text NOT NULL,
  attempt integer NOT NULL DEFAULT 0,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sync_events_user_created_idx
  ON public.sync_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS sync_events_event_created_idx
  ON public.sync_events (event_type, created_at DESC);

ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert_own_sync_events" ON public.sync_events;
CREATE POLICY "users_insert_own_sync_events"
  ON public.sync_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_select_own_sync_events" ON public.sync_events;
CREATE POLICY "users_select_own_sync_events"
  ON public.sync_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.cleanup_sync_events_older_than(days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.sync_events
  WHERE created_at < now() - make_interval(days => days);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Manual cleanup example:
-- SELECT public.cleanup_sync_events_older_than(90);

