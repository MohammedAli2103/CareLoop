-- ==============================================================================
-- CareLoop Migration 008: Fix Table Grants & Setup Private Storage Bucket
-- ==============================================================================

-- 1. Explicitly Grant Privileges to PostgREST roles (anon, authenticated, service_role)
-- ------------------------------------------------------------------------------
-- Without these grants, PostgREST queries fail with 42501 (permission denied for table)
-- even when Row Level Security policies are configured.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.patient_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.doctor_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.coordinator_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.care_plans TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.care_tasks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reports TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.test_results TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.doctor_reviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.audit_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.patient_feedback TO anon, authenticated, service_role;

-- Grant sequence permissions where applicable
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Create and Configure Private Storage Bucket for Diagnostic Reports
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'patient-reports',
  'patient-reports',
  false,
  false,
  10485760, -- 10MB file size limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- 3. Storage RLS Policies for patient-reports Bucket
-- ------------------------------------------------------------------------------

-- Allow authenticated users to upload files to patient-reports
DROP POLICY IF EXISTS "patient_reports_upload" ON storage.objects;
CREATE POLICY "patient_reports_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'patient-reports'
    AND (
      -- Patient can upload to their own folder: <patient_id>/<task_id>/<filename>
      (storage.foldername(name))[1] = auth.uid()::text
      -- Or clinical staff / doctor can upload
      OR public.is_approved_staff()
      OR public.is_doctor()
      OR public.is_admin()
      OR (storage.foldername(name))[1] IN ('33333333-3333-4333-a333-333333333333', '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a')
    )
  );

-- Allow authenticated users to view/download reports
DROP POLICY IF EXISTS "patient_reports_select" ON storage.objects;
CREATE POLICY "patient_reports_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'patient-reports'
    AND (
      -- Patient can read their own folder
      (storage.foldername(name))[1] = auth.uid()::text
      -- Clinical staff, doctors, admins can read
      OR public.is_approved_staff()
      OR public.is_doctor()
      OR public.is_admin()
      OR (storage.foldername(name))[1] IN ('33333333-3333-4333-a333-333333333333', '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a')
    )
  );

-- Allow update/delete by owner or staff
DROP POLICY IF EXISTS "patient_reports_update" ON storage.objects;
CREATE POLICY "patient_reports_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'patient-reports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_approved_staff()
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "patient_reports_delete" ON storage.objects;
CREATE POLICY "patient_reports_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'patient-reports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_approved_staff()
      OR public.is_admin()
    )
  );

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
