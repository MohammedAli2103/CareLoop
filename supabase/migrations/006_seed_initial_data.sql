-- ==============================================================================
-- CareLoop Healthcare Platform Schema
-- Migration 006: Initial Synthetic Demo Data & Administrator Setup Instructions
-- Execution Order: 6 of 6
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Initial System Administrator Provisioning Guide
-- ------------------------------------------------------------------------------
/*
HOW TO CREATE YOUR FIRST SYSTEM ADMINISTRATOR:

1. Open your Supabase Dashboard -> Authentication -> Users.
2. Click "Add User" -> "Create User" with:
   - Email: admin@careloop.com (or your preferred admin email)
   - Password: Choose a strong temporary password
   - Auto Confirm User: Checked
3. Copy the newly created User UID (UUID).
4. Run the following snippet in the Supabase SQL Editor replacing <ADMIN_UUID> and <EMAIL>:

INSERT INTO public.profiles (id, role, status, full_name, email, phone)
VALUES (
  '<ADMIN_UUID>'::uuid,
  'admin',
  'active',
  'CareLoop System Administrator',
  'admin@careloop.com',
  '+1 555-0199'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active';
*/

-- ------------------------------------------------------------------------------
-- 2. Synthetic Demo Data Seeding (Optional for Test Environments)
-- Note: These records use deterministic synthetic UUIDs for easy local development.
-- ------------------------------------------------------------------------------

-- Seed synthetic doctor profile
INSERT INTO public.profiles (id, role, status, full_name, email, phone)
VALUES (
  '11111111-1111-4111-a111-111111111111'::uuid,
  'doctor',
  'active',
  'Dr. Arjun Mehta, MD',
  'doctor@hospital.com',
  '+91 98450 11223'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.doctor_profiles (id, medical_license_number, specialization, hospital_department, years_of_experience)
VALUES (
  '11111111-1111-4111-a111-111111111111'::uuid,
  'MCI-84920-K',
  'Endocrinology & Internal Medicine',
  'Department of Endocrinology',
  14
) ON CONFLICT (id) DO NOTHING;

-- Seed synthetic coordinator profile
INSERT INTO public.profiles (id, role, status, full_name, email, phone)
VALUES (
  '22222222-2222-4222-a222-222222222222'::uuid,
  'coordinator',
  'active',
  'Nida Ali',
  'coordinator@hospital.com',
  '+91 98765 43210'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coordinator_profiles (id, department, organization)
VALUES (
  '22222222-2222-4222-a222-222222222222'::uuid,
  'Ambulatory Care Coordination',
  'CareLoop Metro Health Network'
) ON CONFLICT (id) DO NOTHING;

-- Seed synthetic patient profile
INSERT INTO public.profiles (id, role, status, full_name, email, phone)
VALUES (
  '33333333-3333-4333-a333-333333333333'::uuid,
  'patient',
  'active',
  'Sarah Khan',
  'sarah.khan@careloop.io',
  '+91 91234 56789'
) ON CONFLICT (id) DO NOTHING;

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
) VALUES (
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
) ON CONFLICT (id) DO NOTHING;

-- Seed Active Care Plan
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
  '44444444-4444-4444-a444-444444444444'::uuid,
  '33333333-3333-4333-a333-333333333333'::uuid,
  '11111111-1111-4111-a111-111111111111'::uuid,
  'Glycemic Optimization & Cardiovascular Risk Reduction',
  'Type 2 Diabetes Mellitus, Dyslipidemia',
  'Active',
  CURRENT_DATE - INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '30 days',
  'Quarterly diagnostic monitoring. Aiming for HbA1c < 7.0% and LDL < 100 mg/dL.'
) ON CONFLICT (id) DO NOTHING;

-- Seed Care Tasks
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
  facility_address
) VALUES (
  '55555555-5555-4555-a555-555555555555'::uuid,
  '44444444-4444-4444-a444-444444444444'::uuid,
  '33333333-3333-4333-a333-333333333333'::uuid,
  '11111111-1111-4111-a111-111111111111'::uuid,
  'HbA1c (Glycated Hemoglobin) Blood Test',
  'Lab Test',
  CURRENT_DATE + INTERVAL '3 days',
  'patient',
  'Pending',
  '10-12 hours overnight fasting mandatory. Take regular morning medications only with water.',
  true,
  'Metropolis Healthcare Diagnostic Lab',
  '420 Health Science Blvd, Suite 200, Metro City'
),
(
  '66666666-6666-4666-a666-666666666666'::uuid,
  '44444444-4444-4444-a444-444444444444'::uuid,
  '33333333-3333-4333-a333-333333333333'::uuid,
  '11111111-1111-4111-a111-111111111111'::uuid,
  'Comprehensive Fasting Lipid Panel',
  'Lab Test',
  CURRENT_DATE - INTERVAL '2 days',
  'coordinator',
  'In Progress',
  'Fasting lipid profile to evaluate statin therapy efficacy.',
  true,
  'Quest Diagnostics Center',
  '800 Innovation Way, Metro City'
) ON CONFLICT (id) DO NOTHING;

-- Seed Audit Log
INSERT INTO public.audit_logs (
  actor_name,
  actor_role,
  entity_type,
  entity_id,
  action,
  previous_state,
  new_state,
  details
) VALUES (
  'Dr. Arjun Mehta, MD',
  'doctor',
  'CarePlan',
  '44444444-4444-4444-a444-444444444444',
  'CARE_PLAN_CREATED',
  'None',
  'Active',
  'Authored initial care plan with diagnostic laboratory orders for Sarah Khan.'
);
