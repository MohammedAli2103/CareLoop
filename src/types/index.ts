export type UserRole = 'patient' | 'doctor' | 'coordinator';

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
  type: 'deadline_reminder' | 'overdue_alert' | 'verification_needed' | 'doctor_review_ready' | 'escalation';
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
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  entityType: 'CarePlan' | 'CareTask' | 'Report' | 'Review';
  entityId: string;
  action: string;
  previousState: string;
  newState: string;
  timestamp: string;
  details: string;
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
