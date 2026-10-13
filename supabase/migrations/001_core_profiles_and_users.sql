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
