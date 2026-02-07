-- Migration: Align activity_events schema with code expectations (v2)
-- Date: 2026-01-28
-- Description: Rename columns and change data types to match local SQLite schema
-- Version 2: Handles RLS policy dependencies

-- =============================================================================
-- BACKUP NOTE: This migration modifies existing structure
-- =============================================================================

-- Step 0: Drop dependent RLS policies first
DROP POLICY IF EXISTS "Seniors view their activities" ON public.activity_events;
DROP POLICY IF EXISTS "Users can view their own activity" ON public.activity_events;
DROP POLICY IF EXISTS "Family can view senior's activities" ON public.activity_events;

-- Step 1: Add new columns with correct names
ALTER TABLE public.activity_events
ADD COLUMN IF NOT EXISTS type text;

ALTER TABLE public.activity_events
ADD COLUMN IF NOT EXISTS story_id uuid;

ALTER TABLE public.activity_events
ADD COLUMN IF NOT EXISTS actor_user_id uuid;

ALTER TABLE public.activity_events
ADD COLUMN IF NOT EXISTS target_user_id uuid;

ALTER TABLE public.activity_events
ADD COLUMN IF NOT EXISTS read_at bigint;

ALTER TABLE public.activity_events
ADD COLUMN IF NOT EXISTS synced_at bigint;

-- Step 2: Copy data from old columns to new columns
UPDATE public.activity_events
SET 
    type = activity_type,
    story_id = related_record_id,
    target_user_id = senior_user_id,
    actor_user_id = user_id
WHERE type IS NULL;

-- Step 3: Convert is_read to read_at timestamp
UPDATE public.activity_events
SET read_at = EXTRACT(EPOCH FROM created_at)::bigint * 1000
WHERE is_read = true AND read_at IS NULL;

-- Step 4: Drop old columns
ALTER TABLE public.activity_events
DROP COLUMN IF EXISTS activity_type CASCADE;

ALTER TABLE public.activity_events
DROP COLUMN IF EXISTS related_record_id CASCADE;

ALTER TABLE public.activity_events
DROP COLUMN IF EXISTS senior_user_id CASCADE;

ALTER TABLE public.activity_events
DROP COLUMN IF EXISTS is_read CASCADE;

ALTER TABLE public.activity_events
DROP COLUMN IF EXISTS user_id CASCADE;

-- Step 5: Add constraints and foreign keys
ALTER TABLE public.activity_events
ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.activity_events
ALTER COLUMN story_id SET NOT NULL;

ALTER TABLE public.activity_events
ALTER COLUMN actor_user_id SET NOT NULL;

ALTER TABLE public.activity_events
ALTER COLUMN target_user_id SET NOT NULL;

-- Add foreign key to audio_recordings
ALTER TABLE public.activity_events
DROP CONSTRAINT IF EXISTS activity_events_story_id_fkey;

ALTER TABLE public.activity_events
ADD CONSTRAINT activity_events_story_id_fkey
FOREIGN KEY (story_id) REFERENCES public.audio_recordings(id) ON DELETE CASCADE;

-- Add foreign keys for users
ALTER TABLE public.activity_events
DROP CONSTRAINT IF EXISTS activity_events_actor_user_id_fkey;

ALTER TABLE public.activity_events
ADD CONSTRAINT activity_events_actor_user_id_fkey
FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.activity_events
DROP CONSTRAINT IF EXISTS activity_events_target_user_id_fkey;

ALTER TABLE public.activity_events
ADD CONSTRAINT activity_events_target_user_id_fkey
FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 6: Recreate RLS policies with new column names
CREATE POLICY "Users can view activities for their stories"
ON public.activity_events
FOR SELECT
USING (auth.uid() = target_user_id);

CREATE POLICY "Family can view activities on shared stories"
ON public.activity_events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.family_connections
        WHERE senior_id = activity_events.target_user_id
        AND member_id = auth.uid()
    )
);

-- Step 7: Update indexes
DROP INDEX IF EXISTS idx_activity_events_senior_user;
CREATE INDEX IF NOT EXISTS idx_activity_events_target_user 
ON public.activity_events(target_user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_activity_events_story 
ON public.activity_events(story_id);
