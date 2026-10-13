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
