-- ==============================================================================
-- CareLoop / CareBridge Healthcare Platform Schema
-- Migration 004: Administrator Provisioning & Initial System Setup
-- ==============================================================================

-- Instructions for securely provisioning the first administrator:
-- 1. Create the user in Supabase Authentication (via Supabase Studio Auth tab OR via supabase.auth.admin.createUser API).
-- 2. Obtain their UUID from auth.users.
-- 3. Execute the SQL snippet below with their real UUID and email:
/*
  INSERT INTO public.profiles (id, role, status, full_name, email, phone)
  VALUES (
    '<SUPABASE_AUTH_USER_UUID>',
    'admin',
    'active',
    'CareLoop System Administrator',
    'admin@careloop.com',
    '+15550001122'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active';
*/

-- Security guard: Trigger to prevent unauthorized role elevation via direct user metadata
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed to admin or status is changed, verify current session is admin or service_role
  IF (NEW.role = 'admin' OR OLD.role <> NEW.role OR OLD.status <> NEW.status) THEN
    IF current_setting('request.jwt.claim.role', true) <> 'service_role' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only system administrators or service role can change roles or statuses.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
CREATE TRIGGER trg_protect_profile_roles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_roles();
