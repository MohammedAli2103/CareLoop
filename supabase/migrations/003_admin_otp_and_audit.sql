-- ==============================================================================
-- CareLoop / CareBridge Healthcare Platform Schema
-- Migration 003: Administrator Security, Email OTP, and Audit Trails
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Audit Logs Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only administrators can read audit logs
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Authenticated users or security definer functions can record audit events
CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Admin OTPs Table (Hashed, Single-Use, Rate-Limited, Expiry)
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

-- Regular users cannot directly query admin_otps; only accessible via Security Definer RPCs or Edge Function
CREATE POLICY "admin_otps_no_direct_client_access"
  ON public.admin_otps
  FOR ALL
  TO authenticated
  USING (false);

-- ------------------------------------------------------------------------------
-- Stored Procedures (Security Definer RPCs)
-- ------------------------------------------------------------------------------

-- RPC: Approve Staff Member (Doctor or Coordinator)
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
  -- Strict permission check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only active administrators can approve staff.';
  END IF;

  SELECT role, email, full_name INTO v_role, v_email, v_name
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  IF v_role NOT IN ('doctor', 'coordinator') THEN
    RAISE EXCEPTION 'Invalid role for approval: %', v_role;
  END IF;

  -- Update profiles status
  UPDATE public.profiles
  SET status = 'active', updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  -- Update role specific record
  IF v_role = 'doctor' THEN
    UPDATE public.doctor_profiles
    SET approved_at = timezone('utc'::text, now()),
        approved_by = auth.uid(),
        rejection_reason = NULL
    WHERE id = target_user_id;
  ELSIF v_role = 'coordinator' THEN
    UPDATE public.coordinator_profiles
    SET approved_at = timezone('utc'::text, now()),
        approved_by = auth.uid(),
        rejection_reason = NULL
    WHERE id = target_user_id;
  END IF;

  -- Record audit trail
  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    target_id,
    target_type,
    details
  ) VALUES (
    auth.uid(),
    'admin',
    'STAFF_APPROVED',
    target_user_id,
    v_role,
    jsonb_build_object(
      'target_name', v_name,
      'target_email', v_email,
      'approved_at', timezone('utc'::text, now())
    )
  );

  RETURN jsonb_build_object('success', true, 'message', format('%s approved successfully.', v_name));
END;
$$;

-- RPC: Reject Staff Member
CREATE OR REPLACE FUNCTION public.reject_staff(target_user_id UUID, p_reason TEXT DEFAULT 'Profile does not meet platform requirements')
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
    RAISE EXCEPTION 'Access denied: Only active administrators can reject staff.';
  END IF;

  SELECT role, email, full_name INTO v_role, v_email, v_name
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  UPDATE public.profiles
  SET status = 'rejected', updated_at = timezone('utc'::text, now())
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
    actor_role,
    action,
    target_id,
    target_type,
    details
  ) VALUES (
    auth.uid(),
    'admin',
    'STAFF_REJECTED',
    target_user_id,
    v_role,
    jsonb_build_object(
      'target_name', v_name,
      'target_email', v_email,
      'rejection_reason', p_reason,
      'rejected_at', timezone('utc'::text, now())
    )
  );

  RETURN jsonb_build_object('success', true, 'message', format('%s request rejected.', v_name));
END;
$$;

-- RPC: Verify Admin OTP
CREATE OR REPLACE FUNCTION public.verify_admin_otp(p_user_id UUID, p_otp_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_calculated_hash TEXT;
BEGIN
  -- Look for the latest unexpired, unused OTP record
  SELECT * INTO v_record
  FROM public.admin_otps
  WHERE user_id = p_user_id
    AND used_at IS NULL
    AND expires_at > timezone('utc'::text, now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'OTP has expired or no pending verification found. Please request a new code.'
    );
  END IF;

  -- Check max attempts
  IF v_record.attempts_count >= v_record.max_attempts THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Maximum OTP verification attempts exceeded. Please request a new code.'
    );
  END IF;

  -- Calculate SHA-256 hash using salt
  v_calculated_hash := encode(digest(v_record.salt || p_otp_code, 'sha256'), 'hex');

  IF v_calculated_hash = v_record.otp_hash THEN
    -- Successful OTP
    UPDATE public.admin_otps
    SET used_at = timezone('utc'::text, now())
    WHERE id = v_record.id;

    -- Record audit log
    INSERT INTO public.audit_logs (
      actor_id,
      actor_role,
      action,
      target_id,
      target_type,
      details
    ) VALUES (
      p_user_id,
      'admin',
      'ADMIN_OTP_VERIFIED',
      p_user_id,
      'admin_auth',
      jsonb_build_object('email', v_record.email, 'verified_at', timezone('utc'::text, now()))
    );

    RETURN jsonb_build_object('success', true, 'message', 'OTP verified successfully.');
  ELSE
    -- Increment attempts
    UPDATE public.admin_otps
    SET attempts_count = attempts_count + 1
    WHERE id = v_record.id;

    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid OTP code. %s attempts remaining.', v_record.max_attempts - (v_record.attempts_count + 1))
    );
  END IF;
END;
$$;
