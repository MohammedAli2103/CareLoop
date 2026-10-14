-- ==============================================================================
-- CareLoop Migration 009: Cross-Portal Workflow Synchronization, RLS Fixes & Idempotent Demo Data Seed
-- ==============================================================================

-- 1. Schema Grants & Security Definer Permissions
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 2. Security Functions with Explicit Execution Grants
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

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'doctor'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'coordinator'
      AND status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_approved_staff() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_doctor() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_coordinator() TO anon, authenticated, service_role;

-- 3. Update RLS Policies for Care Plans and Care Tasks
-- ------------------------------------------------------------------------------

-- Care Plans SELECT
DROP POLICY IF EXISTS "care_plans_select" ON public.care_plans;
CREATE POLICY "care_plans_select"
  ON public.care_plans
  FOR SELECT
  TO authenticated, anon
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR patient_id IN (
      '33333333-3333-4333-a333-333333333333'::uuid,
      '33333333-3333-4333-a333-333333333332'::uuid,
      '33333333-3333-4333-a333-333333333331'::uuid,
      '33333333-3333-4333-a333-333333333334'::uuid,
      '33333333-3333-4333-a333-333333333335'::uuid,
      '33333333-3333-4333-a333-333333333336'::uuid,
      '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid
    )
  );

-- Care Plans INSERT
DROP POLICY IF EXISTS "care_plans_insert" ON public.care_plans;
CREATE POLICY "care_plans_insert"
  ON public.care_plans
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR doctor_id IN (
      '11111111-1111-4111-a111-111111111111'::uuid,
      '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid
    )
  );

-- Care Plans UPDATE
DROP POLICY IF EXISTS "care_plans_update" ON public.care_plans;
CREATE POLICY "care_plans_update"
  ON public.care_plans
  FOR UPDATE
  TO authenticated, anon
  USING (
    doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
  );

-- Care Tasks SELECT
DROP POLICY IF EXISTS "care_tasks_select" ON public.care_tasks;
CREATE POLICY "care_tasks_select"
  ON public.care_tasks
  FOR SELECT
  TO authenticated, anon
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR patient_id IN (
      '33333333-3333-4333-a333-333333333333'::uuid,
      '33333333-3333-4333-a333-333333333332'::uuid,
      '33333333-3333-4333-a333-333333333331'::uuid,
      '33333333-3333-4333-a333-333333333334'::uuid,
      '33333333-3333-4333-a333-333333333335'::uuid,
      '33333333-3333-4333-a333-333333333336'::uuid,
      '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid
    )
  );

-- Care Tasks INSERT
DROP POLICY IF EXISTS "care_tasks_insert" ON public.care_tasks;
CREATE POLICY "care_tasks_insert"
  ON public.care_tasks
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    doctor_id = auth.uid()
    OR patient_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR doctor_id IN (
      '11111111-1111-4111-a111-111111111111'::uuid,
      '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid
    )
  );

-- Care Tasks UPDATE
DROP POLICY IF EXISTS "care_tasks_update" ON public.care_tasks;
CREATE POLICY "care_tasks_update"
  ON public.care_tasks
  FOR UPDATE
  TO authenticated, anon
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR public.is_approved_staff()
    OR public.is_admin()
    OR patient_id IN (
      '33333333-3333-4333-a333-333333333333'::uuid,
      '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid
    )
  );

-- Reports Policies
DROP POLICY IF EXISTS "reports_select" ON public.reports;
CREATE POLICY "reports_select"
  ON public.reports
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert"
  ON public.reports
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_update"
  ON public.reports
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Test Results Policies
DROP POLICY IF EXISTS "test_results_select" ON public.test_results;
CREATE POLICY "test_results_select"
  ON public.test_results
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "test_results_insert" ON public.test_results;
CREATE POLICY "test_results_insert"
  ON public.test_results
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "test_results_update" ON public.test_results;
CREATE POLICY "test_results_update"
  ON public.test_results
  FOR UPDATE
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "test_results_delete" ON public.test_results;
CREATE POLICY "test_results_delete"
  ON public.test_results
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- Doctor Reviews Policies
DROP POLICY IF EXISTS "doctor_reviews_select" ON public.doctor_reviews;
CREATE POLICY "doctor_reviews_select"
  ON public.doctor_reviews
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "doctor_reviews_insert" ON public.doctor_reviews;
CREATE POLICY "doctor_reviews_insert"
  ON public.doctor_reviews
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "doctor_reviews_update" ON public.doctor_reviews;
CREATE POLICY "doctor_reviews_update"
  ON public.doctor_reviews
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Notifications Policies
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select"
  ON public.notifications
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert"
  ON public.notifications
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update"
  ON public.notifications
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Audit Logs Policies
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select"
  ON public.audit_logs
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Patient Feedback Policies
DROP POLICY IF EXISTS "patient_feedback_select" ON public.patient_feedback;
CREATE POLICY "patient_feedback_select"
  ON public.patient_feedback
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "patient_feedback_insert" ON public.patient_feedback;
CREATE POLICY "patient_feedback_insert"
  ON public.patient_feedback
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "patient_feedback_update" ON public.patient_feedback;
CREATE POLICY "patient_feedback_update"
  ON public.patient_feedback
  FOR UPDATE
  TO authenticated, anon
  USING (true);


-- ------------------------------------------------------------------------------
-- 4. Idempotent Demo Data Seed
-- ------------------------------------------------------------------------------

-- 4.1 Profiles (Doctors, Coordinators, Patients)
INSERT INTO public.profiles (id, email, full_name, role, status, phone, avatar_url)
VALUES
  -- Staff Physician
  ('46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'doctor@hospital.com', 'Dr. Arjun Mehta', 'doctor', 'active', '+1 (555) 234-5678', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'),
  ('11111111-1111-4111-a111-111111111111'::uuid, 'arjun.mehta@careloop.io', 'Dr. Arjun Mehta', 'doctor', 'active', '+1 (555) 234-5678', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'),
  -- Care Coordinator
  ('2d9f26bb-0116-4dd0-acb4-b88d57e767b6'::uuid, 'coordinator@hospital.com', 'Nida Ali', 'coordinator', 'active', '+1 (555) 345-6789', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'),
  ('22222222-2222-4222-a222-222222222222'::uuid, 'nida.ali@careloop.io', 'Nida Ali', 'coordinator', 'active', '+1 (555) 345-6789', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'),
  -- Patients
  ('2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, 'sarah.khan@careloop.io', 'Sarah Khan', 'patient', 'active', '+1 (555) 876-5432', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'),
  ('33333333-3333-4333-a333-333333333333'::uuid, 'sarah.khan.demo@careloop.io', 'Sarah Khan', 'patient', 'active', '+1 (555) 876-5432', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'),
  ('33333333-3333-4333-a333-333333333332'::uuid, 'vikram.kumar@careloop.io', 'Vikram Kumar', 'patient', 'active', '+1 (555) 987-6543', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),
  ('33333333-3333-4333-a333-333333333331'::uuid, 'rahul.prasad@careloop.io', 'Rahul Prasad', 'patient', 'active', '+1 (555) 345-6780', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
  ('33333333-3333-4333-a333-333333333334'::uuid, 'ayesha.mariam@careloop.io', 'Ayesha Mariam', 'patient', 'active', '+1 (555) 432-1098', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'),
  ('33333333-3333-4333-a333-333333333335'::uuid, 'danish.khan@careloop.io', 'Danish Khan', 'patient', 'active', '+1 (555) 765-4321', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'),
  ('33333333-3333-4333-a333-333333333336'::uuid, 'rohit.sharma@careloop.io', 'Rohit Sharma', 'patient', 'active', '+1 (555) 890-1234', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url;

-- 4.2 Patient Profiles
INSERT INTO public.patient_profiles (id, mrn, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, primary_diagnosis, assigned_doctor_id, blood_group)
VALUES
  ('2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, 'PT-84920', '2003-04-14', 'Female', 'Tariq Khan (Brother)', '+1 (555) 876-5433', 'Prediabetes & Metabolic Evaluation', '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'A+'),
  ('33333333-3333-4333-a333-333333333333'::uuid, 'PT-84920', '2003-04-14', 'Female', 'Tariq Khan (Brother)', '+1 (555) 876-5433', 'Prediabetes & Metabolic Evaluation', '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'A+'),
  ('33333333-3333-4333-a333-333333333332'::uuid, 'PT-63019', '1974-06-12', 'Male', 'Anjali Kumar (Spouse)', '+1 (555) 987-6544', 'Type 2 Diabetes Mellitus with Peripheral Neuropathy', '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'O+'),
  ('33333333-3333-4333-a333-333333333331'::uuid, 'PT-99201', '1981-11-03', 'Male', 'Sunita Prasad (Spouse)', '+1 (555) 345-6781', 'Hypertension & Early Renal Insufficiency', '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'B+'),
  ('33333333-3333-4333-a333-333333333334'::uuid, 'PT-55102', '1995-02-18', 'Female', 'Zainab Mariam (Mother)', '+1 (555) 432-1099', 'Post-COVID Dyspnea & Suspected Asthma', '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'O-'),
  ('33333333-3333-4333-a333-333333333335'::uuid, 'PT-33291', '1988-08-30', 'Male', 'Farida Khan (Spouse)', '+1 (555) 765-4322', 'Post-Op Knee Arthroscopy Rehabilitation', '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'A-'),
  ('33333333-3333-4333-a333-333333333336'::uuid, 'PT-12048', '1969-12-05', 'Male', 'Geeta Sharma (Spouse)', '+1 (555) 890-1235', 'CAD Status Post-Stenting & Dyslipidemia', '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'AB+')
ON CONFLICT (id) DO UPDATE SET
  primary_diagnosis = EXCLUDED.primary_diagnosis,
  assigned_doctor_id = EXCLUDED.assigned_doctor_id,
  emergency_contact_name = EXCLUDED.emergency_contact_name;

-- 4.3 Care Plans
INSERT INTO public.care_plans (id, patient_id, doctor_id, title, diagnosis, status, start_date, target_end_date, clinical_notes)
VALUES
  -- Sarah Khan: Active Care Plan
  ('44444444-4444-4444-a444-444444444444'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'Prediabetes Management & Monitoring', 'Prediabetes & Metabolic Evaluation', 'Active', '2026-10-08', '2026-11-20', 'Comprehensive 90-day protocol for metabolic syndrome and glycemic management.'),
  -- Sarah Khan: Completed Care Plan
  ('efb53af1-7122-44a9-973c-3b13074f675c'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'Initial Glycemic Stabilization & Baseline Lab Series', 'Prediabetes & Metabolic Evaluation', 'Completed', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '5 days', 'Protocol concluded following completion of baseline lab work and chest imaging.'),
  -- Vikram Kumar: Active Neuropathy Plan
  ('44444444-4444-4444-a444-444444444445'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'Diabetic Neuropathy Care & Foot Screening', 'Type 2 Diabetes Mellitus with Peripheral Neuropathy', 'Active', '2026-10-01', '2026-11-15', 'Regular monitoring of glycemic control, lipid profiles, and podiatric evaluations.'),
  -- Rahul Prasad: Active Renal Plan
  ('44444444-4444-4444-a444-444444444446'::uuid, '33333333-3333-4333-a333-333333333331'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'Hypertension & Renal Protection Protocol', 'Hypertension & Early Renal Insufficiency', 'Active', '2026-09-25', '2026-11-30', 'Blood pressure titration and microalbuminuria surveillance.'),
  -- Ayesha Mariam: Respiratory Evaluation
  ('44444444-4444-4444-a444-444444444448'::uuid, '33333333-3333-4333-a333-333333333334'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'Pulmonary Function & Dyspnea Surveillance', 'Post-COVID Dyspnea & Suspected Asthma', 'Active', '2026-10-05', '2026-11-25', 'Spirometry, peak flow tracking, and inhaler review.'),
  -- Danish Khan: Orthopedic Rehab
  ('44444444-4444-4444-a444-444444444449'::uuid, '33333333-3333-4333-a333-333333333335'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'Knee Arthroscopy Physical Therapy Plan', 'Post-Op Knee Arthroscopy Rehabilitation', 'Active', '2026-10-02', '2026-11-10', 'Range-of-motion monitoring and weight-bearing progress.'),
  -- Rohit Sharma: CAD Secondary Prevention
  ('44444444-4444-4444-a444-444444444450'::uuid, '33333333-3333-4333-a333-333333333336'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'Post-PCI Secondary Prevention & Lipid Control', 'CAD Status Post-Stenting & Dyslipidemia', 'Active', '2026-09-15', '2026-12-15', 'High-intensity statin adherence, ECG evaluation, and cardiac rehab monitoring.')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  diagnosis = EXCLUDED.diagnosis,
  status = EXCLUDED.status,
  clinical_notes = EXCLUDED.clinical_notes;

-- 4.4 Care Tasks Across All States
INSERT INTO public.care_tasks (
  id, care_plan_id, patient_id, doctor_id, title, task_type, deadline,
  assigned_role, task_status, instructions, fasting_required, partner_facility,
  facility_address, is_escalated, escalation_reason, patient_completed_at, delay_reason, delay_notes
) VALUES
  -- 1. Pending HbA1c Lab Test for Sarah Khan
  ('66666666-6666-4666-a666-666666666662'::uuid, '44444444-4444-4444-a444-444444444444'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Blood Test (HbA1c)', 'Lab Test', CURRENT_DATE + INTERVAL '6 days', 'patient', 'Pending',
   'Check your average blood sugar level. 8-hour overnight water-only fast recommended.', true,
   'MetroCare Laboratory, Main Branch', '420 Health Science Blvd, Suite 200, Metro City', false, null, null, null, null),

  -- 2. In Progress Lipid Profile (Awaiting Coordinator Verification) for Sarah Khan
  ('66666666-6666-4666-a666-666666666663'::uuid, '44444444-4444-4444-a444-444444444444'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Fasting Lipid Profile', 'Lab Test', CURRENT_DATE + INTERVAL '3 days', 'coordinator', 'In Progress',
   'Full lipid panel including Total Cholesterol, HDL, LDL, and Triglycerides. 12-hour fast.', true,
   'MetroCare Diagnostic Center', '420 Health Science Blvd, Suite 100, Metro City', false, null, CURRENT_DATE - INTERVAL '1 day', null, null),

  -- 3. Verified Diagnostic Report (Awaiting Doctor Review) for Sarah Khan
  ('66666666-6666-4666-a666-666666666661'::uuid, '44444444-4444-4444-a444-444444444444'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Fasting Blood Glucose & Insulin Resistance Panel', 'Lab Test', CURRENT_DATE + INTERVAL '1 day', 'doctor', 'Verified',
   'Evaluate baseline insulin sensitivity and impaired fasting glucose levels.', true,
   'MetroCare Diagnostic Center', '420 Health Science Blvd, Suite 100, Metro City', false, null, CURRENT_DATE - INTERVAL '2 days', null, null),

  -- 4. Overdue Task (Safety Net Radar Escalated) for Sarah Khan
  ('66666666-6666-4666-a666-666666666664'::uuid, '44444444-4444-4444-a444-444444444444'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Comprehensive Thyroid Profile (TSH, Free T3/T4)', 'Lab Test', CURRENT_DATE - INTERVAL '3 days', 'coordinator', 'Overdue',
   'Screen for secondary metabolic contributors and subclinical thyroid dysregulation.', false,
   'Quest Diagnostics Partner Lab', '880 Broadway Ave, Metro City', true, 'Overdue past 72h safety threshold without lab attendance.', null, 'transportation', 'Patient reported transit delay; rescheduled for upcoming weekend.'),

  -- 5. Resolved Diagnostic Task (Loop Formally Closed) for Sarah Khan
  ('66666666-6666-4666-a666-666666666665'::uuid, '44444444-4444-4444-a444-444444444444'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Baseline Chest Radiography (PA & Lateral)', 'Imaging', CURRENT_DATE - INTERVAL '10 days', 'doctor', 'Resolved',
   'Posteroanterior and lateral chest radiography for cardiopulmonary baseline.', false,
   'MetroCare Diagnostic Laboratory', '420 Lexington Health Blvd, Suite 200, Metro City', false, null, CURRENT_DATE - INTERVAL '12 days', null, null),

  -- 6. Follow-up Consultation for Sarah Khan
  ('66666666-6666-4666-a666-666666666666'::uuid, '44444444-4444-4444-a444-444444444444'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Clinical Follow-up & Lab Review Visit', 'Follow-Up Visit', CURRENT_DATE + INTERVAL '12 days', 'patient', 'Pending',
   'In-clinic review of HbA1c trajectory, lipid panel, and lifestyle interventions.', false,
   'MetroCare Clinic - Dr. Mehta Suite', '420 Health Science Blvd, Room 302, Metro City', false, null, null, null, null),

  -- 7. Vikram Kumar: Overdue Monofilament Foot Exam
  ('66666666-6666-4666-a666-666666666667'::uuid, '44444444-4444-4444-a444-444444444445'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Semmes-Weinstein Monofilament Neuropathy Exam', 'Lab Test', CURRENT_DATE - INTERVAL '4 days', 'coordinator', 'Overdue',
   '10-point sensory monofilament testing and pedal pulse assessment.', false,
   'MetroCare Podiatry Center', '710 Health Parkway, Suite 104, Metro City', true, 'Overdue past 96h SLA. Radar alarm active.', null, null, null),

  -- 8. Rahul Prasad: In Progress Renal Function Panel
  ('66666666-6666-4666-a666-666666666668'::uuid, '44444444-4444-4444-a444-444444444446'::uuid, '33333333-3333-4333-a333-333333333331'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Renal Function Panel & Spot Urine Albumin-to-Creatinine Ratio', 'Lab Test', CURRENT_DATE + INTERVAL '2 days', 'coordinator', 'In Progress',
   'Serum creatinine, eGFR, BUN, and urine microalbumin.', false,
   'MetroCare Diagnostic Center', '420 Health Science Blvd, Suite 100, Metro City', false, null, CURRENT_DATE - INTERVAL '1 day', null, null),

  -- 9. Ayesha Mariam: Verified Spirometry Report
  ('66666666-6666-4666-a666-666666666669'::uuid, '44444444-4444-4444-a444-444444444448'::uuid, '33333333-3333-4333-a333-333333333334'::uuid, '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid,
   'Pre and Post-Bronchodilator Spirometry', 'Imaging', CURRENT_DATE + INTERVAL '4 days', 'doctor', 'Verified',
   'Measure FEV1/FVC ratio and reversibility with albuterol.', false,
   'MetroCare Pulmonary Diagnostics', '420 Health Science Blvd, Suite 410, Metro City', false, null, CURRENT_DATE - INTERVAL '1 day', null, null)
ON CONFLICT (id) DO UPDATE SET
  task_status = EXCLUDED.task_status,
  assigned_role = EXCLUDED.assigned_role,
  deadline = EXCLUDED.deadline,
  is_escalated = EXCLUDED.is_escalated,
  delay_reason = EXCLUDED.delay_reason,
  delay_notes = EXCLUDED.delay_notes;

-- 4.5 Diagnostic Reports
INSERT INTO public.reports (
  id, task_id, patient_id, file_name, file_type, file_size, storage_path, file_url,
  uploaded_by_role, verification_status, verified_by, verified_at, verification_notes
) VALUES
  -- Unverified Report for Task 666...63 (Lipid Profile)
  ('77777777-7777-4777-a777-777777777771'::uuid, '66666666-6666-4666-a666-666666666663'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid,
   'lipid_panel_sarah_khan.pdf', 'application/pdf', '1.4 MB', '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a/lipid_panel.pdf', '/mock/reports/lipid_panel_sarah_khan.pdf',
   'patient', 'Unverified', null, null, 'Awaiting coordinator side-by-side audit.'),

  -- Verified Report for Task 666...61 (Fasting Glucose - Ready for Doctor Review)
  ('77777777-7777-4777-a777-777777777772'::uuid, '66666666-6666-4666-a666-666666666661'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid,
   'fasting_glucose_sarah_khan.pdf', 'application/pdf', '1.8 MB', '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a/fasting_glucose.pdf', '/mock/reports/fasting_glucose_sarah_khan.pdf',
   'patient', 'Verified', 'Nida Ali (Care Coordinator)', CURRENT_DATE - INTERVAL '1 day', 'Verified side-by-side against original diagnostic laboratory report.'),

  -- Verified Report for Task 666...65 (Chest Radiography - Resolved)
  ('77777777-7777-4777-a777-777777777773'::uuid, '66666666-6666-4666-a666-666666666665'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid,
   'chest_xray_sarah_khan.pdf', 'application/pdf', '2.1 MB', '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a/chest_xray.pdf', '/mock/reports/chest_xray_sarah_khan.pdf',
   'patient', 'Verified', 'Nida Ali (Care Coordinator)', CURRENT_DATE - INTERVAL '11 days', 'Lungs clear, normal cardiothoracic ratio.'),

  -- Verified Report for Ayesha Mariam Spirometry
  ('77777777-7777-4777-a777-777777777774'::uuid, '66666666-6666-4666-a666-666666666669'::uuid, '33333333-3333-4333-a333-333333333334'::uuid,
   'spirometry_ayesha_mariam.pdf', 'application/pdf', '2.6 MB', '33333333-3333-4333-a333-333333333334/spirometry.pdf', '/mock/reports/spirometry_ayesha_mariam.pdf',
   'patient', 'Verified', 'Nida Ali (Care Coordinator)', CURRENT_DATE - INTERVAL '1 day', 'Verified values match official pulmonary laboratory report.')
ON CONFLICT (id) DO UPDATE SET
  verification_status = EXCLUDED.verification_status,
  verified_by = EXCLUDED.verified_by,
  verified_at = EXCLUDED.verified_at,
  verification_notes = EXCLUDED.verification_notes;

-- 4.6 OCR / Extracted Test Results
INSERT INTO public.test_results (id, report_id, test_name, value, unit, ref_range, is_abnormal, confidence, edited_by_staff)
VALUES
  -- Fasting Glucose Results
  ('88888888-8888-4888-a888-888888888881'::uuid, '77777777-7777-4777-a777-777777777772'::uuid, 'Fasting Blood Glucose', '108', 'mg/dL', '70 - 99 mg/dL', true, 98, true),
  ('88888888-8888-4888-a888-888888888882'::uuid, '77777777-7777-4777-a777-777777777772'::uuid, 'Fasting Serum Insulin', '14.2', 'uIU/mL', '2.6 - 24.9 uIU/mL', false, 95, false),
  ('88888888-8888-4888-a888-888888888883'::uuid, '77777777-7777-4777-a777-777777777772'::uuid, 'HOMA-IR Score', '3.8', 'Index', '< 2.0 Optimal', true, 96, true),

  -- Lipid Panel Results (Unverified)
  ('88888888-8888-4888-a888-888888888884'::uuid, '77777777-7777-4777-a777-777777777771'::uuid, 'Total Cholesterol', '215', 'mg/dL', '< 200 mg/dL', true, 96, false),
  ('88888888-8888-4888-a888-888888888885'::uuid, '77777777-7777-4777-a777-777777777771'::uuid, 'Triglycerides', '188', 'mg/dL', '< 150 mg/dL', true, 95, false),
  ('88888888-8888-4888-a888-888888888886'::uuid, '77777777-7777-4777-a777-777777777771'::uuid, 'HDL Cholesterol', '42', 'mg/dL', '> 50 mg/dL (Female)', true, 94, false),
  ('88888888-8888-4888-a888-888888888887'::uuid, '77777777-7777-4777-a777-777777777771'::uuid, 'LDL Cholesterol', '135', 'mg/dL', '< 100 mg/dL', true, 97, false),

  -- Chest Radiography Impression (Resolved)
  ('88888888-8888-4888-a888-888888888888'::uuid, '77777777-7777-4777-a777-777777777773'::uuid, 'Chest Radiography Impression', 'Clear Lung Fields', 'Impression', 'No focal consolidation', false, 99, true),

  -- Spirometry Results for Ayesha Mariam
  ('88888888-8888-4888-a888-888888888889'::uuid, '77777777-7777-4777-a777-777777777774'::uuid, 'FEV1 / FVC Ratio', '72', '%', '> 75% Expected', true, 97, true),
  ('88888888-8888-4888-a888-888888888890'::uuid, '77777777-7777-4777-a777-777777777774'::uuid, 'Post-Bronchodilator Reversibility', '+14', '% FEV1', '< 12% Normal', true, 99, true)
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  is_abnormal = EXCLUDED.is_abnormal,
  edited_by_staff = EXCLUDED.edited_by_staff;

-- 4.7 Doctor Clinical Reviews
INSERT INTO public.doctor_reviews (
  id, task_id, report_id, doctor_id, doctor_name, review_notes,
  next_action_required, follow_up_date, reviewed_at
) VALUES
  -- Review for Task 666...65 (Chest X-Ray)
  ('99999999-9999-4999-a999-999999999991'::uuid, '66666666-6666-4666-a666-666666666665'::uuid, '77777777-7777-4777-a777-777777777773'::uuid,
   '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, 'Dr. Arjun Mehta, MD',
   'Normal radiographic study. Clear lung fields without infiltrates or cardiomegaly. Cleared for routine follow-up.',
   'Routine 90-Day Monitoring', '2026-11-24', CURRENT_DATE - INTERVAL '10 days')
ON CONFLICT (id) DO UPDATE SET
  review_notes = EXCLUDED.review_notes,
  next_action_required = EXCLUDED.next_action_required,
  reviewed_at = EXCLUDED.reviewed_at;

-- 4.8 Patient Feedback Records (Pending, Action Required, Reviewed)
INSERT INTO public.patient_feedback (
  id, patient_id, care_plan_id, improvement_status, adherence_status, barrier_type,
  experience_rating, comments, worsening_reported, worsening_details, safety_acknowledged,
  review_status, doctor_response, reviewed_by, reviewed_at, next_action
) VALUES
  -- 1. Sarah Khan: Feedback for completed plan (Action Required due to fatigue)
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::uuid, '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, 'efb53af1-7122-44a9-973c-3b13074f675c'::uuid,
   'somewhat_better', 'followed_all', 'no_difficulties', 4,
   'Following the nutritional guidance and walking daily. Feeling slightly more energetic after meals.',
   false, null, true,
   'pending', null, null, null, null),

  -- 2. Vikram Kumar: Feedback with worsening symptom report (Action Required)
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaab'::uuid, '33333333-3333-4333-a333-333333333332'::uuid, '44444444-4444-4444-a444-444444444445'::uuid,
   'worse_than_before', 'followed_some', 'side_effects', 2,
   'Experiencing tingling and numbness in lower extremities especially at night.',
   true, 'Increased peripheral numbness and nocturnal neuropathic discomfort.', true,
   'action_required', null, null, null, null)
ON CONFLICT (id) DO UPDATE SET
  review_status = EXCLUDED.review_status,
  experience_rating = EXCLUDED.experience_rating,
  comments = EXCLUDED.comments;

-- 4.9 Notification Items
INSERT INTO public.notifications (
  id, recipient_role, recipient_user_id, task_id, channel, title, message, type, is_read, sent_at, preview_details
) VALUES
  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb01'::uuid, 'doctor', '46e9bfad-b991-4ab4-9bcb-a133e0044348'::uuid, '66666666-6666-4666-a666-666666666661'::uuid,
   'in-app', 'Diagnostic Report Verified • Ready for Doctor Review',
   'Coordinator verified report for Fasting Blood Glucose & Insulin Resistance Panel. Ready for physician evaluation.',
   'doctor_review_ready', false, CURRENT_DATE - INTERVAL '1 day',
   '{"testName": "Fasting Blood Glucose & Insulin Resistance Panel", "instructions": "Human verification complete. Awaiting physician clinical evaluation."}'::jsonb),

  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb02'::uuid, 'coordinator', '2d9f26bb-0116-4dd0-acb4-b88d57e767b6'::uuid, '66666666-6666-4666-a666-666666666664'::uuid,
   'in-app', 'RADAR ALARM: Task Overdue Escalation',
   'Comprehensive Thyroid Profile has elapsed past deadline. Auto-escalated to safety net radar.',
   'escalation', false, CURRENT_DATE - INTERVAL '2 days',
   '{"testName": "Comprehensive Thyroid Profile (TSH, Free T3/T4)", "deadline": "Overdue"}'::jsonb),

  ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03'::uuid, 'patient', '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a'::uuid, '66666666-6666-4666-a666-666666666662'::uuid,
   'in-app', 'Upcoming Care Task Reminder',
   'Your Blood Test (HbA1c) is scheduled within the next 6 days. Please review fasting guidelines.',
   'deadline_reminder', false, CURRENT_DATE,
   '{"testName": "Blood Test (HbA1c)", "deadline": "In 6 days"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  is_read = EXCLUDED.is_read;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
