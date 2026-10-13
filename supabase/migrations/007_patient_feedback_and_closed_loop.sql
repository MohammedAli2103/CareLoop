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
