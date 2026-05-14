-- Migration: Add RLS policies for transcript_segments
-- Created: 2026-05-10
-- Purpose: Allow seniors to sync their transcripts and family members to view them.

-- 1. Ensure RLS is enabled on the table
ALTER TABLE IF EXISTS public.transcript_segments ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Senior users can manage their own transcript segments
-- Logic: A user can manage segments if they are the owner of the associated story.
DROP POLICY IF EXISTS "seniors_can_manage_own_transcripts" ON public.transcript_segments;
CREATE POLICY "seniors_can_manage_own_transcripts" ON public.transcript_segments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audio_recordings
      WHERE id = transcript_segments.story_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audio_recordings
      WHERE id = transcript_segments.story_id
      AND user_id = auth.uid()
    )
  );

-- 3. Policy: Family members can view transcript segments of linked seniors
-- Logic: A family member can view segments if they are actively linked to the senior who owns the story.
DROP POLICY IF EXISTS "family_can_view_linked_transcripts" ON public.transcript_segments;
CREATE POLICY "family_can_view_linked_transcripts" ON public.transcript_segments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audio_recordings ar
      JOIN public.family_members fm ON ar.user_id = fm.senior_user_id
      WHERE ar.id = transcript_segments.story_id
      AND fm.family_user_id = auth.uid()
      AND fm.status = 'active'
    )
  );

-- 4. Enable Realtime for this table (optional but recommended for live transcripts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'transcript_segments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transcript_segments;
  END IF;
END $$;
