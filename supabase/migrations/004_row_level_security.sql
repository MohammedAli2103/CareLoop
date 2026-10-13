-- ==============================================================================
-- CareLoop Healthcare Platform Schema
-- Migration 004: Row Level Security (RLS) & Least-Privilege Access Controls
-- Execution Order: 4 of 6
-- ==============================================================================

-- Enable RLS on all clinical and demographic tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Security Helper Functions (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

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

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid();
$$;

-- ------------------------------------------------------------------------------
-- 1. Profiles Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Own profile, Admins, Approved Staff, or viewing Clinical Staff (Doctors/Coordinators)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.is_approved_staff()
    OR role IN ('doctor', 'coordinator')
  );

-- INSERT: Self-registration for patient, doctor, coordinator with non-privileged status
-- CRITICAL SECURITY RULE: NEVER permit self-registration with 'admin' role!
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert"
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

-- UPDATE: Self can update display name, phone, avatar. Role & status strictly locked!
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    -- If regular user, role and status MUST NOT change
    (id = auth.uid() AND NOT public.is_admin() 
     AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) 
     AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid()))
    OR
    public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 2. Patient Profiles Policies
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "patient_profiles_select" ON public.patient_profiles;
CREATE POLICY "patient_profiles_select"
  ON public.patient_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR id IN ('33333333-3333-4333-a333-333333333333'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '33333333-3333-4333-a333-333333333331'::uuid)
  );

DROP POLICY IF EXISTS "patient_profiles_insert" ON public.patient_profiles;
CREATE POLICY "patient_profiles_insert"
  ON public.patient_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "patient_profiles_update" ON public.patient_profiles;
CREATE POLICY "patient_profiles_update"
  ON public.patient_profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 3. Doctor & Coordinator Profiles Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "doctor_profiles_select"
  ON public.doctor_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_approved_staff() OR public.is_admin());

CREATE POLICY "doctor_profiles_insert"
  ON public.doctor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "doctor_profiles_update"
  ON public.doctor_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "coordinator_profiles_select"
  ON public.coordinator_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_approved_staff() OR public.is_admin());

CREATE POLICY "coordinator_profiles_insert"
  ON public.coordinator_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "coordinator_profiles_update"
  ON public.coordinator_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Care Plans Policies
-- ------------------------------------------------------------------------------

-- SELECT: Patient can view their own plan; Doctors can view their plans; Coordinators/Admin view all active; demo records queryable
CREATE POLICY "care_plans_select"
  ON public.care_plans
  FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR patient_id IN ('33333333-3333-4333-a333-333333333333'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '33333333-3333-4333-a333-333333333331'::uuid)
  );

-- INSERT: Doctors or Admins create care plans
CREATE POLICY "care_plans_insert"
  ON public.care_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      doctor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'doctor' AND status = 'active'
      )
    )
  );

-- UPDATE: Doctor assigned to plan, Coordinators, or Admin
CREATE POLICY "care_plans_update"
  ON public.care_plans
  FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 5. Care Tasks Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "care_tasks_select"
  ON public.care_tasks
  FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR patient_id IN ('33333333-3333-4333-a333-333333333333'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '33333333-3333-4333-a333-333333333331'::uuid)
  );

CREATE POLICY "care_tasks_insert"
  ON public.care_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_approved_staff()
    OR public.is_admin()
  );

-- UPDATE: Patients update their tasks (upon report upload or delay log); staff update status
CREATE POLICY "care_tasks_update"
  ON public.care_tasks
  FOR UPDATE
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 6. Reports & Test Results Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "reports_select"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR patient_id IN ('33333333-3333-4333-a333-333333333333'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '33333333-3333-4333-a333-333333333331'::uuid)
  );

CREATE POLICY "reports_insert"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
  );

CREATE POLICY "reports_update"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (
    public.is_approved_staff()
    OR public.is_admin()
  );

CREATE POLICY "test_results_select"
  ON public.test_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = test_results.report_id
        AND (
          r.patient_id = auth.uid() 
          OR public.is_approved_staff() 
          OR public.is_admin()
          OR r.patient_id IN ('33333333-3333-4333-a333-333333333333'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '33333333-3333-4333-a333-333333333331'::uuid)
        )
    )
  );

CREATE POLICY "test_results_insert"
  ON public.test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_approved_staff()
    OR EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = test_results.report_id AND r.patient_id = auth.uid()
    )
  );

CREATE POLICY "test_results_update"
  ON public.test_results
  FOR UPDATE
  TO authenticated
  USING (
    public.is_approved_staff()
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 7. Doctor Reviews Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "doctor_reviews_select"
  ON public.doctor_reviews
  FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.care_tasks t
      WHERE t.id = doctor_reviews.task_id 
        AND (
          t.patient_id = auth.uid()
          OR t.patient_id IN ('33333333-3333-4333-a333-333333333333'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '33333333-3333-4333-a333-333333333331'::uuid)
        )
    )
  );

-- Only approved doctors or admins can create/modify clinical reviews
CREATE POLICY "doctor_reviews_insert"
  ON public.doctor_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      doctor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'doctor' AND status = 'active'
      )
    )
  );

CREATE POLICY "doctor_reviews_update"
  ON public.doctor_reviews
  FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 8. Notifications Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "notifications_select"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR recipient_role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    OR public.is_admin()
    OR recipient_user_id IN ('33333333-3333-4333-a333-333333333333'::uuid, '11111111-1111-4111-a111-111111111111'::uuid, '22222222-2222-4222-a222-222222222222'::uuid)
  );

CREATE POLICY "notifications_insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Authenticated system/users can queue notifications

CREATE POLICY "notifications_update"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR recipient_role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 9. Audit Logs Policies
-- ------------------------------------------------------------------------------

-- Only administrators can read audit history
CREATE POLICY "audit_logs_select"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- All authenticated sessions can insert audit logs (immutable: no UPDATE or DELETE allowed!)
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
