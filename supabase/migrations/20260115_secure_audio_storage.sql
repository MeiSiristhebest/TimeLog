-- Supabase Storage Security Configuration
-- Story 4.2: Secure Streaming Player (AC: 4)
--
-- This migration ensures audio storage is secure:
-- 1. Storage bucket is PRIVATE (no public access)
-- 2. Only authenticated users can generate signed URLs
-- 3. RLS policies control access based on family relationships

-- ============================================
-- Step 1: Ensure audio-recordings bucket is private
-- ============================================
-- Run this in Supabase Dashboard > Storage > Policies
-- Or via SQL:

UPDATE storage.buckets
SET public = false
WHERE id = 'audio-recordings';

-- If bucket doesn't exist, create it:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  false,  -- CRITICAL: Must be false for security
  104857600,  -- 100MB max file size
  ARRAY['audio/opus', 'audio/wav', 'audio/mpeg', 'audio/mp4']
)
ON CONFLICT (id) DO UPDATE SET
  public = false;

-- ============================================
-- Step 2: RLS Policy for Storage Objects
-- ============================================
-- Owners can manage their own audio files

CREATE POLICY "users_manage_own_audio"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'audio-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'audio-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- Step 3: RLS Policy for Family Access (Read-Only)
-- ============================================
-- Family members can read audio from linked seniors

CREATE POLICY "family_read_linked_senior_audio"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'audio-recordings'
  AND (
    -- Owner can always read
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Family can read linked senior's audio
    (storage.foldername(name))[1] IN (
      SELECT senior_user_id::text
      FROM public.family_members
      WHERE family_user_id = auth.uid()
        AND status = 'active'
    )
  )
);

-- ============================================
-- Verification Queries
-- ============================================

-- Check bucket is private:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'audio-recordings';
-- Expected: public = false

-- Check policies exist:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================
-- Security Test Cases
-- ============================================

-- Test 1: Direct URL access without auth should fail
-- curl -I "https://your-project.supabase.co/storage/v1/object/public/audio-recordings/test.opus"
-- Expected: 400 Bad Request or 403 Forbidden

-- Test 2: Signed URL with valid auth should work
-- Use Supabase client: supabase.storage.from('audio-recordings').createSignedUrl(path, 3600)
-- Expected: Returns valid signed URL

-- Test 3: Family user can access linked senior's audio
-- Login as family user, generate signed URL for senior's recording
-- Expected: Success

-- Test 4: Family user cannot access unlinked senior's audio
-- Login as family user, try to generate signed URL for unlinked senior
-- Expected: RLS policy blocks access
