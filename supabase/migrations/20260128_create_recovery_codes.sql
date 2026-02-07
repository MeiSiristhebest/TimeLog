-- Migration: Create recovery_codes table
-- Purpose: Store user recovery codes for device restoration
-- Date: 2026-01-28

-- Create recovery_codes table
CREATE TABLE IF NOT EXISTS recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT unique_active_code_per_user UNIQUE (user_id, is_active)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_active ON recovery_codes(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recovery_codes_code ON recovery_codes(code) WHERE is_active = true;

-- Enable RLS
ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own recovery codes" ON recovery_codes;
DROP POLICY IF EXISTS "Users can insert their own recovery codes" ON recovery_codes;
DROP POLICY IF EXISTS "Users can update their own recovery codes" ON recovery_codes;

-- RLS Policies: Users can only manage their own codes
CREATE POLICY "Users can read their own recovery codes"
  ON recovery_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery codes"
  ON recovery_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery codes"
  ON recovery_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to auto-revoke old codes when inserting new one
CREATE OR REPLACE FUNCTION revoke_old_recovery_codes()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all existing active codes for this user as inactive
  UPDATE recovery_codes
  SET 
    is_active = false,
    revoked_at = now()
  WHERE 
    user_id = NEW.user_id
    AND id != NEW.id
    AND is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_revoke_old_codes ON recovery_codes;

-- Create trigger to auto-revoke old codes
CREATE TRIGGER trigger_revoke_old_codes
  BEFORE INSERT ON recovery_codes
  FOR EACH ROW
  EXECUTE FUNCTION revoke_old_recovery_codes();

-- Create function to check if code is valid
CREATE OR REPLACE FUNCTION validate_recovery_code(p_code TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  user_id UUID,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.is_active AND rc.expires_at > now() AS is_valid,
    rc.user_id,
    rc.expires_at
  FROM recovery_codes rc
  WHERE rc.code = p_code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION validate_recovery_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_recovery_code(TEXT) TO anon;

-- Comment on table
COMMENT ON TABLE recovery_codes IS 'Stores recovery codes for device restoration. Each user can have one active code at a time.';
COMMENT ON COLUMN recovery_codes.code IS 'Unique recovery code in format RCV-XXX-XXX';
COMMENT ON COLUMN recovery_codes.is_active IS 'Only one active code per user allowed via unique constraint';
COMMENT ON COLUMN recovery_codes.expires_at IS 'Codes expire after 30 days by default';
