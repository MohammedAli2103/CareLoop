-- ==============================================================================
-- CareLoop / CareBridge Healthcare Platform Schema
-- Migration 002: Row Level Security (RLS) & Role-Based Access Control
-- ==============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinator_profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Security Helper Functions
-- ------------------------------------------------------------------------------

-- Check if current authenticated user is an active Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  );
$$;

-- Check if current authenticated user is an approved staff member
CREATE OR REPLACE FUNCTION public.is_approved_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('doctor', 'coordinator', 'admin')
      AND status = 'active'
  );
$$;

-- ------------------------------------------------------------------------------
-- Profiles Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Users can view their own profile, Admins can view all, Approved Staff can view fellow staff & patients
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (public.is_approved_staff() AND role IN ('patient', 'doctor', 'coordinator'))
  );

-- INSERT: Self-registration for patient, doctor, coordinator with strict default status.
-- NEVER permit direct self-registration with 'admin' role!
CREATE POLICY "profiles_insert_self"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND (
      (role = 'patient' AND status = 'active')
      OR
      (role = 'doctor' AND status = 'pending')
      OR
      (role = 'coordinator' AND status = 'pending')
    )
  );

-- UPDATE: Users can update their own non-privileged details (full_name, phone, avatar_url).
-- Only Admins can modify status or role!
CREATE POLICY "profiles_update_self"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    -- If regular user updating own profile, role and status must not be changed
    (id = auth.uid() AND NOT public.is_admin() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid()))
    OR
    public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- Patient Profiles Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Patient accesses their own details; approved doctors/coordinators & admins can access
CREATE POLICY "patient_profiles_select"
  ON public.patient_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
  );

-- INSERT: Patients can insert their own record during signup
CREATE POLICY "patient_profiles_insert"
  ON public.patient_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: Patients can update their own record; admin can manage
CREATE POLICY "patient_profiles_update"
  ON public.patient_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- Doctor Profiles Table Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "doctor_profiles_select"
  ON public.doctor_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.is_approved_staff()
  );

CREATE POLICY "doctor_profiles_insert"
  ON public.doctor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "doctor_profiles_update"
  ON public.doctor_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- Coordinator Profiles Table Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "coordinator_profiles_select"
  ON public.coordinator_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.is_approved_staff()
  );

CREATE POLICY "coordinator_profiles_insert"
  ON public.coordinator_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "coordinator_profiles_update"
  ON public.coordinator_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());
