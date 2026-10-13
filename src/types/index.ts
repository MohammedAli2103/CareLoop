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
  created_at?: string;
  updated_at?: string;
}

export interface PatientProfile {
  id: string;
  mrn?: string;
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
  primary_diagnosis?: string;
  assigned_doctor_id?: string;
  assigned_coordinator_id?: string;
  consent_terms: boolean;
  consent_privacy: boolean;
  consent_data_processing: boolean;
  consent_timestamp?: string;
  created_at?: string;
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
  created_at?: string;
}

export interface CoordinatorProfile {
  id: string;
  department: string;
  organization: string;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
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

export type TaskStatus = 'Pending' | 'In Progress' | 'Overdue' | 'Verified' | 'Resolved';

export type TaskType = 'Lab Test' | 'Specialist Referral' | 'Imaging' | 'Follow-Up Visit';

export type VerificationStatus = 'Unverified' | 'Verified' | 'Flagged';

export type NextAction = 
  | 'Follow-Up Scheduled' 
  | 'Medication Adjustment' 
  | 'Specialist Referral' 
  | 'Routine 90-Day Monitoring' 
  | 'No Further Action Needed';

export type DelayReason = 
  | 'Out-of-Pocket Lab Cost' 
  | 'Transportation Barriers' 
  | 'Procedure Anxiety' 
  | 'Work / Family Schedule Conflict' 
  | 'Awaiting Fasting Window' 
  | 'Other';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  title?: string;
  avatarUrl?: string;
  badge?: string;
}

export interface Patient {
  id: string;
  userId: string;
  mrn: string; // Medical Record Number e.g. MRN-84920
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  emergencyContact: string;
  primaryDiagnosis: string;
  assignedDoctorId: string;
  assignedDoctorName: string;
  bloodGroup?: string;
}

export interface CarePlan {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  title: string;
  diagnosis: string;
  status: 'Active' | 'Completed';
  startDate: string;
  targetEndDate: string;
  clinicalNotes: string;
  taskIds: string[];
}

export interface TestResult {
  id: string;
  reportId: string;
  testName: string;
  value: string;
  unit: string;
  refRange: string;
  isAbnormal: boolean;
  confidence: number; // e.g. 97% confidence from OCR
  editedByStaff?: boolean;
}

export interface Report {
  id: string;
  taskId: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileUrl?: string;
  uploadedAt: string;
  uploadedByRole: UserRole;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  extractedResults: TestResult[];
}

export interface DoctorReview {
  id: string;
  reportId: string;
  taskId: string;
  doctorId: string;
  doctorName: string;
  reviewNotes: string;
  nextActionRequired: NextAction;
  reviewedAt: string;
  followUpDate?: string;
}

export interface CareTask {
  id: string;
  carePlanId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  title: string;
  taskType: TaskType;
  deadline: string; // ISO string or YYYY-MM-DD
  assignedRole: UserRole;
  taskStatus: TaskStatus;
  instructions: string;
  fastingRequired?: boolean;
  partnerFacility?: string;
  facilityAddress?: string;
  createdAt: string;
  updatedAt: string;
  
  // Patient self-reported context
  patientCompletedAt?: string;
  delayReason?: DelayReason;
  delayNotes?: string;
  
  // Document and verification link
  report?: Report;
  doctorReview?: DoctorReview;
  
  // Escalation tracking (Page 8 & 9)
  isEscalated?: boolean;
  escalatedTo?: string; // e.g. "Clinical Coordinator On-Call"
  escalationReason?: string;
  escalatedAt?: string;
}

export interface NotificationItem {
  id: string;
  taskId?: string;
  recipientRole: UserRole;
  recipientName: string;
  channel: 'in-app' | 'whatsapp' | 'sms';
  title: string;
  message: string;
  type: 'deadline_reminder' | 'overdue_alert' | 'verification_needed' | 'doctor_review_ready' | 'escalation' | 'general';
  isRead: boolean;
  sentAt: string;
  actionLink?: string;
  previewDetails?: {
    patientName?: string;
    testName?: string;
    deadline?: string;
    instructions?: string;
  };
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  actorEmail?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
  details: string | Record<string, any>;
}

export interface DashboardStats {
  activeCarePlans: number;
  pendingTasks: number;
  upcomingDeadlines: number;
  awaitingVerification: number;
  awaitingDoctorReview: number;
  overdueTasks: number;
  resolvedTasks: number;
}

// ==============================================================================
// Patient Feedback & Closed-Loop Care Types
// ==============================================================================

export type ImprovementStatus = 
  | 'much_better' 
  | 'somewhat_better' 
  | 'no_change' 
  | 'worse_than_before';

export type AdherenceStatus = 
  | 'followed_all' 
  | 'followed_some' 
  | 'partially'
  | 'unable_to_follow';

export type BarrierType = 
  | 'no_difficulties' 
  | 'none'
  | 'cost' 
  | 'travel_or_access' 
  | 'side_effects' 
  | 'unclear_instructions' 
  | 'other';

export type FeedbackReviewStatus = 
  | 'pending' 
  | 'action_required' 
  | 'reviewed';

export interface PatientFeedback {
  id: string;
  patientId: string;
  patientName?: string;
  patientMrn?: string;
  carePlanId: string;
  carePlanTitle?: string;
  carePlanDiagnosis?: string;
  improvementStatus: ImprovementStatus;
  adherenceStatus: AdherenceStatus;
  barrierType: BarrierType;
  barrierOtherDetails?: string;
  experienceRating: number; // 1 to 5 stars
  comments?: string;
  worseningReported: boolean;
  worseningDetails?: string;
  safetyAcknowledged: boolean;
  reviewStatus: FeedbackReviewStatus;
  doctorResponse?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  nextAction?: NextAction | 'New Care Plan Created';
  careGapIdentified?: string;
  followUpTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitFeedbackPayload {
  carePlanId: string;
  patientId?: string; // Derived from authenticated user on server
  improvementStatus: ImprovementStatus;
  adherenceStatus: AdherenceStatus;
  barrierType: BarrierType;
  barrierOtherDetails?: string;
  experienceRating: number; // 1 to 5
  comments?: string;
  worseningReported: boolean;
  worseningDetails?: string;
  safetyAcknowledged: boolean;
}

export interface ReviewFeedbackPayload {
  doctorResponse: string;
  nextAction: NextAction | 'New Care Plan Created';
  careGapIdentified?: string;
  createFollowUpTask?: boolean;
  followUpTaskDetails?: {
    title: string;
    taskType: TaskType;
    deadlineDays: number;
    instructions?: string;
    partnerFacility?: string;
  };
}

