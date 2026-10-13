-- ==============================================================================
-- CareLoop Healthcare Platform Schema
-- Migration 005: Admin Approvals, OTP System, Privilege Security & Atomic RPCs
-- Execution Order: 5 of 6
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Admin OTP Table (Hashed, Single-Use, Rate-Limited, Expiry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  attempts_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_otps_user ON public.admin_otps(user_id, expires_at);
ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;

-- Block direct table manipulation; only access through security definer RPC
DROP POLICY IF EXISTS "admin_otps_no_direct_client_access" ON public.admin_otps;
CREATE POLICY "admin_otps_no_direct_client_access"
  ON public.admin_otps
  FOR ALL
  TO authenticated
  USING (false);

-- ------------------------------------------------------------------------------
-- 2. Staff Approval & Rejection RPCs (Admin-Only)
-- ------------------------------------------------------------------------------

-- RPC: Approve Doctor or Care Coordinator
CREATE OR REPLACE FUNCTION public.approve_staff(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_email TEXT;
  v_name TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only active administrators can approve staff credentials.';
  END IF;

  SELECT role, email, full_name INTO v_role, v_email, v_name
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  IF v_role NOT IN ('doctor', 'coordinator') THEN
    RAISE EXCEPTION 'Target account role "%" cannot be approved through staff workflow.', v_role;
  END IF;

  -- Activate user profile
  UPDATE public.profiles
  SET status = 'active',
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  -- Update role specific record
  IF v_role = 'doctor' THEN
    UPDATE public.doctor_profiles
    SET approved_at = timezone('utc'::text, now()),
        approved_by = auth.uid()
    WHERE id = target_user_id;
  ELSIF v_role = 'coordinator' THEN
    UPDATE public.coordinator_profiles
    SET approved_at = timezone('utc'::text, now()),
        approved_by = auth.uid()
    WHERE id = target_user_id;
  END IF;

  -- Record in immutable audit log
  INSERT INTO public.audit_logs (
    actor_id,
    actor_name,
    actor_role,
    action,
    entity_type,
    entity_id,
    previous_state,
    new_state,
    details
  ) VALUES (
    auth.uid(),
    COALESCE((SELECT full_name FROM public.profiles WHERE id = auth.uid()), 'System Administrator'),
    'admin',
    'STAFF_APPROVED',
    'Profile',
    target_user_id::text,
    'pending',
    'active',
    format('Administrator approved %s account for %s (%s).', v_role, v_name, v_email)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Successfully approved %s (%s).', v_name, v_role)
  );
END;
$$;

-- RPC: Reject Doctor or Coordinator Application
CREATE OR REPLACE FUNCTION public.reject_staff(target_user_id UUID, p_reason TEXT DEFAULT 'Credentials could not be verified.')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only active administrators can reject staff applications.';
  END IF;

  SELECT role, full_name INTO v_role, v_name
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  UPDATE public.profiles
  SET status = 'rejected',
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  IF v_role = 'doctor' THEN
    UPDATE public.doctor_profiles
    SET rejection_reason = p_reason
    WHERE id = target_user_id;
  ELSIF v_role = 'coordinator' THEN
    UPDATE public.coordinator_profiles
    SET rejection_reason = p_reason
    WHERE id = target_user_id;
  END IF;

  INSERT INTO public.audit_logs (
    actor_id,
    actor_name,
    actor_role,
    action,
    entity_type,
    entity_id,
    previous_state,
    new_state,
    details
  ) VALUES (
    auth.uid(),
    COALESCE((SELECT full_name FROM public.profiles WHERE id = auth.uid()), 'System Administrator'),
    'admin',
    'STAFF_REJECTED',
    'Profile',
    target_user_id::text,
    'pending',
    'rejected',
    format('Administrator rejected %s application for %s. Reason: %s', v_role, v_name, p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Staff application for %s has been rejected.', v_name)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Trigger: Anti-Privilege Escalation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing role to admin, or modifying role/status without admin privileges
  IF (NEW.role = 'admin' AND OLD.role <> 'admin') OR (OLD.role <> NEW.role) OR (OLD.status <> NEW.status) THEN
    IF current_setting('request.jwt.claim.role', true) <> 'service_role' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only system administrators or trusted backend service role can modify account roles or statuses.';
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

-- ------------------------------------------------------------------------------
-- 4. Admin Email OTP Generation & Verification RPCs
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_admin_otp(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_otp TEXT;
  v_salt TEXT;
  v_hash TEXT;
BEGIN
  -- Check user exists and is an active administrator
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = LOWER(TRIM(p_email)) AND role = 'admin' AND status = 'active';

  IF NOT FOUND THEN
    -- Generic response to prevent user enumeration
    RETURN jsonb_build_object('success', true, 'message', 'Verification code dispatched if account eligible.');
  END IF;

  -- Generate 6-digit OTP
  v_otp := lpad(floor(random() * 1000000)::text, 6, '0');
  v_salt := gen_salt('bf');
  v_hash := crypt(v_otp, v_salt);

  -- Invalidate prior unused OTPs
  UPDATE public.admin_otps
  SET used_at = now()
  WHERE user_id = v_user_id AND used_at IS NULL;

  -- Store hashed OTP valid for 10 minutes
  INSERT INTO public.admin_otps (
    user_id,
    email,
    otp_hash,
    salt,
    expires_at
  ) VALUES (
    v_user_id,
    LOWER(TRIM(p_email)),
    v_hash,
    v_salt,
    now() + interval '10 minutes'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Verification OTP dispatched to administrator email.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_otp(p_email TEXT, p_otp TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM public.admin_otps
  WHERE email = LOWER(TRIM(p_email))
    AND used_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired verification code.');
  END IF;

  IF v_record.attempts_count >= v_record.max_attempts THEN
    RETURN jsonb_build_object('success', false, 'message', 'Maximum verification attempts exceeded. Please request a new code.');
  END IF;

  -- Verify hash
  IF crypt(p_otp, v_record.otp_hash) = v_record.otp_hash THEN
    UPDATE public.admin_otps
    SET used_at = now()
    WHERE id = v_record.id;

    RETURN jsonb_build_object('success', true, 'message', 'OTP verified successfully.');
  ELSE
    UPDATE public.admin_otps
    SET attempts_count = attempts_count + 1
    WHERE id = v_record.id;

    RETURN jsonb_build_object('success', false, 'message', 'Incorrect verification code. Please try again.');
  END IF;
END;
$$;
