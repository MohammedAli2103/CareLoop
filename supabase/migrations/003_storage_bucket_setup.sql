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
