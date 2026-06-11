-- Migration: Add account recovery function using recovery codes
-- Purpose: Allow restoring access to storyteller accounts via recovery code and upgrading them to permanent
-- Date: 2026-06-07

CREATE OR REPLACE FUNCTION recover_account_with_code(
  p_code TEXT,
  p_email TEXT,
  p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_valid BOOLEAN;
BEGIN
  -- 1. Validate recovery code
  SELECT 
    rc.user_id, 
    (rc.is_active AND rc.expires_at > now()) 
  INTO v_user_id, v_is_valid
  FROM recovery_codes rc
  WHERE rc.code = p_code
  LIMIT 1;

  IF v_user_id IS NULL OR NOT v_is_valid THEN
    RAISE EXCEPTION 'Invalid or expired recovery code';
  END IF;

  -- 2. Check if the email is already in use by another user
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = p_email AND id != v_user_id
  ) THEN
    RAISE EXCEPTION 'This email address is already in use by another account';
  END IF;

  -- 3. Update the credentials in auth.users
  -- Uses pg_catalog.crypt to hash the new password and marks the account as verified and not anonymous
  UPDATE auth.users
  SET 
    email = p_email,
    encrypted_password = crypt(p_password, gen_salt('bf')),
    email_confirmed_at = now(),
    is_anonymous = false,
    raw_app_meta_data = raw_app_meta_data || jsonb_build_object('provider', 'email', 'providers', array['email']),
    updated_at = now()
  WHERE id = v_user_id;

  -- 4. Update the public profiles table
  UPDATE public.profiles
  SET 
    email = p_email,
    is_anonymous = false,
    upgraded_at = now(),
    updated_at = now()
  WHERE id = v_user_id;

  -- 5. Revoke the recovery code so it cannot be used again
  UPDATE recovery_codes
  SET 
    is_active = false,
    revoked_at = now()
  WHERE code = p_code;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to public/anonymous users since they are recovering accounts
GRANT EXECUTE ON FUNCTION recover_account_with_code(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION recover_account_with_code(TEXT, TEXT, TEXT) TO authenticated;
