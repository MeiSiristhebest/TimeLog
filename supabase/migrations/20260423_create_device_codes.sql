-- Migration: Create device_codes table and RPC functions
-- Purpose: Support device code authentication flow for family sharing
-- Date: 2026-04-23

-- Create device_codes table
CREATE TABLE IF NOT EXISTS device_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_device_codes_user_id ON device_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_device_codes_code ON device_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_codes_expires_at ON device_codes(expires_at);

-- Enable RLS
ALTER TABLE device_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own device codes
CREATE POLICY "Users can generate device codes"
  ON device_codes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- RLS Policy: Users can view their own device codes
CREATE POLICY "Users can view own device codes"
  ON device_codes FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- RLS Policy: Users can revoke their own device codes
CREATE POLICY "Users can revoke own device codes"
  ON device_codes FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Function: Generate a new device code
CREATE OR REPLACE FUNCTION generate_device_code()
RETURNS TABLE (
  code TEXT,
  expires_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  expiry TIMESTAMPTZ;
BEGIN
  -- Generate random 8-character alphanumeric code
  new_code := upper(substr(md5(random()::text), 1, 8));
  
  -- Set expiry to 24 hours from now
  expiry := now() + INTERVAL '24 hours';
  
  -- Insert the code for the current user
  INSERT INTO device_codes (code, user_id, expires_at, created_at)
  VALUES (new_code, auth.uid(), expiry, now())
  ON CONFLICT (code) DO NOTHET; -- Retry on collision (extremely rare)
  
  -- Return the generated code
  RETURN QUERY
    SELECT new_code, expiry
    WHERE EXISTS (SELECT 1 FROM device_codes WHERE code = new_code);
END;
$$;

-- Function: List family devices (placeholder - extend as needed)
CREATE OR REPLACE FUNCTION list_family_devices()
RETURNS TABLE (
  id UUID,
  device_name TEXT,
  created_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      dc.id,
      dc.device_name,
      dc.created_at,
      dc.last_seen_at,
      dc.revoked_at
    FROM device_codes dc
    WHERE dc.user_id = auth.uid()
    ORDER BY dc.created_at DESC;
END;
$$;

-- Function: Revoke a device
CREATE OR REPLACE FUNCTION revoke_device(p_device_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE device_codes
  SET revoked_at = now()
  WHERE id = p_device_id
    AND user_id = auth.uid();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_device_code() TO authenticated;
GRANT EXECUTE ON FUNCTION list_family_devices() TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_device(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE device_codes IS 'Stores device authentication codes for family sharing feature';
COMMENT ON FUNCTION generate_device_code() IS 'Generates a new device code for the current user (valid 24h)';
COMMENT ON FUNCTION list_family_devices() IS 'Lists all device codes belonging to the current user';
COMMENT ON FUNCTION revoke_device(UUID) IS 'Revokes a specific device code by ID';