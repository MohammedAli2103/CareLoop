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
