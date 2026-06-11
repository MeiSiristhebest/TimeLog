-- Migration: Enable realtime for sync
-- Date: 2026-06-07
-- Description: Adds core interaction tables to supabase_realtime publication to enable instant web console refresh.

BEGIN;

-- Check and add audio_recordings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'audio_recordings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audio_recordings;
    END IF;
END $$;

-- Check and add story_comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'story_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.story_comments;
    END IF;
END $$;

-- Check and add story_reactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'story_reactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
    END IF;
END $$;

COMMIT;
