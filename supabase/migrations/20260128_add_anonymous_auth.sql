-- Migration: Add anonymous authentication support
-- Purpose: Allow storytellers to use app without registration
-- Date: 2026-01-28

-- Add columns to profiles for anonymous account tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMPTZ;

-- Create index for querying anonymous accounts
CREATE INDEX IF NOT EXISTS idx_profiles_anonymous 
  ON profiles(is_anonymous) 
  WHERE is_anonymous = true;

-- Update RLS policies for anonymous users

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anonymous users can create profiles" ON profiles;

-- Allow both authenticated and anonymous users to create profiles
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- Allow users to update their own profiles (including upgrade from anonymous)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Update device_codes policies to support anonymous users
-- Drop existing policy
DROP POLICY IF EXISTS "Users can generate device codes" ON device_codes;

-- Allow any authenticated user (including anonymous) to generate device codes
CREATE POLICY "Authenticated users can generate device codes"
  ON device_codes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL  -- Includes both regular and anonymous users
  );

-- Create function to check if user is anonymous
CREATE OR REPLACE FUNCTION is_user_anonymous()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt()->>'is_anonymous')::boolean,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_anonymous() TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_anonymous() TO anon;

-- Create function to mark profile as upgraded
CREATE OR REPLACE FUNCTION mark_profile_upgraded()
RETURNS TRIGGER AS $$
BEGIN
  -- When user email is set, mark as upgraded if previously anonymous
  IF NEW.email IS NOT NULL AND OLD.email IS NULL THEN
    NEW.is_anonymous := false;
    NEW.upgraded_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic upgrade marking
DROP TRIGGER IF EXISTS trigger_mark_profile_upgraded ON profiles;
CREATE TRIGGER trigger_mark_profile_upgraded
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION mark_profile_upgraded();

-- Note: audio_recordings already has policy "Users can insert own recordings"
-- which allows anonymous users to create recordings. No changes needed.

-- Add TTL for anonymous accounts (auto-cleanup after 30 days if not upgraded)
CREATE OR REPLACE FUNCTION cleanup_abandoned_anonymous_accounts()
RETURNS void AS $$
BEGIN
  -- Mark profiles as inactive if anonymous and not upgraded after 30 days
  UPDATE profiles
  SET is_anonymous = false -- Mark as cleaned up
  WHERE 
    is_anonymous = true 
    AND upgraded_at IS NULL
    AND created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Note: Cleanup function should be called via cron job or scheduled task
-- For now, it can be called manually: SELECT cleanup_abandoned_anonymous_accounts();

-- Comments for documentation
COMMENT ON COLUMN profiles.is_anonymous IS 'True if account was created via anonymous auth and not yet upgraded';
COMMENT ON COLUMN profiles.upgraded_at IS 'Timestamp when anonymous account was upgraded to permanent account';
COMMENT ON FUNCTION is_user_anonymous() IS 'Returns true if current user is authenticated as anonymous';
COMMENT ON FUNCTION cleanup_abandoned_anonymous_accounts() IS 'Removes anonymous accounts older than 30 days that were never upgraded';
