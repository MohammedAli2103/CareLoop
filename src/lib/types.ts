export type UserRole = 'patient' | 'doctor' | 'coordinator' | 'admin';
export type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended';

export interface Profile {
  id: string;
  role: UserRole;
  status: UserStatus;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientProfile {
  id: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  blood_group?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  consent_terms: boolean;
  consent_privacy: boolean;
  consent_data_processing: boolean;
  consent_timestamp: string;
  created_at: string;
}

export interface DoctorProfile {
  id: string;
  medical_license_number: string;
  specialization: string;
  hospital_department: string;
  years_of_experience?: number;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface CoordinatorProfile {
  id: string;
  department: string;
  organization: string;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  actor_email?: string | null;
  action: string;
  target_id: string | null;
  target_type: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}

export interface StaffApprovalItem {
  id: string;
  role: 'doctor' | 'coordinator';
  status: UserStatus;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  doctor_details?: DoctorProfile;
  coordinator_details?: CoordinatorProfile;
}

export interface AdminStats {
  totalPendingApprovals: number;
  totalDoctors: number;
  totalCoordinators: number;
  totalPatients: number;
  totalStaff: number;
}
