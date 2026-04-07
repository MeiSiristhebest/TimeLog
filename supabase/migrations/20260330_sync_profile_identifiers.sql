-- Migration: Sync Profile Identifiers
-- Date: 2026-03-30
-- Author: Antigravity

-- 1. Sync user_id with id for existing profiles (where user_id is NULL)
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- 2. Add NOT NULL constraint for user_id to prevent future mismatches
-- (Assuming we want it always present, but let's just make it a sync for now)
ALTER TABLE public.profiles
ALTER COLUMN user_id SET NOT NULL;

-- 3. Update get_family_members to be more robust
CREATE OR REPLACE FUNCTION get_family_members()
RETURNS TABLE (
    user_id uuid,
    display_name text,
    email text,
    avatar_url text,
    role text,
    linked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id AS user_id, -- Use ID as the definitive UID
           COALESCE(p.display_name, p.full_name, 'Unknown Member') AS display_name,
           au.email::text AS email, 
           p.avatar_url,
           COALESCE(p.role, 'member')::text AS role, 
           fc.created_at AS linked_at
    FROM public.family_connections fc
    JOIN public.profiles p ON p.id = fc.member_id
    JOIN auth.users au ON au.id = fc.member_id
    WHERE fc.senior_id = auth.uid();
END;
$$;
