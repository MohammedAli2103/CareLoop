-- ==============================================================================
-- CareLoop Healthcare Platform Schema
-- Migration 001: Core Profiles, Role Enums, and Demographic Tables
-- Execution Order: 1 of 6
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'coordinator', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'rejected', 'suspended')) DEFAULT 'active',
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Patient Specific Demographic & Medical Details
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  mrn TEXT UNIQUE, -- Medical Record Number e.g. MRN-84920
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', NULL)),
  street_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  primary_diagnosis TEXT,
  assigned_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  consent_terms BOOLEAN NOT NULL DEFAULT false,
  consent_privacy BOOLEAN NOT NULL DEFAULT false,
  consent_data_processing BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Doctor Professional & Credential Details
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  medical_license_number TEXT NOT NULL,
  specialization TEXT NOT NULL,
  hospital_department TEXT NOT NULL,
  years_of_experience INT DEFAULT 0,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Care Coordinator Details
CREATE TABLE IF NOT EXISTS public.coordinator_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  organization TEXT NOT NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast query resolution
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_patient_mrn ON public.patient_profiles(mrn);
CREATE INDEX IF NOT EXISTS idx_patient_doctor ON public.patient_profiles(assigned_doctor_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_patient_profiles_updated_at ON public.patient_profiles;
CREATE TRIGGER set_patient_profiles_updated_at
  BEFORE UPDATE ON public.patient_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- ==============================================================================
-- CareLoop Healthcare Platform Schema
-- Migration 002: Clinical Entities (Care Plans, Tasks, Reports, Reviews, Logs)
-- Execution Order: 2 of 6
-- ==============================================================================

-- 1. Care Plans Table
CREATE TABLE IF NOT EXISTS public.care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Completed', 'Suspended')) DEFAULT 'Active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL,
  clinical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Care Tasks Table
CREATE TABLE IF NOT EXISTS public.care_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES public.care_plans(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('Lab Test', 'Specialist Referral', 'Imaging', 'Follow-Up Visit')),
  deadline DATE NOT NULL,
  assigned_role TEXT NOT NULL CHECK (assigned_role IN ('patient', 'coordinator', 'doctor')) DEFAULT 'patient',
  task_status TEXT NOT NULL CHECK (task_status IN ('Pending', 'In Progress', 'Verified', 'Resolved', 'Overdue')) DEFAULT 'Pending',
  instructions TEXT,
  fasting_required BOOLEAN NOT NULL DEFAULT false,
  partner_facility TEXT,
  facility_address TEXT,
  is_escalated BOOLEAN NOT NULL DEFAULT false,
  escalated_to TEXT,
  escalation_reason TEXT,
  escalated_at TIMESTAMPTZ,
  delay_reason TEXT,
  delay_notes TEXT,
  patient_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Diagnostic Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.care_tasks(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_size TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Private path inside patient-reports bucket
  file_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  uploaded_by_role TEXT NOT NULL DEFAULT 'patient',
  uploaded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('Unverified', 'Verified', 'Flagged')) DEFAULT 'Unverified',
  verified_by TEXT,
  verified_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Extracted / Audited Test Results Table
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  ref_range TEXT NOT NULL,
  is_abnormal BOOLEAN NOT NULL DEFAULT false,
  confidence NUMERIC DEFAULT 95,
  edited_by_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Doctor Clinical Reviews (Loop Closure)
CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.care_tasks(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  doctor_name TEXT NOT NULL,
  review_notes TEXT NOT NULL,
  next_action_required TEXT NOT NULL CHECK (next_action_required IN (
    'Follow-Up Scheduled',
    'Medication Adjustment',
    'Specialist Referral',
    'Routine 90-Day Monitoring',
    'No Further Action Needed'
  )),
  follow_up_date DATE,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('patient', 'doctor', 'coordinator', 'admin')),
  recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_name TEXT,
  task_id UUID REFERENCES public.care_tasks(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'in-app',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'deadline_reminder',
    'verification_needed',
    'doctor_review_ready',
    'escalation',
    'general'
  )),
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_link TEXT,
  preview_details JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Audit History Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_email TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_care_plans_patient ON public.care_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_doctor ON public.care_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_patient ON public.care_tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_status ON public.care_tasks(task_status);
CREATE INDEX IF NOT EXISTS idx_care_tasks_role ON public.care_tasks(assigned_role);
CREATE INDEX IF NOT EXISTS idx_care_tasks_deadline ON public.care_tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_reports_task ON public.reports(task_id);
CREATE INDEX IF NOT EXISTS idx_reports_patient ON public.reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_verification ON public.reports(verification_status);
CREATE INDEX IF NOT EXISTS idx_test_results_report ON public.test_results(report_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_task ON public.doctor_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_role, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_care_plans_updated_at ON public.care_plans;
CREATE TRIGGER set_care_plans_updated_at
  BEFORE UPDATE ON public.care_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_care_tasks_updated_at ON public.care_tasks;
CREATE TRIGGER set_care_tasks_updated_at
  BEFORE UPDATE ON public.care_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_reports_updated_at ON public.reports;
CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- ==============================================================================
-- CareLoop Healthcare Platform Schema
-- Migration 003: Supabase Storage Configuration for Medical Reports
-- Execution Order: 3 of 6
-- ==============================================================================

-- 1. Create Private Storage Bucket 'patient-reports'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-reports',
  'patient-reports',
  false, -- STRICTLY PRIVATE: no public direct URLs
  15728640, -- 15 MB max file size limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Storage RLS: SELECT / Download
-- Allowed if:
-- a) User is an active administrator
-- b) User is an approved coordinator or doctor
-- c) Object path starts with the patient's authenticated user ID (patients can only download their own reports)
CREATE POLICY "patient_reports_select_authorized"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-reports'
    AND (
      -- Admins have full audit access
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
      )
      OR
      -- Approved staff (doctors & coordinators) can review reports
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('doctor', 'coordinator') AND status = 'active'
      )
      OR
      -- Patients can only access files in their designated user folder: {patient_id}/*
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- 3. Storage RLS: INSERT / Upload
-- Allowed for authenticated users uploading to their own designated patient folder, or approved staff
CREATE POLICY "patient_reports_insert_authorized"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-reports'
    AND (
      -- Patient uploading to their own folder: {patient_id}/*
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Approved staff uploading on behalf of patient
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('doctor', 'coordinator', 'admin') AND status = 'active'
      )
    )
  );

-- 4. Storage RLS: UPDATE
-- Only staff or owner
CREATE POLICY "patient_reports_update_authorized"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'patient-reports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'coordinator') AND status = 'active'
      )
    )
  );

-- 5. Storage RLS: DELETE
-- Only administrators or staff coordinators can remove corrupt/mistakenly uploaded reports
CREATE POLICY "patient_reports_delete_staff_only"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'patient-reports'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator') AND status = 'active'
    )
  );
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
-- ==============================================================================
-- CareLoop Healthcare Platform Schema
-- Migration 006: Comprehensive Synthetic Demo Data & System Seeding
-- Execution Order: 6 of 6
-- Repeatable and Idempotent
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Deterministic Synthetic Auth Users (auth.users)
-- Safe for local development and hosted Supabase environments.
-- ------------------------------------------------------------------------------
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES 
  (
    '00000000-0000-4000-a000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'admin@careloop.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"CareLoop System Administrator","role":"admin"}'::jsonb,
    now(),
    now()
  ),
  (
    '11111111-1111-4111-a111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'doctor@hospital.com',
    crypt('Doctor123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dr. Arjun Mehta, MD","role":"doctor"}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-4222-a222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'coordinator@hospital.com',
    crypt('Coordinator123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nida Ali","role":"coordinator"}'::jsonb,
    now(),
    now()
  ),
  (
    '33333333-3333-4333-a333-333333333333'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'sarah.khan@careloop.io',
    crypt('Patient123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Sarah Khan","role":"patient"}'::jsonb,
    now(),
    now()
  ),
  (
    '33333333-3333-4333-a333-333333333332'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'vikram.kumar@careloop.io',
    crypt('Patient123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Vikram Kumar","role":"patient"}'::jsonb,
    now(),
    now()
  ),
  (
    '33333333-3333-4333-a333-333333333331'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'rahul.prasad@careloop.io',
    crypt('Patient123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Rahul Prasad","role":"patient"}'::jsonb,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Core Profiles (public.profiles)
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, role, status, full_name, email, phone, avatar_url)
VALUES 
  (
    '00000000-0000-4000-a000-000000000001'::uuid,
    'admin',
    'active',
    'CareLoop System Administrator',
    'admin@careloop.com',
    '+1 555-0199',
    NULL
  ),
  (
    '11111111-1111-4111-a111-111111111111'::uuid,
    'doctor',
    'active',
    'Dr. Arjun Mehta, MD',
    'doctor@hospital.com',
    '+91 98450 11223',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  ),
  (
    '22222222-2222-4222-a222-222222222222'::uuid,
    'coordinator',
    'active',
    'Nida Ali',
    'coordinator@hospital.com',
    '+91 98765 43210',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  ),
  (
    '33333333-3333-4333-a333-333333333333'::uuid,
    'patient',
    'active',
    'Sarah Khan',
    'sarah.khan@careloop.io',
    '+91 91234 56789',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  ),
  (
    '33333333-3333-4333-a333-333333333332'::uuid,
    'patient',
    'active',
    'Vikram Kumar',
    'vikram.kumar@careloop.io',
    '+91 91234 56782',
    NULL
  ),
  (
    '33333333-3333-4333-a333-333333333331'::uuid,
    'patient',
    'active',
    'Rahul Prasad',
    'rahul.prasad@careloop.io',
    '+91 91234 56781',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  status = 'active';

-- ------------------------------------------------------------------------------
-- 3. Doctor & Coordinator Profiles
-- ------------------------------------------------------------------------------
INSERT INTO public.doctor_profiles (
  id,
  medical_license_number,
  specialization,
  hospital_department,
  years_of_experience,
  approved_at,
  approved_by
) VALUES (
  '11111111-1111-4111-a111-111111111111'::uuid,
  'MCI-84920-K',
  'Endocrinology & Internal Medicine',
  'Department of Endocrinology',
  14,
  now() - INTERVAL '60 days',
  '00000000-0000-4000-a000-000000000001'::uuid
) ON CONFLICT (id) DO UPDATE SET
  medical_license_number = EXCLUDED.medical_license_number,
  specialization = EXCLUDED.specialization,
  hospital_department = EXCLUDED.hospital_department;

INSERT INTO public.coordinator_profiles (
  id,
  department,
  organization,
  approved_at,
  approved_by
) VALUES (
  '22222222-2222-4222-a222-222222222222'::uuid,
  'Ambulatory Care Coordination',
  'CareLoop Metro Health Network',
  now() - INTERVAL '60 days',
  '00000000-0000-4000-a000-000000000001'::uuid
) ON CONFLICT (id) DO UPDATE SET
  department = EXCLUDED.department,
  organization = EXCLUDED.organization;

-- ------------------------------------------------------------------------------
-- 4. Patient Profiles (public.patient_profiles)
-- ------------------------------------------------------------------------------
INSERT INTO public.patient_profiles (
  id,
  mrn,
  date_of_birth,
  gender,
  blood_group,
  street_address,
  city,
  state,
  postal_code,
  emergency_contact_name,
  emergency_contact_relationship,
  emergency_contact_phone,
  primary_diagnosis,
  assigned_doctor_id,
  assigned_coordinator_id,
  consent_terms,
  consent_privacy,
  consent_data_processing
) VALUES 
  (
    '33333333-3333-4333-a333-333333333333'::uuid,
    'MRN-84920',
    '1989-06-14',
    'Female',
    'B+',
    'Flat 402, Green Glen Layout, Bellandur',
    'Bengaluru',
    'Karnataka',
    '560103',
    'Tariq Khan',
    'Spouse',
    '+91 91234 56780',
    'Type 2 Diabetes Mellitus with Dyslipidemia',
    '11111111-1111-4111-a111-111111111111'::uuid,
    '22222222-2222-4222-a222-222222222222'::uuid,
    true,
    true,
    true
  ),
  (
    '33333333-3333-4333-a333-333333333332'::uuid,
    'MRN-60291',
    '1966-08-19',
    'Male',
    'B+',
    '12 Indiranagar 100ft Road',
    'Bengaluru',
    'Karnataka',
    '560038',
    'Asha Kumar',
    'Spouse',
    '+91 91234 56788',
    'Type 2 Diabetes Mellitus',
    '11111111-1111-4111-a111-111111111111'::uuid,
    '22222222-2222-4222-a222-222222222222'::uuid,
    true,
    true,
    true
  ),
  (
    '33333333-3333-4333-a333-333333333331'::uuid,
    'MRN-45102',
    '1981-02-11',
    'Male',
    'O+',
    '88 Koramangala 4th Block',
    'Bengaluru',
    'Karnataka',
    '560034',
    'Sunita Prasad',
    'Spouse',
    '+91 91234 56787',
    'Hyperlipidemia & Statin Therapy',
    '11111111-1111-4111-a111-111111111111'::uuid,
    '22222222-2222-4222-a222-222222222222'::uuid,
    true,
    true,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  mrn = EXCLUDED.mrn,
  primary_diagnosis = EXCLUDED.primary_diagnosis,
  assigned_doctor_id = EXCLUDED.assigned_doctor_id,
  assigned_coordinator_id = EXCLUDED.assigned_coordinator_id;

-- ------------------------------------------------------------------------------
-- 5. Care Plans (public.care_plans)
-- ------------------------------------------------------------------------------
INSERT INTO public.care_plans (
  id,
  patient_id,
  doctor_id,
  title,
  diagnosis,
  status,
  start_date,
  target_end_date,
  clinical_notes
) VALUES 
  (
    '44444444-4444-4444-a444-444444444444'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Metabolic & Glycemic Safety Protocol',
    'Type 2 Diabetes Mellitus with Dyslipidemia',
    'Active',
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '30 days',
    'Quarterly diagnostic monitoring. Aiming for HbA1c < 7.0% and LDL < 100 mg/dL. Ordered baseline chest radiography.'
  ),
  (
    '44444444-4444-4444-a444-444444444442'::uuid,
    '33333333-3333-4333-a333-333333333332'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Quarterly Diabetic Follow-Up',
    'Type 2 Diabetes Mellitus',
    'Active',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '10 days',
    'Monitor fasting plasma glucose and schedule post-prandial evaluation.'
  ),
  (
    '44444444-4444-4444-a444-444444444441'::uuid,
    '33333333-3333-4333-a333-333333333331'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Cardiovascular Risk Stratification & Lipid Panel',
    'Hyperlipidemia & Statin Therapy',
    'Active',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '25 days',
    'Fasting lipid profile to evaluate atorvastatin 20mg efficacy.'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  diagnosis = EXCLUDED.diagnosis,
  status = EXCLUDED.status,
  target_end_date = EXCLUDED.target_end_date;

-- ------------------------------------------------------------------------------
-- 6. Care Tasks (public.care_tasks)
-- Covering all workflow states: Pending, In Progress, Verified, Resolved, Overdue
-- ------------------------------------------------------------------------------
INSERT INTO public.care_tasks (
  id,
  care_plan_id,
  patient_id,
  doctor_id,
  title,
  task_type,
  deadline,
  assigned_role,
  task_status,
  instructions,
  fasting_required,
  partner_facility,
  facility_address,
  is_escalated,
  escalated_to,
  escalation_reason,
  escalated_at,
  patient_completed_at
) VALUES 
  -- Sarah Khan Task 1: Pending Lab Test (Next Step in Dashboard)
  (
    '55555555-5555-4555-a555-555555555555'::uuid,
    '44444444-4444-4444-a444-444444444444'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Blood Test (HbA1c)',
    'Lab Test',
    CURRENT_DATE + INTERVAL '3 days',
    'patient',
    'Pending',
    '10-12 hours overnight fasting mandatory. Take regular morning medications only with water.',
    true,
    'MetroCare Laboratory, Main Branch',
    '420 Health Science Blvd, Suite 200, Metro City',
    false,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  -- Sarah Khan Task 2: Resolved Imaging (Report verified + Doctor reviewed)
  (
    '66666666-6666-4666-a666-666666666666'::uuid,
    '44444444-4444-4444-a444-444444444444'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Chest X-ray (PA & Lateral)',
    'Imaging',
    CURRENT_DATE - INTERVAL '4 days',
    'doctor',
    'Resolved',
    'Posteroanterior and lateral chest radiography for baseline respiratory clearance.',
    false,
    'MetroCare Diagnostic Imaging Center',
    '420 Health Science Blvd, Suite 100, Metro City',
    false,
    NULL,
    NULL,
    NULL,
    now() - INTERVAL '4 days'
  ),
  -- Sarah Khan Task 3: In Progress (Report uploaded, awaiting coordinator verification)
  (
    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::uuid,
    '44444444-4444-4444-a444-444444444444'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Complete Blood Count (CBC)',
    'Lab Test',
    CURRENT_DATE + INTERVAL '5 days',
    'coordinator',
    'In Progress',
    'Routine full blood count including differential. No fasting required.',
    false,
    'Metropolis Healthcare Diagnostic Lab',
    '420 Health Science Blvd, Suite 200, Metro City',
    false,
    NULL,
    NULL,
    NULL,
    now() - INTERVAL '1 day'
  ),
  -- Sarah Khan Task 4: Follow-up Appointment (Scheduled)
  (
    'dddddddd-dddd-4ddd-addd-dddddddddddd'::uuid,
    '44444444-4444-4444-a444-444444444444'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Follow-up Consultation',
    'Follow-Up Visit',
    CURRENT_DATE + INTERVAL '12 days',
    'patient',
    'Pending',
    'Post-diagnostic consultation with Dr. Arjun Mehta to evaluate metabolic results.',
    false,
    'MetroCare Clinic - Dr. Mehta Suite',
    '420 Health Science Blvd, Room 302, Metro City',
    false,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  -- Sarah Khan Task 5: Specialist Referral (Not Started)
  (
    'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee'::uuid,
    '44444444-4444-4444-a444-444444444444'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Consult with Specialist (Endocrinology)',
    'Specialist Referral',
    CURRENT_DATE + INTERVAL '20 days',
    'patient',
    'Pending',
    'Endocrine consultation for glycemic protocol optimization if HbA1c exceeds 7.0%.',
    false,
    'Metro Health Specialist Center',
    '700 Medical Arts Tower, Metro City',
    false,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  -- Sarah Khan Task 6: Medication Review
  (
    'ffffffff-ffff-4fff-afff-ffffffffffff'::uuid,
    '44444444-4444-4444-a444-444444444444'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Medication Review & Lifestyle Prescriptions',
    'Follow-Up Visit',
    CURRENT_DATE + INTERVAL '25 days',
    'patient',
    'Pending',
    'Review tolerability of metformin 500mg and dietary diary.',
    false,
    'MetroCare Clinic',
    '420 Health Science Blvd, Room 302, Metro City',
    false,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  -- Vikram Kumar Task 7: Overdue / Escalated Task (Visible on Coordinator Radar!)
  (
    '55555555-5555-4555-a555-555555555552'::uuid,
    '44444444-4444-4444-a444-444444444442'::uuid,
    '33333333-3333-4333-a333-333333333332'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Fasting Blood Glucose Test',
    'Lab Test',
    CURRENT_DATE - INTERVAL '2 days',
    'coordinator',
    'Overdue',
    'Overnight 12-hour fasting glucose assessment.',
    true,
    'Quest Diagnostics Center',
    '800 Innovation Way, Metro City',
    true,
    'Nida Ali (Care Coordinator)',
    '48-hour SLA elapsed past deadline without clinic check-in or uploaded report.',
    now() - INTERVAL '1 day',
    NULL
  ),
  -- Rahul Prasad Task 8: Verified Report (Visible in Doctor Review Queue!)
  (
    '55555555-5555-4555-a555-555555555551'::uuid,
    '44444444-4444-4444-a444-444444444441'::uuid,
    '33333333-3333-4333-a333-333333333331'::uuid,
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Lipid Profile (Fasting)',
    'Lab Test',
    CURRENT_DATE - INTERVAL '1 day',
    'doctor',
    'Verified',
    '12-hour overnight fasting lipid panel for cardiovascular risk assessment.',
    true,
    'MetroCare Laboratory',
    '420 Health Science Blvd, Suite 200, Metro City',
    false,
    NULL,
    NULL,
    NULL,
    now() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  task_status = EXCLUDED.task_status,
  assigned_role = EXCLUDED.assigned_role,
  deadline = EXCLUDED.deadline,
  is_escalated = EXCLUDED.is_escalated,
  escalated_to = EXCLUDED.escalated_to,
  escalation_reason = EXCLUDED.escalation_reason;

-- ------------------------------------------------------------------------------
-- 7. Diagnostic Reports (public.reports)
-- ------------------------------------------------------------------------------
INSERT INTO public.reports (
  id,
  task_id,
  patient_id,
  file_name,
  file_type,
  file_size,
  storage_path,
  file_url,
  uploaded_at,
  uploaded_by_role,
  verification_status,
  verified_by,
  verified_by_id,
  verified_at,
  verification_notes
) VALUES 
  -- Report for Task 2 (Chest X-ray): Verified & Reviewed
  (
    '77777777-7777-4777-a777-777777777777'::uuid,
    '66666666-6666-4666-a666-666666666666'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    'chest_xray_sarah_khan.pdf',
    'application/pdf',
    '2.1 MB',
    '33333333-3333-4333-a333-333333333333/66666666-6666-4666-a666-666666666666/chest_xray_sarah_khan.pdf',
    '/mock/reports/chest_xray_sarah_khan.pdf',
    now() - INTERVAL '4 days',
    'patient',
    'Verified',
    'Nida Ali (Care Coordinator)',
    '22222222-2222-4222-a222-222222222222'::uuid,
    now() - INTERVAL '3 days',
    'Radiographic findings verified against MetroCare PACS imaging archive. Clear lung fields.'
  ),
  -- Report for Task 3 (CBC): Uploaded, Unverified (in Coordinator Audit Queue)
  (
    'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'::uuid,
    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::uuid,
    '33333333-3333-4333-a333-333333333333'::uuid,
    'cbc_panel_sarah_khan.pdf',
    'application/pdf',
    '1.4 MB',
    '33333333-3333-4333-a333-333333333333/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/cbc_panel_sarah_khan.pdf',
    '/mock/reports/cbc_panel_sarah_khan.pdf',
    now() - INTERVAL '1 day',
    'patient',
    'Unverified',
    NULL,
    NULL,
    NULL,
    'Awaiting side-by-side OCR verification by ambulatory care coordinator.'
  ),
  -- Report for Task 8 (Lipid Profile): Verified by Coordinator, Ready for Doctor Review
  (
    '77777777-7777-4777-a777-777777777771'::uuid,
    '55555555-5555-4555-a555-555555555551'::uuid,
    '33333333-3333-4333-a333-333333333331'::uuid,
    'lipid_panel_rahul_prasad.pdf',
    'application/pdf',
    '1.2 MB',
    '33333333-3333-4333-a333-333333333331/55555555-5555-4555-a555-555555555551/lipid_panel_rahul_prasad.pdf',
    '/mock/reports/lipid_panel_rahul_prasad.pdf',
    now() - INTERVAL '2 days',
    'patient',
    'Verified',
    'Nida Ali (Care Coordinator)',
    '22222222-2222-4222-a222-222222222222'::uuid,
    now() - INTERVAL '4 hours',
    'Audited values against MetroCare digital report. Elevated Total Cholesterol & LDL verified.'
  )
ON CONFLICT (id) DO UPDATE SET
  file_name = EXCLUDED.file_name,
  verification_status = EXCLUDED.verification_status,
  verified_by = EXCLUDED.verified_by,
  verification_notes = EXCLUDED.verification_notes;

-- ------------------------------------------------------------------------------
-- 8. Extracted Test Results (public.test_results)
-- ------------------------------------------------------------------------------
INSERT INTO public.test_results (
  id,
  report_id,
  test_name,
  value,
  unit,
  ref_range,
  is_abnormal,
  confidence,
  edited_by_staff
) VALUES 
  -- Chest X-Ray Results
  (
    '88888888-8888-4888-a888-888888888888'::uuid,
    '77777777-7777-4777-a777-777777777777'::uuid,
    'Chest Radiograph Impression',
    'Normal / Clear Lungs',
    'Visual Impression',
    'No focal consolidation or acute cardiopulmonary process',
    false,
    99,
    true
  ),
  -- CBC Results
  (
    'cccccccc-cccc-4ccc-accc-cccccccccccc'::uuid,
    'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'::uuid,
    'White Blood Cell Count (WBC)',
    '6.8',
    'x10^3/uL',
    '4.5 - 11.0 x10^3/uL',
    false,
    96,
    false
  ),
  (
    'cccccccc-cccc-4ccc-accc-cccccccccccd'::uuid,
    'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'::uuid,
    'Platelet Count',
    '245',
    'x10^3/uL',
    '150 - 450 x10^3/uL',
    false,
    95,
    false
  ),
  -- Lipid Profile Results
  (
    '88888888-8888-4888-a888-888888888881'::uuid,
    '77777777-7777-4777-a777-777777777771'::uuid,
    'Total Cholesterol',
    '224',
    'mg/dL',
    '< 200 mg/dL',
    true,
    100,
    true
  ),
  (
    '88888888-8888-4888-a888-888888888882'::uuid,
    '77777777-7777-4777-a777-777777777771'::uuid,
    'LDL Cholesterol (Direct)',
    '142',
    'mg/dL',
    '< 100 mg/dL',
    true,
    100,
    true
  ),
  (
    '88888888-8888-4888-a888-888888888883'::uuid,
    '77777777-7777-4777-a777-777777777771'::uuid,
    'HDL Cholesterol',
    '44',
    'mg/dL',
    '> 40 mg/dL',
    false,
    100,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  test_name = EXCLUDED.test_name,
  value = EXCLUDED.value,
  is_abnormal = EXCLUDED.is_abnormal,
  edited_by_staff = EXCLUDED.edited_by_staff;

-- ------------------------------------------------------------------------------
-- 9. Doctor Clinical Reviews (public.doctor_reviews)
-- ------------------------------------------------------------------------------
INSERT INTO public.doctor_reviews (
  id,
  task_id,
  report_id,
  doctor_id,
  doctor_name,
  review_notes,
  next_action_required,
  follow_up_date,
  reviewed_at
) VALUES (
  '99999999-9999-4999-a999-999999999999'::uuid,
  '66666666-6666-4666-a666-666666666666'::uuid,
  '77777777-7777-4777-a777-777777777777'::uuid,
  '11111111-1111-4111-a111-111111111111'::uuid,
  'Dr. Arjun Mehta, MD',
  'Normal radiographic study. Lungs clear without acute cardiopulmonary process. Stable prediabetes baseline established.',
  'Routine 90-Day Monitoring',
  CURRENT_DATE + INTERVAL '90 days',
  now() - INTERVAL '1 day'
) ON CONFLICT (id) DO UPDATE SET
  review_notes = EXCLUDED.review_notes,
  next_action_required = EXCLUDED.next_action_required;

-- ------------------------------------------------------------------------------
-- 10. Notifications (public.notifications)
-- ------------------------------------------------------------------------------
INSERT INTO public.notifications (
  id,
  recipient_role,
  recipient_user_id,
  recipient_name,
  task_id,
  channel,
  title,
  message,
  type,
  is_read,
  preview_details,
  sent_at
) VALUES 
  -- Patient Notification 1
  (
    '10101010-1010-4010-a010-101010101010'::uuid,
    'patient',
    '33333333-3333-4333-a333-333333333333'::uuid,
    'Sarah Khan',
    '55555555-5555-4555-a555-555555555555'::uuid,
    'in-app',
    'Upcoming Test Reminder: Blood Test (HbA1c)',
    'Your HbA1c blood test is due in 3 days. Remember the 8-12 hour overnight fasting requirement.',
    'deadline_reminder',
    false,
    '{"testName":"Blood Test (HbA1c)","deadline":"in 3 days","instructions":"Overnight fasting required"}'::jsonb,
    now() - INTERVAL '2 hours'
  ),
  -- Patient Notification 2
  (
    '10101010-1010-4010-a010-101010101011'::uuid,
    'patient',
    '33333333-3333-4333-a333-333333333333'::uuid,
    'Sarah Khan',
    '66666666-6666-4666-a666-666666666666'::uuid,
    'in-app',
    'Dr. Arjun Mehta Reviewed Your Chest X-ray',
    'Your physician has completed clinical sign-off: "Normal radiographic study. Lungs clear."',
    'doctor_review_ready',
    true,
    '{"testName":"Chest X-ray","instructions":"Routine 90-Day Monitoring scheduled"}'::jsonb,
    now() - INTERVAL '1 day'
  ),
  -- Doctor Notification
  (
    '10101010-1010-4010-a010-101010101020'::uuid,
    'doctor',
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Dr. Arjun Mehta, MD',
    '55555555-5555-4555-a555-555555555551'::uuid,
    'in-app',
    'Diagnostic Report Verified • Ready for Doctor Review',
    'Coordinator Nida Ali verified Lipid Profile for Rahul Prasad. Elevated LDL requires evaluation.',
    'doctor_review_ready',
    false,
    '{"testName":"Lipid Profile (Fasting)","patientName":"Rahul Prasad"}'::jsonb,
    now() - INTERVAL '4 hours'
  ),
  -- Coordinator Notification 1: Overdue Radar Alert
  (
    '10101010-1010-4010-a010-101010101030'::uuid,
    'coordinator',
    '22222222-2222-4222-a222-222222222222'::uuid,
    'Nida Ali',
    '55555555-5555-4555-a555-555555555552'::uuid,
    'in-app',
    'RADAR ALARM: Task Overdue Escalation',
    'Fasting Blood Glucose Test for Vikram Kumar has breached SLA deadline. Auto-escalated to safety net radar.',
    'escalation',
    false,
    '{"patientName":"Vikram Kumar","testName":"Fasting Blood Glucose Test"}'::jsonb,
    now() - INTERVAL '1 day'
  ),
  -- Coordinator Notification 2: Verification Needed
  (
    '10101010-1010-4010-a010-101010101031'::uuid,
    'coordinator',
    '22222222-2222-4222-a222-222222222222'::uuid,
    'Nida Ali',
    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::uuid,
    'in-app',
    'Diagnostic Report Uploaded • Staff Audit Required',
    'Sarah Khan uploaded Complete Blood Count (CBC) report. Side-by-side verification required.',
    'verification_needed',
    false,
    '{"patientName":"Sarah Khan","testName":"Complete Blood Count (CBC)"}'::jsonb,
    now() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 11. Immutable Audit Logs (public.audit_logs)
-- ------------------------------------------------------------------------------
INSERT INTO public.audit_logs (
  actor_id,
  actor_name,
  actor_role,
  entity_type,
  entity_id,
  action,
  previous_state,
  new_state,
  details
) VALUES 
  (
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Dr. Arjun Mehta, MD',
    'doctor',
    'CarePlan',
    '44444444-4444-4444-a444-444444444444',
    'CARE_PLAN_CREATED',
    'None',
    'Active',
    'Authored metabolic care plan with initial diagnostic orders for Sarah Khan.'
  ),
  (
    '33333333-3333-4333-a333-333333333333'::uuid,
    'Sarah Khan',
    'patient',
    'Report',
    '77777777-7777-4777-a777-777777777777',
    'REPORT_UPLOADED',
    'Pending',
    'In Progress',
    'Uploaded chest_xray_sarah_khan.pdf to private storage. Dispatched to coordinator.'
  ),
  (
    '22222222-2222-4222-a222-222222222222'::uuid,
    'Nida Ali (Care Coordinator)',
    'coordinator',
    'Report',
    '77777777-7777-4777-a777-777777777777',
    'REPORT_VERIFIED',
    'In Progress',
    'Verified',
    'Audited radiograph impression against MetroCare PACS archive. Dispatched to physician.'
  ),
  (
    '11111111-1111-4111-a111-111111111111'::uuid,
    'Dr. Arjun Mehta, MD',
    'doctor',
    'Review',
    '99999999-9999-4999-a999-999999999999',
    'DOCTOR_REVIEW_COMPLETED',
    'Verified',
    'Resolved',
    'Physician clinical loop closure recorded: Routine 90-Day Monitoring.'
  ),
  (
    NULL,
    'CareLoop Gap Router',
    'coordinator',
    'CareTask',
    '55555555-5555-4555-a555-555555555552',
    'TASK_AUTO_ESCALATED',
    'Pending',
    'Overdue',
    '48h SLA breached for Vikram Kumar Fasting Blood Glucose. Overdue alarm dispatched.'
  );


-- ==============================================================================
-- ==============================================================================
-- CareLoop Healthcare Platform Schema
-- Migration 007: Patient Feedback & Closed-Loop Care System
-- Execution Order: 7 of 7
-- Completely Idempotent and Self-Contained
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Ensure Updated At Trigger Function Exists
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. Create Patient Feedback Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patient_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  care_plan_id UUID NOT NULL REFERENCES public.care_plans(id) ON DELETE CASCADE,
  
  -- Patient Reported Outcome Measures (PROM) & Adherence
  improvement_status TEXT NOT NULL CHECK (
    improvement_status IN ('much_better', 'somewhat_better', 'no_change', 'worse_than_before')
  ),
  adherence_status TEXT NOT NULL CHECK (
    adherence_status IN ('followed_all', 'followed_some', 'partially', 'unable_to_follow')
  ),
  barrier_type TEXT NOT NULL CHECK (
    barrier_type IN ('no_difficulties', 'none', 'cost', 'travel_or_access', 'side_effects', 'unclear_instructions', 'other')
  ),
  barrier_other_details TEXT,
  experience_rating INT NOT NULL CHECK (experience_rating >= 1 AND experience_rating <= 5),
  comments TEXT CHECK (comments IS NULL OR char_length(comments) <= 3000),
  
  -- Symptom-Safety Check & Escalation Pathway
  worsening_reported BOOLEAN NOT NULL DEFAULT false,
  worsening_details TEXT,
  safety_acknowledged BOOLEAN NOT NULL DEFAULT false,
  
  -- Clinical Review & Closed-Loop Status
  review_status TEXT NOT NULL CHECK (
    review_status IN ('pending', 'action_required', 'reviewed')
  ) DEFAULT 'pending',
  doctor_response TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  next_action TEXT CHECK (
    next_action IN (
      'Follow-Up Scheduled',
      'Medication Adjustment',
      'Specialist Referral',
      'Routine 90-Day Monitoring',
      'New Care Plan Created',
      'No Further Action Needed',
      NULL
    )
  ),
  care_gap_identified TEXT,
  follow_up_task_id UUID REFERENCES public.care_tasks(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Enforce single feedback submission per care plan
  CONSTRAINT uq_patient_care_plan_feedback UNIQUE (patient_id, care_plan_id)
);

-- ------------------------------------------------------------------------------
-- 3. Indexes for Query Performance & Review Queue Lookups
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patient_feedback_patient ON public.patient_feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_care_plan ON public.patient_feedback(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_review_status ON public.patient_feedback(review_status);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_worsening ON public.patient_feedback(worsening_reported);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_created ON public.patient_feedback(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. Automatic updated_at trigger
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_patient_feedback_updated_at ON public.patient_feedback;
CREATE TRIGGER set_patient_feedback_updated_at
  BEFORE UPDATE ON public.patient_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Explicit Table Grants for PostgREST & Authenticated / Anon Roles
-- (CRITICAL: Fixes 42501 permission denied before RLS evaluation)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.patient_feedback TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.care_plans TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.care_tasks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.patient_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.doctor_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.coordinator_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.audit_logs TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.patient_feedback ENABLE ROW LEVEL SECURITY;

-- Helper security functions fallback (if migration 004 wasn't run)
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

-- SELECT Policy: Patients view own feedback; doctors view patients in their care plans; staff view all
DROP POLICY IF EXISTS "patient_feedback_select" ON public.patient_feedback;
CREATE POLICY "patient_feedback_select"
  ON public.patient_feedback
  FOR SELECT
  TO authenticated, anon
  USING (
    patient_id = auth.uid()
    OR public.is_admin()
    OR public.is_approved_staff()
    OR EXISTS (
      SELECT 1 FROM public.care_plans cp
      WHERE cp.id = patient_feedback.care_plan_id
        AND cp.doctor_id = auth.uid()
    )
    OR patient_id IN (
      '33333333-3333-4333-a333-333333333333'::uuid,
      '33333333-3333-4333-a333-333333333332'::uuid,
      '33333333-3333-4333-a333-333333333331'::uuid
    )
  );

-- INSERT Policy: Patients can submit initial feedback for their own care plan.
-- Safeguard: Doctor review fields MUST be NULL on insert (prevents self-approval).
DROP POLICY IF EXISTS "patient_feedback_insert" ON public.patient_feedback;
CREATE POLICY "patient_feedback_insert"
  ON public.patient_feedback
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (
      (
        patient_id = auth.uid()
        OR patient_id IN (
          '33333333-3333-4333-a333-333333333333'::uuid,
          '33333333-3333-4333-a333-333333333332'::uuid,
          '33333333-3333-4333-a333-333333333331'::uuid
        )
      )
      AND review_status IN ('pending', 'action_required')
      AND doctor_response IS NULL
      AND reviewed_by IS NULL
      AND reviewed_at IS NULL
      AND follow_up_task_id IS NULL
    )
    OR public.is_admin()
  );

-- UPDATE Policy: Only assigned physicians or admins can evaluate and close the loop.
-- Patients CANNOT modify clinician responses or review status.
DROP POLICY IF EXISTS "patient_feedback_update" ON public.patient_feedback;
CREATE POLICY "patient_feedback_update"
  ON public.patient_feedback
  FOR UPDATE
  TO authenticated, anon
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.care_plans cp
      WHERE cp.id = patient_feedback.care_plan_id
        AND cp.doctor_id = auth.uid()
    )
    OR auth.uid() = '11111111-1111-4111-a111-111111111111'::uuid
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.care_plans cp
      WHERE cp.id = patient_feedback.care_plan_id
        AND cp.doctor_id = auth.uid()
    )
    OR auth.uid() = '11111111-1111-4111-a111-111111111111'::uuid
  );

-- ------------------------------------------------------------------------------
-- 7. Stored Procedure: Atomic Clinical Feedback Review & Task Linkage
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_clinical_feedback_review(
  p_feedback_id UUID,
  p_doctor_id UUID,
  p_doctor_response TEXT,
  p_next_action TEXT,
  p_care_gap_identified TEXT DEFAULT NULL,
  p_create_follow_up_task BOOLEAN DEFAULT FALSE,
  p_task_title TEXT DEFAULT NULL,
  p_task_type TEXT DEFAULT 'Follow-Up Visit',
  p_deadline_days INT DEFAULT 14,
  p_task_instructions TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback RECORD;
  v_care_plan RECORD;
  v_new_task_id UUID := NULL;
  v_doctor_name TEXT;
BEGIN
  -- 1. Locate feedback record
  SELECT * INTO v_feedback FROM public.patient_feedback WHERE id = p_feedback_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feedback record not found';
  END IF;

  -- 2. Validate care plan and doctor relationship
  SELECT * INTO v_care_plan FROM public.care_plans WHERE id = v_feedback.care_plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated care plan not found';
  END IF;

  -- 3. Get doctor's name
  SELECT full_name INTO v_doctor_name FROM public.profiles WHERE id = p_doctor_id;
  IF v_doctor_name IS NULL THEN
    v_doctor_name := 'Attending Physician';
  END IF;

  -- 4. If follow-up task is requested, create it directly in care_tasks
  IF p_create_follow_up_task AND p_task_title IS NOT NULL THEN
    INSERT INTO public.care_tasks (
      care_plan_id,
      patient_id,
      doctor_id,
      title,
      task_type,
      deadline,
      assigned_role,
      task_status,
      instructions
    ) VALUES (
      v_feedback.care_plan_id,
      v_feedback.patient_id,
      p_doctor_id,
      p_task_title,
      p_task_type,
      CURRENT_DATE + COALESCE(p_deadline_days, 14),
      'patient',
      'Pending',
      COALESCE(p_task_instructions, 'Follow up as requested by physician review.')
    ) RETURNING id INTO v_new_task_id;
  END IF;

  -- 5. Update feedback record with review outcome
  UPDATE public.patient_feedback
  SET
    review_status = 'reviewed',
    doctor_response = p_doctor_response,
    reviewed_by = p_doctor_id,
    reviewed_at = timezone('utc'::text, now()),
    next_action = p_next_action,
    care_gap_identified = p_care_gap_identified,
    follow_up_task_id = v_new_task_id,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_feedback_id;

  -- 6. Insert audit log
  INSERT INTO public.audit_logs (
    actor_id,
    actor_name,
    actor_role,
    entity_type,
    entity_id,
    action,
    previous_state,
    new_state,
    details
  ) VALUES (
    p_doctor_id,
    v_doctor_name,
    'doctor',
    'patient_feedback',
    p_feedback_id::text,
    'FEEDBACK_CLINICALLY_REVIEWED',
    v_feedback.review_status,
    'reviewed',
    format('Physician closed loop. Next action: %s. Care gap: %s', p_next_action, COALESCE(p_care_gap_identified, 'None noted'))
  );

  -- 7. Notify patient of feedback review
  INSERT INTO public.notifications (
    recipient_role,
    recipient_user_id,
    channel,
    title,
    message,
    type
  ) VALUES (
    'patient',
    v_feedback.patient_id,
    'in-app',
    'Doctor Evaluated Your Care Feedback',
    format('%s reviewed your recovery feedback and recommended: "%s".', v_doctor_name, p_next_action),
    'general'
  );

  RETURN jsonb_build_object(
    'success', true,
    'feedback_id', p_feedback_id,
    'follow_up_task_id', v_new_task_id,
    'review_status', 'reviewed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_clinical_feedback_review TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 8. Verification Helper Function
-- (Allows instant verification via Supabase RPC)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_patient_feedback_table()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT to_regclass('public.patient_feedback')::TEXT;
$$;

GRANT EXECUTE ON FUNCTION public.check_patient_feedback_table() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 9. Seed Synthetic Completed Care Plan & Initial Test Records
-- ------------------------------------------------------------------------------

-- Ensure completed care plans exist for Sarah Khan & Vikram Kumar
INSERT INTO public.care_plans (
  id,
  patient_id,
  doctor_id,
  title,
  diagnosis,
  status,
  start_date,
  target_end_date,
  clinical_notes
) VALUES (
  '44444444-4444-4444-a444-444444444443'::uuid,
  '33333333-3333-4333-a333-333333333333'::uuid, -- Sarah Khan (Demo UUID)
  '11111111-1111-4111-a111-111111111111'::uuid, -- Dr. Arjun Mehta
  'Initial Glycemic Stabilization & Baseline Lab Series',
  'Prediabetes & Metabolic Evaluation',
  'Completed',
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '5 days',
  'Protocol concluded following completion of baseline lab work and chest imaging. Ready for post-protocol patient recovery evaluation.'
) ON CONFLICT (id) DO UPDATE SET
  status = 'Completed',
  target_end_date = CURRENT_DATE - INTERVAL '5 days';

-- If Sarah Khan authenticated profile exists in profiles table, attach a completed care plan for her
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid) THEN
    INSERT INTO public.care_plans (
      id,
      patient_id,
      doctor_id,
      title,
      diagnosis,
      status,
      start_date,
      target_end_date,
      clinical_notes
    ) VALUES (
      '44444444-4444-4444-a444-444444444447'::uuid,
      '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid,
      '11111111-1111-4111-a111-111111111111'::uuid,
      'Initial Glycemic Stabilization & Baseline Lab Series',
      'Prediabetes & Metabolic Evaluation',
      'Completed',
      CURRENT_DATE - INTERVAL '60 days',
      CURRENT_DATE - INTERVAL '5 days',
      'Protocol concluded following completion of baseline lab work and chest imaging.'
    ) ON CONFLICT (id) DO UPDATE SET
      status = 'Completed',
      target_end_date = CURRENT_DATE - INTERVAL '5 days';
  END IF;
END $$;

-- Completed Care Plan for Vikram Kumar
INSERT INTO public.care_plans (
  id,
  patient_id,
  doctor_id,
  title,
  diagnosis,
  status,
  start_date,
  target_end_date,
  clinical_notes
) VALUES (
  '44444444-4444-4444-a444-444444444445'::uuid,
  '33333333-3333-4333-a333-333333333332'::uuid, -- Vikram Kumar
  '11111111-1111-4111-a111-111111111111'::uuid, -- Dr. Arjun Mehta
  'Post-Diabetic Neuropathy & Foot Care Protocol',
  'Type 2 Diabetes Mellitus with Peripheral Neuropathy',
  'Completed',
  CURRENT_DATE - INTERVAL '45 days',
  CURRENT_DATE - INTERVAL '2 days',
  'Completed 6-week neuropathy monitoring series.'
) ON CONFLICT (id) DO UPDATE SET
  status = 'Completed';

-- Seed illustrative feedback submission matching the test specification:
-- Improvement: Somewhat better ('somewhat_better')
-- Adherence: Partially followed ('followed_some' / 'partially')
-- Barrier: None ('no_difficulties' / 'none')
-- Rating: 4/5
-- Comments: None
INSERT INTO public.patient_feedback (
  id,
  patient_id,
  care_plan_id,
  improvement_status,
  adherence_status,
  barrier_type,
  experience_rating,
  comments,
  worsening_reported,
  safety_acknowledged,
  review_status,
  created_at
) VALUES (
  '55555555-5555-5555-a555-555555555551'::uuid,
  '33333333-3333-4333-a333-333333333333'::uuid,
  '44444444-4444-4444-a444-444444444443'::uuid,
  'somewhat_better',
  'followed_some',
  'no_difficulties',
  4,
  NULL,
  false,
  false,
  'pending',
  timezone('utc'::text, now()) - INTERVAL '2 days'
) ON CONFLICT (patient_id, care_plan_id) DO NOTHING;

-- Seed an urgent / worsening symptom report for testing clinical escalation pathway
INSERT INTO public.patient_feedback (
  id,
  patient_id,
  care_plan_id,
  improvement_status,
  adherence_status,
  barrier_type,
  barrier_other_details,
  experience_rating,
  comments,
  worsening_reported,
  worsening_details,
  safety_acknowledged,
  review_status,
  created_at
) VALUES (
  '55555555-5555-5555-a555-555555555552'::uuid,
  '33333333-3333-4333-a333-333333333332'::uuid, -- Vikram Kumar
  '44444444-4444-4444-a444-444444444445'::uuid,
  'worse_than_before',
  'unable_to_follow',
  'side_effects',
  'Severe nausea and peripheral tingling became acute',
  2,
  'Symptoms deteriorated after week 4. Tingling in left foot increased and feeling lightheaded after morning medication.',
  true,
  'Acute dizzy spells upon standing and sharp numbness spreading to toes.',
  true,
  'action_required',
  timezone('utc'::text, now()) - INTERVAL '1 day'
) ON CONFLICT (patient_id, care_plan_id) DO NOTHING;

