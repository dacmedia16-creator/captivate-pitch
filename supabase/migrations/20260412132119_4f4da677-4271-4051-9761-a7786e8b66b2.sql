-- 1. Add share_expires_at column to presentations
ALTER TABLE public.presentations
ADD COLUMN share_expires_at timestamp with time zone DEFAULT NULL;

-- 2. Update anon RLS policy for presentations to check expiration
DROP POLICY IF EXISTS "anon_read_shared_presentations" ON public.presentations;
CREATE POLICY "anon_read_shared_presentations"
ON public.presentations
FOR SELECT
TO anon
USING (
  share_token IS NOT NULL
  AND share_token <> ''
  AND (share_expires_at IS NULL OR share_expires_at > now())
);

-- 3. Update anon RLS policy for presentation_sections to check expiration
DROP POLICY IF EXISTS "anon_read_shared_sections" ON public.presentation_sections;
CREATE POLICY "anon_read_shared_sections"
ON public.presentation_sections
FOR SELECT
TO anon
USING (
  presentation_id IN (
    SELECT id FROM public.presentations
    WHERE share_token IS NOT NULL
    AND share_token <> ''
    AND (share_expires_at IS NULL OR share_expires_at > now())
  )
);

-- 4. Update anon RLS policy for agency_profiles to check expiration
DROP POLICY IF EXISTS "anon_read_shared_agency_branding" ON public.agency_profiles;
CREATE POLICY "anon_read_shared_agency_branding"
ON public.agency_profiles
FOR SELECT
TO anon
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.presentations
    WHERE share_token IS NOT NULL
    AND share_token <> ''
    AND (share_expires_at IS NULL OR share_expires_at > now())
  )
);

-- 5. Fix handle_new_user trigger to also insert broker role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'active');

  -- Auto-assign broker role to new signups
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'broker');

  RETURN NEW;
END;
$$;