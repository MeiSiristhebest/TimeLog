-- Create family_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.family_connections
(
    id
    UUID
    DEFAULT
    gen_random_uuid
(
) PRIMARY KEY,
    senior_id UUID REFERENCES auth.users
(
    id
) NOT NULL,
    member_id UUID REFERENCES auth.users
(
    id
) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now
(
),
    UNIQUE
(
    senior_id,
    member_id
)
    );

ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Safe to re-run due to IF NOT EXISTS check usually needed, but here we just drop/create or rely on dashboard. 
-- For SQL tool, usually best to use DO block or just create if distinct names)

DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'family_connections' 
        AND policyname = 'Seniors can view their connections'
    ) THEN
        CREATE
POLICY "Seniors can view their connections" ON public.family_connections
            FOR
SELECT USING (auth.uid() = senior_id);
END IF;

    IF
NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'family_connections' 
        AND policyname = 'Members can view their connections'
    ) THEN
        CREATE
POLICY "Members can view their connections" ON public.family_connections
            FOR
SELECT USING (auth.uid() = member_id);
END IF;
END
$$;

-- RPC: Get Family Members (for the Senior)
create
or replace function get_family_members()
returns table (
    user_id uuid,
    display_name text,
    email text,
    avatar_url text,
    role text,
    linked_at timestamptz
)
language plpgsql
security definer
as $$
begin
return query
select p.id        as user_id,
       p.full_name as display_name,
       au.email::text as email, p.avatar_url,
       'member'::text as role, fc.created_at as linked_at
from public.family_connections fc
         join
     public.profiles p on p.id = fc.member_id
         join
     auth.users au on au.id = fc.member_id
where fc.senior_id = auth.uid();
end;
$$;

-- RPC: Remove Family Member
create
or replace function remove_family_member(p_target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
delete
from public.family_connections
where senior_id = auth.uid()
  and member_id = p_target_user_id;
end;
$$;
