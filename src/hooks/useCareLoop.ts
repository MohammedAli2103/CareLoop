import { useState, useEffect, useMemo, useCallback } from 'react';
import { careLoopService } from '../services/mockCareLoopService';
import { supabaseCareLoopService } from '../services/supabaseCareLoopService';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  UserRole,
  User,
  Patient,
  CarePlan,
  CareTask,
  NotificationItem,
  AuditLog,
  DashboardStats,
  TaskType,
  TestResult,
  NextAction,
  DelayReason,
  PatientFeedback,
  SubmitFeedbackPayload,
  ReviewFeedbackPayload
} from '../types';

export function useCareLoop(activeRole: UserRole, activePatientId = 'patient-1') {
  const [users, setUsers] = useState<User[]>(() => careLoopService.getUsers());
  const [patients, setPatients] = useState<Patient[]>(() => careLoopService.getPatients());
  const [carePlans, setCarePlans] = useState<CarePlan[]>(() => careLoopService.getCarePlans());
  const [allTasks, setAllTasks] = useState<CareTask[]>(() => careLoopService.getTasks());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => careLoopService.getNotifications(activeRole));
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(() => careLoopService.getNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => careLoopService.getAuditLogs());
  const [feedbacks, setFeedbacks] = useState<PatientFeedback[]>(() => careLoopService.getFeedbacks());
  const [loading, setLoading] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState<boolean>(() => isSupabaseConfigured());

  const refreshData = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const [u, p, cp, t, n, allN, al, fb] = await Promise.all([
          supabaseCareLoopService.getUsers(),
          supabaseCareLoopService.getPatients(),
          supabaseCareLoopService.getCarePlans(),
          supabaseCareLoopService.getTasks(),
          supabaseCareLoopService.getNotifications(activeRole),
          supabaseCareLoopService.getNotifications(),
          supabaseCareLoopService.getAuditLogs(),
          supabaseCareLoopService.getFeedbacks()
        ]);

        // If real database returned rows, use them
        if (p && p.length > 0) setPatients(p);
        if (u && u.length > 0) setUsers(u);
        if (cp && cp.length > 0) setCarePlans(cp);
        if (t && t.length > 0) setAllTasks(t);
        if (n && n.length > 0) setNotifications(n);
        if (allN && allN.length > 0) setAllNotifications(allN);
        if (al && al.length > 0) setAuditLogs(al);
        if (fb && fb.length > 0) setFeedbacks(fb);
        setIsUsingSupabase(true);
        return;
      } catch (err) {
        console.warn('Could not pull from Supabase; falling back to local store:', err);
      }
    }

    // Fallback to local service
    setUsers(careLoopService.getUsers());
    setPatients(careLoopService.getPatients());
    setCarePlans(careLoopService.getCarePlans());
    setAllTasks(careLoopService.getTasks());
    setNotifications(careLoopService.getNotifications(activeRole));
    setAllNotifications(careLoopService.getNotifications());
    setAuditLogs(careLoopService.getAuditLogs());
    setFeedbacks(careLoopService.getFeedbacks());
    setIsUsingSupabase(false);
  }, [activeRole]);

  useEffect(() => {
    refreshData();

    // Subscribe to changes
    const unsubMock = careLoopService.subscribe(refreshData);
    const unsubSupa = supabaseCareLoopService.subscribe(refreshData);

    return () => {
      unsubMock();
      unsubSupa();
    };
  }, [refreshData]);

const DEMO_PATIENT_UUID_MAP: Record<string, string> = {
  'patient-1': '33333333-3333-4333-a333-333333333333',
  'patient-2': '33333333-3333-4333-a333-333333333332',
  'patient-3': '33333333-3333-4333-a333-333333333331',
  '33333333-3333-4333-a333-333333333333': 'patient-1',
  '33333333-3333-4333-a333-333333333332': 'patient-2',
  '33333333-3333-4333-a333-333333333331': 'patient-3',
};

  // Filter tasks for active role
  const roleTasks = useMemo(() => {
    if (activeRole === 'patient') {
      const targetId = activePatientId || (patients[0]?.id ?? 'patient-1');
      const alternateId = DEMO_PATIENT_UUID_MAP[targetId];

      const filtered = allTasks.filter(t => 
        t.patientId === targetId || 
        (alternateId && t.patientId === alternateId)
      );

      // If active patient has tasks, return them
      if (filtered.length > 0) return filtered;

      // If active patient has no tasks (e.g. demo session with unassigned ID),
      // fallback to the primary demo patient (Sarah Khan) tasks so dashboard is populated
      if (
        targetId === 'patient-1' || 
        targetId === patients[0]?.id || 
        !activePatientId || 
        targetId.startsWith('patient-') ||
        targetId === '33333333-3333-4333-a333-333333333333'
      ) {
        const firstPatientId = patients[0]?.id || '33333333-3333-4333-a333-333333333333';
        const firstPatientAlt = DEMO_PATIENT_UUID_MAP[firstPatientId];
        const fallbackTasks = allTasks.filter(t => 
          t.patientId === firstPatientId || 
          (firstPatientAlt && t.patientId === firstPatientAlt) ||
          t.patientId === '33333333-3333-4333-a333-333333333333' ||
          t.patientId === 'patient-1'
        );
        if (fallbackTasks.length > 0) return fallbackTasks;
      }

      return filtered;
    }
    return allTasks;
  }, [allTasks, activeRole, activePatientId, patients]);

  const currentPatient = useMemo(() => {
    const targetId = activePatientId || 'patient-1';
    const altId = DEMO_PATIENT_UUID_MAP[targetId];

    return (
      patients.find(p => p.id === targetId || p.userId === targetId) ||
      (altId ? patients.find(p => p.id === altId || p.userId === altId) : undefined) ||
      patients[0] ||
      {
        id: 'patient-1',
        userId: 'patient-1',
        mrn: 'MRN-84920',
        fullName: 'Sarah Khan',
        dateOfBirth: '1989-06-14',
        age: 37,
        gender: 'Female',
        phone: '+91 91234 56789',
        email: 'sarah.khan@careloop.io',
        emergencyContact: 'Tariq Khan (Spouse - +91 91234 56780)',
        primaryDiagnosis: 'Type 2 Diabetes Mellitus with Dyslipidemia',
        assignedDoctorId: '11111111-1111-4111-a111-111111111111',
        assignedDoctorName: 'Dr. Arjun Mehta, MD',
        bloodGroup: 'B+'
      }
    );
  }, [patients, activePatientId]);

  const currentUser = useMemo(() => {
    if (activeRole === 'patient') return users.find(u => u.role === 'patient') || users[0];
    if (activeRole === 'doctor') return users.find(u => u.role === 'doctor') || users[1];
    if (activeRole === 'coordinator') return users.find(u => u.role === 'coordinator') || users[2];
    return users.find(u => u.role === 'admin') || users[0];
  }, [users, activeRole]);

  const stats: DashboardStats = useMemo(() => {
    const activePlans = carePlans.filter(p => p.status === 'Active').length;
    const pending = allTasks.filter(t => t.taskStatus === 'Pending').length;
    const inProgress = allTasks.filter(t => t.taskStatus === 'In Progress').length;
    const verified = allTasks.filter(t => t.taskStatus === 'Verified').length;
    const overdue = allTasks.filter(t => t.taskStatus === 'Overdue').length;
    const resolved = allTasks.filter(t => t.taskStatus === 'Resolved').length;

    return {
      activeCarePlans: activePlans,
      pendingTasks: pending,
      upcomingDeadlines: pending + inProgress,
      awaitingVerification: inProgress,
      awaitingDoctorReview: verified,
      overdueTasks: overdue,
      resolvedTasks: resolved
    };
  }, [carePlans, allTasks]);

  // Unified actions router: delegates to Supabase if configured, and updates state
  const actions = useMemo(() => {
    return {
      createCarePlan: async (data: {
        patientId: string;
        doctorId: string;
        title: string;
        diagnosis: string;
        taskTitle: string;
        taskType: TaskType;
        deadlineDays: number;
        fastingRequired: boolean;
        partnerFacility: string;
        instructions: string;
      }) => {
        setLoading(true);
        try {
          if (isSupabaseConfigured()) {
            const res = await supabaseCareLoopService.createCarePlan(data);
            if (res) {
              await refreshData();
              return res;
            }
          }
          const res = careLoopService.createCarePlan(data);
          await refreshData();
          return res;
        } finally {
          setLoading(false);
        }
      },

      uploadReport: async (taskId: string, fileData: {
        file?: File | Blob;
        fileName: string;
        fileSize: string;
        fileType: string;
        patientId?: string;
        mockResults?: TestResult[];
      }) => {
        setLoading(true);
        try {
          if (isSupabaseConfigured()) {
            const res = await supabaseCareLoopService.uploadReport(taskId, fileData);
            if (res) {
              await refreshData();
              return res;
            }
          }
          const res = careLoopService.uploadReport(taskId, fileData);
          await refreshData();
          return res;
        } finally {
          setLoading(false);
        }
      },

      verifyReport: async (taskId: string, results: TestResult[], notes: string) => {
        setLoading(true);
        try {
          if (isSupabaseConfigured()) {
            const res = await supabaseCareLoopService.verifyReport(taskId, results, notes);
            if (res) {
              await refreshData();
              return res;
            }
          }
          const res = careLoopService.verifyReport(taskId, results, notes);
          await refreshData();
          return res;
        } finally {
          setLoading(false);
        }
      },

      flagReportForCorrection: async (taskId: string, reason: string) => {
        setLoading(true);
        try {
          if (isSupabaseConfigured()) {
            const res = await supabaseCareLoopService.flagReportForCorrection(taskId, reason);
            if (res) {
              await refreshData();
              return res;
            }
          }
          const res = careLoopService.flagReportForCorrection(taskId, reason);
          await refreshData();
          return res;
        } finally {
          setLoading(false);
        }
      },

      completeDoctorReview: async (taskId: string, data: {
        reviewNotes: string;
        nextAction: NextAction;
        followUpDate?: string;
      }) => {
        setLoading(true);
        try {
          if (isSupabaseConfigured()) {
            const res = await supabaseCareLoopService.completeDoctorReview(taskId, data);
            if (res) {
              await refreshData();
              return res;
            }
          }
          const res = careLoopService.completeDoctorReview(taskId, data);
          await refreshData();
          return res;
        } finally {
          setLoading(false);
        }
      },

      recordDelayReason: async (taskId: string, reason: DelayReason, notes: string) => {
        if (isSupabaseConfigured()) {
          const res = await supabaseCareLoopService.recordDelayReason(taskId, reason, notes);
          if (res) {
            await refreshData();
            return res;
          }
        }
        const res = careLoopService.recordDelayReason(taskId, reason, notes);
        await refreshData();
        return res;
      },

      simulateTimeLeap: async () => {
        if (isSupabaseConfigured()) {
          await supabaseCareLoopService.simulateTimeLeap();
        } else {
          careLoopService.simulateTimeLeap();
        }
        await refreshData();
      },

      reassignEscalatedTask: async (taskId: string, targetRole: UserRole, notes: string) => {
        if (isSupabaseConfigured()) {
          const res = await supabaseCareLoopService.reassignEscalatedTask(taskId, targetRole, notes);
          if (res) {
            await refreshData();
            return res;
          }
        }
        const res = careLoopService.reassignEscalatedTask(taskId, targetRole, notes);
        await refreshData();
        return res;
      },

      sendReminderToDoctor: (taskId: string) => {
        const res = careLoopService.sendReminderToDoctor(taskId);
        refreshData();
        return res;
      },

      sendReminderToPatient: (taskId: string) => {
        const res = careLoopService.sendReminderToPatient(taskId);
        refreshData();
        return res;
      },

      resetDemoData: () => {
        careLoopService.resetDemoData();
        refreshData();
      },

      markNotificationRead: (id: string) => {
        if (isSupabaseConfigured()) {
          supabaseCareLoopService.markNotificationRead(id);
        }
        careLoopService.markNotificationRead(id);
        refreshData();
      },

      markAllNotificationsRead: (role?: UserRole) => {
        if (isSupabaseConfigured()) {
          supabaseCareLoopService.markAllNotificationsRead(role);
        }
        careLoopService.markAllNotificationsRead(role);
        refreshData();
      },

      // Patient Feedback & Closed-Loop Care actions
      submitPatientFeedback: async (payload: SubmitFeedbackPayload) => {
        try {
          if (isSupabaseConfigured()) {
            const res = await supabaseCareLoopService.submitPatientFeedback(payload);
            if (res) {
              await refreshData();
              return res;
            }
          }
        } catch (err) {
          // If business rule violation, let caller handle
          if (isSupabaseConfigured()) {
            throw err;
          }
        }
        const res = careLoopService.submitPatientFeedback(payload);
        await refreshData();
        return res;
      },

      completeFeedbackReview: async (feedbackId: string, data: ReviewFeedbackPayload, doctorId?: string) => {
        try {
          if (isSupabaseConfigured()) {
            const res = await supabaseCareLoopService.completeFeedbackReview(feedbackId, data, doctorId);
            if (res) {
              await refreshData();
              return res;
            }
          }
        } catch (err) {
          if (isSupabaseConfigured()) {
            throw err;
          }
        }
        const res = careLoopService.completeFeedbackReview(feedbackId, data, doctorId);
        await refreshData();
        return res;
      },

      getFeedbackForCarePlan: (carePlanId: string) => {
        return feedbacks.find(f => f.carePlanId === carePlanId);
      }
    };
  }, [refreshData, feedbacks]);

  return {
    users,
    currentUser,
    patients,
    currentPatient,
    carePlans,
    allTasks,
    roleTasks,
    notifications,
    allNotifications,
    auditLogs,
    feedbacks,
    stats,
    loading,
    isUsingSupabase,
    actions,
    service: actions, // Backward-compatibility
    refreshData
  };
}
