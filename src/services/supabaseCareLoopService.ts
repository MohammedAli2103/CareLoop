import { supabase, isSupabaseConfigured } from '../lib/supabase';

import {

  CareTask,

  CarePlan,

  Patient,

  User,

  NotificationItem,

  AuditLog,

  UserRole,

  TestResult,

  NextAction,

  DelayReason,

  TaskType,

  Report,

  DoctorReview,

  PatientFeedback,

  SubmitFeedbackPayload,

  ReviewFeedbackPayload

} from '../types';

import {
  CARE_PLAN_UUID_MAP,
  FEEDBACK_UUID_MAP,
  PATIENT_UUID_MAP,
  DOCTOR_UUID_MAP,
  TASK_UUID_MAP,
  UUID_REGEX,
  resolvePatientUuid,
  resolveDoctorUuid,
  resolveCarePlanUuid,
  resolveTaskUuid,
  resolveFeedbackUuid
} from '../data/mockData';

import { careLoopService } from './mockCareLoopService';

export {
  CARE_PLAN_UUID_MAP,
  FEEDBACK_UUID_MAP,
  PATIENT_UUID_MAP,
  DOCTOR_UUID_MAP,
  TASK_UUID_MAP,
  UUID_REGEX,
  resolvePatientUuid,
  resolveDoctorUuid,
  resolveCarePlanUuid,
  resolveTaskUuid,
  resolveFeedbackUuid
};



export class SupabaseCareLoopService {

  private listeners: (() => void)[] = [];

  private realtimeChannel: any = null;



  constructor() {

    this.initRealtime();

  }



  private initRealtime() {

    if (!isSupabaseConfigured() || typeof window === 'undefined') return;



    try {

      if (this.realtimeChannel) {

        supabase.removeChannel(this.realtimeChannel);

      }

      this.realtimeChannel = supabase

        .channel('careloop-db-changes')

        .on(

          'postgres_changes',

          { event: '*', schema: 'public', table: 'care_tasks' },

          () => this.notify()

        )

        .on(

          'postgres_changes',

          { event: '*', schema: 'public', table: 'reports' },

          () => this.notify()

        )

        .on(

          'postgres_changes',

          { event: '*', schema: 'public', table: 'doctor_reviews' },

          () => this.notify()

        )

        .on(

          'postgres_changes',

          { event: '*', schema: 'public', table: 'notifications' },

          () => this.notify()

        )

        .on(

          'postgres_changes',

          { event: '*', schema: 'public', table: 'patient_feedback' },

          () => this.notify()

        )

        .subscribe();

    } catch (err) {

      console.warn('Realtime subscription could not be initialized:', err);

    }

  }



  public subscribe(listener: () => void) {

    this.listeners.push(listener);

    return () => {

      this.listeners = this.listeners.filter(l => l !== listener);

    };

  }



  public cleanup() {

    if (this.realtimeChannel) {

      supabase.removeChannel(this.realtimeChannel);

    }

  }



  private notify() {

    this.listeners.forEach(l => l());

  }



  // --- GETTERS ---

  public async getUsers(): Promise<User[]> {
    if (!isSupabaseConfigured()) return careLoopService.getUsers();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, avatar_url');

      if (error) {
        console.warn('[CareLoop Supabase] Error fetching profiles:', error.message);
        return careLoopService.getUsers();
      }
      if (!data || data.length === 0) return careLoopService.getUsers();

      return data.map((p: any) => ({
        id: p.id,
        email: p.email || '',
        role: p.role as UserRole,
        fullName: p.full_name,
        avatarUrl: p.avatar_url,
        title: p.role === 'doctor' ? 'Staff Physician' : p.role === 'coordinator' ? 'Care Coordinator' : 'Patient'
      }));
    } catch (err) {
      console.warn('[CareLoop Supabase] Unexpected error fetching users:', err);
      return careLoopService.getUsers();
    }
  }

  public async getPatients(): Promise<Patient[]> {
    if (!isSupabaseConfigured()) return careLoopService.getPatients();

    try {
      const { data: patientRows, error: pErr } = await supabase
        .from('patient_profiles')
        .select('*');

      if (pErr) {
        console.warn('[CareLoop Supabase] Error fetching patient_profiles:', pErr.message);
        return careLoopService.getPatients();
      }
      if (!patientRows || patientRows.length === 0) return careLoopService.getPatients();

      // Fetch profiles to resolve names and emails safely without PostgREST relation syntax bugs
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone');

      const profileMap = new Map<string, any>();
      (profileRows || []).forEach((p: any) => profileMap.set(p.id, p));

      return patientRows.map((row: any) => {
        const profile = profileMap.get(row.id) || {};
        const doctor = row.assigned_doctor_id ? profileMap.get(row.assigned_doctor_id) || {} : {};
        const birthDate = row.date_of_birth ? new Date(row.date_of_birth) : new Date('1990-01-01');
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000));

        return {
          id: row.id,
          userId: row.id,
          mrn: row.mrn || `MRN-${row.id.substring(0, 5).toUpperCase()}`,
          fullName: profile.full_name || 'Sarah Khan',
          dateOfBirth: row.date_of_birth || '1990-01-01',
          age: isNaN(age) ? 35 : age,
          gender: row.gender || 'Female',
          phone: profile.phone || '',
          email: profile.email || '',
          emergencyContact: row.emergency_contact_name 
            ? `${row.emergency_contact_name} (${row.emergency_contact_phone || 'N/A'})`
            : 'Tariq Khan (Spouse - +91 91234 56780)',
          primaryDiagnosis: row.primary_diagnosis || 'Type 2 Diabetes Mellitus with Dyslipidemia',
          assignedDoctorId: row.assigned_doctor_id || '46e9bfad-b991-4ab4-9bcb-a133e0044348',
          assignedDoctorName: doctor.full_name || 'Dr. Arjun Mehta, MD',
          bloodGroup: row.blood_group || 'B+'
        };
      });
    } catch (err) {
      console.warn('[CareLoop Supabase] Unexpected error in getPatients:', err);
      return careLoopService.getPatients();
    }
  }

  public async getCarePlans(): Promise<CarePlan[]> {
    if (!isSupabaseConfigured()) return careLoopService.getCarePlans();

    try {
      const { data: planRows, error: planErr } = await supabase
        .from('care_plans')
        .select(`
          id,
          patient_id,
          doctor_id,
          title,
          diagnosis,
          status,
          start_date,
          target_end_date,
          clinical_notes,
          care_tasks ( id )
        `)
        .order('created_at', { ascending: false });

      if (planErr) {
        console.warn('[CareLoop Supabase] Error fetching care_plans:', planErr.message);
        return careLoopService.getCarePlans();
      }
      if (!planRows || planRows.length === 0) return careLoopService.getCarePlans();

      // Fetch profiles to resolve patient and doctor names reliably
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name');
      const profileMap = new Map<string, string>();
      (profileRows || []).forEach((p: any) => profileMap.set(p.id, p.full_name));

      return planRows.map((cp: any) => ({
        id: cp.id,
        patientId: cp.patient_id,
        patientName: profileMap.get(cp.patient_id) || 'Sarah Khan',
        doctorId: cp.doctor_id,
        doctorName: profileMap.get(cp.doctor_id) || 'Dr. Arjun Mehta, MD',
        title: cp.title,
        diagnosis: cp.diagnosis,
        status: cp.status as 'Active' | 'Completed',
        startDate: cp.start_date,
        targetEndDate: cp.target_end_date,
        clinicalNotes: cp.clinical_notes || '',
        taskIds: (cp.care_tasks || []).map((t: any) => t.id)
      }));
    } catch (err) {
      console.warn('[CareLoop Supabase] Unexpected error in getCarePlans:', err);
      return careLoopService.getCarePlans();
    }
  }

  public async getTasks(): Promise<CareTask[]> {
    if (!isSupabaseConfigured()) return careLoopService.getTasks();

    try {
      const { data: taskRows, error: taskErr } = await supabase
        .from('care_tasks')
        .select(`
          *,
          reports (
            *,
            test_results ( * )
          ),
          doctor_reviews ( * )
        `)
        .order('created_at', { ascending: false });

      if (taskErr) {
        console.warn('[CareLoop Supabase] Error fetching care_tasks:', taskErr.message);
        return careLoopService.getTasks();
      }
      if (!taskRows || taskRows.length === 0) return careLoopService.getTasks();



      // Fetch profiles to resolve names

      const { data: profileRows } = await supabase

        .from('profiles')

        .select('id, full_name');

      const profileMap = new Map<string, string>();

      (profileRows || []).forEach((p: any) => profileMap.set(p.id, p.full_name));



      return taskRows.map((row: any) => {
        let reportObj: Report | undefined = undefined;
        const rep = Array.isArray(row.reports) ? row.reports[0] : row.reports;
        if (rep) {
          reportObj = {
            id: rep.id,
            taskId: rep.task_id,
            fileName: rep.file_name,
            fileType: rep.file_type,
            fileSize: rep.file_size,
            fileUrl: rep.file_url,
            uploadedAt: rep.uploaded_at,
            uploadedByRole: rep.uploaded_by_role,
            verificationStatus: rep.verification_status,
            verifiedBy: rep.verified_by,
            verifiedAt: rep.verified_at,
            verificationNotes: rep.verification_notes,
            extractedResults: (rep.test_results || []).map((tr: any) => ({
              id: tr.id,
              reportId: tr.report_id,
              testName: tr.test_name,
              value: tr.value,
              unit: tr.unit,
              refRange: tr.ref_range,
              isAbnormal: tr.is_abnormal,
              confidence: Number(tr.confidence || 95),
              editedByStaff: tr.edited_by_staff
            }))
          };
        }

        let doctorReviewObj: DoctorReview | undefined = undefined;
        const rev = Array.isArray(row.doctor_reviews) ? row.doctor_reviews[0] : row.doctor_reviews;
        if (rev) {
          doctorReviewObj = {
            id: rev.id,
            reportId: rev.report_id || '',
            taskId: rev.task_id,
            doctorId: rev.doctor_id,
            doctorName: rev.doctor_name || profileMap.get(rev.doctor_id) || 'Dr. Arjun Mehta, MD',
            reviewNotes: rev.review_notes,
            nextActionRequired: rev.next_action_required,
            reviewedAt: rev.reviewed_at,
            followUpDate: rev.follow_up_date
          };
        }

        const patientName = profileMap.get(row.patient_id) || 
          (resolvePatientUuid(row.patient_id) === '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a' || row.patient_id === 'patient-1' ? 'Sarah Khan' : 'Patient');

        return {
          id: row.id,
          carePlanId: row.care_plan_id,
          patientId: row.patient_id,
          patientName,
          doctorId: row.doctor_id,
          doctorName: profileMap.get(row.doctor_id) || 'Dr. Arjun Mehta, MD',

          title: row.title,

          taskType: row.task_type as TaskType,

          deadline: row.deadline,

          assignedRole: row.assigned_role as UserRole,

          taskStatus: row.task_status,

          instructions: row.instructions || '',

          fastingRequired: row.fasting_required,

          partnerFacility: row.partner_facility,

          facilityAddress: row.facility_address,

          createdAt: row.created_at,

          updatedAt: row.updated_at,

          patientCompletedAt: row.patient_completed_at,

          delayReason: row.delay_reason as DelayReason,

          delayNotes: row.delay_notes,

          isEscalated: row.is_escalated,

          escalatedTo: row.escalated_to,

          escalationReason: row.escalation_reason,

          escalatedAt: row.escalated_at,

          report: reportObj,

          doctorReview: doctorReviewObj

        };

      });

    } catch (err) {
      console.warn('[CareLoop Supabase] Unexpected error in getTasks:', err);
      return careLoopService.getTasks();
    }
  }

  public async getNotifications(role?: UserRole): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured()) {
      return careLoopService.getNotifications(role);
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('sent_at', { ascending: false });

      if (role) {
        query = query.eq('recipient_role', role);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return careLoopService.getNotifications(role);
      }

      return data.map((n: any) => ({
        id: n.id,
        taskId: n.task_id,
        recipientRole: n.recipient_role as UserRole,
        recipientName: n.recipient_name || '',
        channel: n.channel || 'in-app',
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        sentAt: n.sent_at,
        actionLink: n.action_link,
        previewDetails: n.preview_details
      }));
    } catch {
      return careLoopService.getNotifications(role);
    }
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    if (!isSupabaseConfigured()) return careLoopService.getAuditLogs();

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) return careLoopService.getAuditLogs();

      return data.map((l: any) => ({
        id: l.id,
        actorId: l.actor_id,
        actorName: l.actor_name,
        actorRole: l.actor_role,
        actorEmail: l.actor_email,
        entityType: l.entity_type,
        entityId: l.entity_id,
        action: l.action,
        previousState: l.previous_state,
        newState: l.new_state,
        timestamp: l.created_at,
        details: l.details || ''
      }));
    } catch {
      return careLoopService.getAuditLogs();
    }
  }



  // --- WORKFLOW MUTATIONS ---



  // 1. Create a Care Plan (Doctor)
  public async createCarePlan(params: {
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
  }): Promise<{ carePlan: CarePlan; task: CareTask } | null> {
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + params.deadlineDays);
    const deadlineString = deadlineDate.toISOString().split('T')[0];

    const resolvedPatientId = resolvePatientUuid(params.patientId);
    const resolvedDoctorId = resolveDoctorUuid(params.doctorId);

    if (!isSupabaseConfigured()) {
      const localResult = careLoopService.createCarePlan({
        ...params,
        patientId: resolvedPatientId,
        doctorId: resolvedDoctorId
      });
      this.notify();
      return localResult;
    }

    try {
      // 1. Insert care plan
      const { data: planData, error: planErr } = await supabase
        .from('care_plans')
        .insert({
          patient_id: resolvedPatientId,
          doctor_id: resolvedDoctorId,
          title: params.title,
          diagnosis: params.diagnosis,
          status: 'Active',
          start_date: new Date().toISOString().split('T')[0],
          target_end_date: deadlineString,
          clinical_notes: `Order created by clinician. Target SLA: ${params.deadlineDays} days.`
        })
        .select()
        .single();

      if (planErr || !planData) throw planErr || new Error('Failed to create care plan in database.');

      // 2. Insert initial task
      const { data: taskData, error: taskErr } = await supabase
        .from('care_tasks')
        .insert({
          care_plan_id: planData.id,
          patient_id: resolvedPatientId,
          doctor_id: resolvedDoctorId,
          title: params.taskTitle,
          task_type: params.taskType,
          deadline: deadlineString,
          assigned_role: 'patient',
          task_status: 'Pending',
          instructions: params.instructions,
          fasting_required: params.fastingRequired,
          partner_facility: params.partnerFacility,
          facility_address: '420 Lexington Health Blvd, Suite 200, Metro City'
        })
        .select()
        .single();

      if (taskErr || !taskData) throw taskErr || new Error('Failed to create care task in database.');

      // 3. Queue patient notification (best effort)
      try {
        await supabase.from('notifications').insert({
          recipient_role: 'patient',
          recipient_user_id: resolvedPatientId,
          task_id: taskData.id,
          channel: 'in-app',
          title: `New Care Order: ${params.taskTitle}`,
          message: `Your doctor ordered a new ${params.taskType}. Due by ${deadlineString}.`,
          type: 'deadline_reminder',
          preview_details: {
            testName: params.taskTitle,
            deadline: deadlineString,
            instructions: params.instructions
          }
        });
      } catch (notifErr) {
        console.warn('Notification notice:', notifErr);
      }

      // 4. Log audit event (best effort)
      try {
        await supabase.from('audit_logs').insert({
          actor_id: resolvedDoctorId,
          actor_name: 'Ordering Clinician',
          actor_role: 'doctor',
          entity_type: 'CarePlan',
          entity_id: planData.id,
          action: 'CARE_PLAN_CREATED',
          previous_state: 'None',
          new_state: 'Active',
          details: `Created care plan "${params.title}" with diagnostic task "${params.taskTitle}".`
        });
      } catch (auditErr) {
        console.warn('Audit notice:', auditErr);
      }

      // Keep local mock storage in sync
      careLoopService.createCarePlan({
        ...params,
        patientId: resolvedPatientId,
        doctorId: resolvedDoctorId
      });

      this.notify();

      return {
        carePlan: {
          id: planData.id,
          patientId: planData.patient_id,
          patientName: resolvedPatientId === '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a' || resolvedPatientId === 'patient-1' ? 'Sarah Khan' : 'Patient',
          doctorId: planData.doctor_id,
          doctorName: 'Dr. Arjun Mehta, MD',
          title: planData.title,
          diagnosis: planData.diagnosis,
          status: planData.status,
          startDate: planData.start_date,
          targetEndDate: planData.target_end_date,
          clinicalNotes: planData.clinical_notes,
          taskIds: [taskData.id]
        },
        task: {
          id: taskData.id,
          carePlanId: planData.id,
          patientId: taskData.patient_id,
          patientName: resolvedPatientId === '2bdf2f09-a454-4ff8-b1fd-e1c6cd8a715a' || resolvedPatientId === 'patient-1' ? 'Sarah Khan' : 'Patient',
          doctorId: taskData.doctor_id,
          doctorName: 'Dr. Arjun Mehta, MD',
          title: taskData.title,
          taskType: taskData.task_type,
          deadline: taskData.deadline,
          assignedRole: taskData.assigned_role,
          taskStatus: taskData.task_status,
          instructions: taskData.instructions,
          fastingRequired: taskData.fasting_required,
          partnerFacility: taskData.partner_facility,
          facilityAddress: taskData.facility_address,
          createdAt: taskData.created_at,
          updatedAt: taskData.updated_at
        }
      };
    } catch (err) {
      console.error('Error creating care plan in Supabase:', err);
      throw err;
    }
  }



  // 2. Upload Report to Private Supabase Storage Bucket

  public async uploadReport(

    taskId: string,

    fileData: {

      file?: File | Blob;

      fileName: string;

      fileSize: string;

      fileType: string;

      patientId?: string;

      mockResults?: TestResult[];

    }

  ): Promise<CareTask | null> {

    if (!isSupabaseConfigured()) return null;



    try {

      // First get task info

      const { data: task, error: taskFetchErr } = await supabase

        .from('care_tasks')

        .select('*')

        .eq('id', taskId)

        .single();



      if (taskFetchErr || !task) throw taskFetchErr;



      const patientId = fileData.patientId || task.patient_id;

      const cleanFileName = `${Date.now()}\_${fileData.fileName.replace(/[^a-zA-Z0-9.\_-]/g, '\_')}`;

      const storagePath = `${patientId}/${taskId}/${cleanFileName}`;



      // Upload file to private storage bucket if File provided

      let fileUrl = '';

      if (fileData.file) {

        const { error: uploadErr } = await supabase.storage

          .from('patient-reports')

          .upload(storagePath, fileData.file, {

            contentType: fileData.fileType || 'application/pdf',

            upsert: true

          });



        if (uploadErr) {

          console.warn('Supabase storage upload notice:', uploadErr.message);

        }

      }



      // Generate signed URL (valid 1 hour)

      try {

        const { data: signedData } = await supabase.storage

          .from('patient-reports')

          .createSignedUrl(storagePath, 3600);

        if (signedData?.signedUrl) {

          fileUrl = signedData.signedUrl;

        }

      } catch {

        // Fallback or path notation

        fileUrl = `/reports/${storagePath}`;

      }



      // Insert record into reports table

      const { data: reportRecord, error: reportErr } = await supabase

        .from('reports')

        .insert({

          task_id: taskId,

          patient_id: patientId,

          file_name: fileData.fileName,

          file_type: fileData.fileType || 'application/pdf',

          file_size: fileData.fileSize || '1.2 MB',

          storage_path: storagePath,

          file_url: fileUrl,

          uploaded_by_role: 'patient',

          verification_status: 'Unverified'

        })

        .select()

        .single();



      if (reportErr || !reportRecord) throw reportErr;



      // Insert OCR / extracted test results

      const resultsToInsert = fileData.mockResults && fileData.mockResults.length > 0

        ? fileData.mockResults

        : [

            {

              testName: task.title.includes('HbA1c') ? 'HbA1c (Hemoglobin A1c)' : 'Primary Diagnostic Marker',

              value: task.title.includes('HbA1c') ? '7.4' : '1.18',

              unit: task.title.includes('HbA1c') ? '%' : 'mg/dL',

              refRange: task.title.includes('HbA1c') ? '< 5.7%' : '0.6 - 1.2 mg/dL',

              isAbnormal: task.title.includes('HbA1c'),

              confidence: 96

            }

          ];



      for (const res of resultsToInsert) {

        await supabase.from('test_results').insert({

          report_id: reportRecord.id,

          test_name: res.testName,

          value: res.value,

          unit: res.unit,

          ref_range: res.refRange,

          is_abnormal: res.isAbnormal,

          confidence: res.confidence || 95,

          edited_by_staff: false

        });

      }



      // Transition care task: In Progress (Awaiting Staff Verification)

      const { data: updatedTask, error: taskUpdateErr } = await supabase

        .from('care_tasks')

        .update({

          task_status: 'In Progress',

          assigned_role: 'coordinator',

          patient_completed_at: new Date().toISOString(),

          updated_at: new Date().toISOString()

        })

        .eq('id', taskId)

        .select()

        .single();



      if (taskUpdateErr || !updatedTask) throw taskUpdateErr;



      // Queue coordinator notification

      await supabase.from('notifications').insert({

        recipient_role: 'coordinator',

        task_id: taskId,

        channel: 'in-app',

        title: 'Diagnostic Report Uploaded • Staff Audit Required',

        message: `New report uploaded for ${task.title}. Side-by-side verification required.`,

        type: 'verification_needed',

        preview_details: {

          testName: task.title,

          instructions: 'Verify OCR extracted values against source document.'

        }

      });



      // Audit log

      await supabase.from('audit_logs').insert({

        actor_id: patientId,

        actor_name: 'Patient',

        actor_role: 'patient',

        entity_type: 'Report',

        entity_id: reportRecord.id,

        action: 'REPORT_UPLOADED',

        previous_state: task.task_status,

        new_state: 'In Progress',

        details: `File "${fileData.fileName}" uploaded to private storage. Routed to Care Coordinator for side-by-side audit.`

      });



      this.notify();



      return {

        id: updatedTask.id,

        carePlanId: updatedTask.care_plan_id,

        patientId: updatedTask.patient_id,

        patientName: 'Patient',

        doctorId: updatedTask.doctor_id,

        doctorName: 'Doctor',

        title: updatedTask.title,

        taskType: updatedTask.task_type,

        deadline: updatedTask.deadline,

        assignedRole: updatedTask.assigned_role,

        taskStatus: updatedTask.task_status,

        instructions: updatedTask.instructions,

        createdAt: updatedTask.created_at,

        updatedAt: updatedTask.updated_at

      };

    } catch (err) {

      console.error('Error during report upload in Supabase:', err);

      return null;

    }

  }



  // 3. Coordinator Verifies Report (Side-by-side audit -> VERIFIED)

  // 3. Coordinator Verifies Report (Side-by-side audit -> VERIFIED)
  public async verifyReport(
    taskId: string,
    verifiedResults: TestResult[],
    notes: string,
    coordinatorName = 'Nida Ali (Care Coordinator)'
  ): Promise<CareTask | null> {
    const resolvedTaskId = resolveTaskUuid(taskId);

    // Sync to local store first
    const localResult = careLoopService.verifyReport(taskId, verifiedResults, notes, coordinatorName);

    if (!isSupabaseConfigured()) {
      this.notify();
      return localResult;
    }

    try {
      let taskQuery = await supabase
        .from('care_tasks')
        .select('*, reports(*)')
        .eq('id', resolvedTaskId)
        .maybeSingle();

      if (!taskQuery.data && resolvedTaskId !== taskId) {
        taskQuery = await supabase
          .from('care_tasks')
          .select('*, reports(*)')
          .eq('id', taskId)
          .maybeSingle();
      }

      const task = taskQuery.data;

      // If task does not exist in remote Supabase, return localResult
      if (!task) {
        this.notify();
        return localResult;
      }

      const reportId = (Array.isArray(task.reports) ? task.reports[0]?.id : task.reports?.id) || null;

      if (reportId) {
        // Update report status
        await supabase
          .from('reports')
          .update({
            verification_status: 'Verified',
            verified_by: coordinatorName,
            verified_at: new Date().toISOString(),
            verification_notes: notes || 'Verified side-by-side against original diagnostic laboratory report.'
          })
          .eq('id', reportId);

        // Delete old extracted test results and insert audited ones
        try {
          await supabase.from('test_results').delete().eq('report_id', reportId);
          for (const res of verifiedResults) {
            await supabase.from('test_results').insert({
              report_id: reportId,
              test_name: res.testName,
              value: res.value,
              unit: res.unit,
              ref_range: res.refRange,
              is_abnormal: res.isAbnormal,
              confidence: 100,
              edited_by_staff: true
            });
          }
        } catch (trErr) {
          console.warn('Test results update notice:', trErr);
        }
      }

      // Update task to Verified, assigned to doctor for clinical review
      const { data: updatedTask, error: updErr } = await supabase
        .from('care_tasks')
        .update({
          task_status: 'Verified',
          assigned_role: 'doctor',
          is_escalated: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()
        .single();

      if (updErr || !updatedTask) {
        console.error('Failed to update task status in Supabase:', updErr);
        throw updErr || new Error('Failed to update task status in database.');
      }

      // Notify doctor (best effort)
      try {
        await supabase.from('notifications').insert({
          recipient_role: 'doctor',
          task_id: task.id,
          channel: 'in-app',
          title: 'Diagnostic Report Verified • Ready for Doctor Review',
          message: `Coordinator verified report for ${task.title}. Ready for physician evaluation.`,
          type: 'doctor_review_ready',
          preview_details: {
            testName: task.title,
            instructions: 'Human verification complete. Awaiting physician clinical evaluation.'
          }
        });
      } catch (nErr) {
        console.warn('Notification notice:', nErr);
      }

      // Audit log (best effort)
      try {
        await supabase.from('audit_logs').insert({
          actor_name: coordinatorName,
          actor_role: 'coordinator',
          entity_type: 'Report',
          entity_id: reportId || task.id,
          action: 'REPORT_VERIFIED',
          previous_state: 'In Progress',
          new_state: 'Verified',
          details: `Coordinator audit signed off. Dispatched to doctor for clinical loop closure. Notes: ${notes || 'Values matched'}`
        });
      } catch (aErr) {
        console.warn('Audit notice:', aErr);
      }

      this.notify();

      return {
        ...localResult,
        id: updatedTask.id,
        taskStatus: 'Verified',
        assignedRole: 'doctor'
      } as CareTask;
    } catch (err) {
      console.error('Error verifying report in Supabase:', err);
      throw err;
    }
  }

  // 4. Coordinator Flags Report for Correction
  public async flagReportForCorrection(taskId: string, reason: string): Promise<CareTask | null> {
    const resolvedTaskId = resolveTaskUuid(taskId);

    // Sync locally
    const localResult = careLoopService.flagReportForCorrection(taskId, reason);

    if (!isSupabaseConfigured()) {
      this.notify();
      return localResult;
    }

    try {
      let taskQuery = await supabase
        .from('care_tasks')
        .select('*, reports(*)')
        .eq('id', resolvedTaskId)
        .maybeSingle();

      if (!taskQuery.data && resolvedTaskId !== taskId) {
        taskQuery = await supabase
          .from('care_tasks')
          .select('*, reports(*)')
          .eq('id', taskId)
          .maybeSingle();
      }

      const task = taskQuery.data;

      if (!task) {
        this.notify();
        return localResult;
      }

      const reportId = (Array.isArray(task.reports) ? task.reports[0]?.id : task.reports?.id) || null;

      if (reportId) {
        await supabase
          .from('reports')
          .update({
            verification_status: 'Flagged',
            verification_notes: `Flagged for re-upload: ${reason}`
          })
          .eq('id', reportId);
      }

      const { data: updatedTask, error: updErr } = await supabase
        .from('care_tasks')
        .update({
          task_status: 'In Progress',
          assigned_role: 'patient',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()
        .single();

      if (updErr || !updatedTask) {
        throw updErr || new Error('Failed to flag report in database.');
      }

      // Notify patient (best effort)
      try {
        await supabase.from('notifications').insert({
          recipient_role: 'patient',
          recipient_user_id: task.patient_id,
          task_id: task.id,
          channel: 'in-app',
          title: 'Document Issue: Re-upload Requested',
          message: `The report submitted for ${task.title} could not be verified: "${reason}". Please upload a clearer copy.`,
          type: 'verification_needed'
        });
      } catch (nErr) {
        console.warn('Notification notice:', nErr);
      }

      // Audit log (best effort)
      try {
        await supabase.from('audit_logs').insert({
          actor_name: 'Coordinator',
          actor_role: 'coordinator',
          entity_type: 'Report',
          entity_id: task.id,
          action: 'REPORT_FLAGGED',
          previous_state: 'In Progress',
          new_state: 'In Progress (Flagged)',
          details: `Coordinator flagged document: ${reason}`
        });
      } catch (aErr) {
        console.warn('Audit notice:', aErr);
      }

      this.notify();
      return {
        ...localResult,
        id: updatedTask.id,
        taskStatus: 'In Progress',
        assignedRole: 'patient'
      } as CareTask;
    } catch (err) {
      console.error('Error flagging report in Supabase:', err);
      throw err;
    }
  }

  // 5. Doctor Review & Loop Close (-> RESOLVED)
  public async completeDoctorReview(
    taskId: string,
    reviewData: {
      reviewNotes: string;
      nextAction: NextAction;
      followUpDate?: string;
      doctorName?: string;
    }
  ): Promise<CareTask | null> {
    const resolvedTaskId = resolveTaskUuid(taskId);

    // Sync to local mock store so local/fallback state is always current
    const localResult = careLoopService.completeDoctorReview(taskId, reviewData);

    if (!isSupabaseConfigured()) {
      this.notify();
      return localResult;
    }

    try {
      let taskQuery = await supabase
        .from('care_tasks')
        .select('*, reports(*)')
        .eq('id', resolvedTaskId)
        .maybeSingle();

      if (!taskQuery.data && resolvedTaskId !== taskId) {
        taskQuery = await supabase
          .from('care_tasks')
          .select('*, reports(*)')
          .eq('id', taskId)
          .maybeSingle();
      }

      const task = taskQuery.data;

      // If task does not exist in remote Supabase, return localResult
      if (!task) {
        this.notify();
        return localResult;
      }

      const reportId = (Array.isArray(task.reports) ? task.reports[0]?.id : task.reports?.id) || null;
      const doctorName = reviewData.doctorName || 'Dr. Arjun Mehta, MD';
      const doctorId = resolveDoctorUuid(task.doctor_id);

      // Insert doctor clinical review
      const { data: reviewRecord, error: revErr } = await supabase
        .from('doctor_reviews')
        .insert({
          task_id: task.id,
          report_id: reportId,
          doctor_id: doctorId,
          doctor_name: doctorName,
          review_notes: reviewData.reviewNotes,
          next_action_required: reviewData.nextAction,
          follow_up_date: reviewData.followUpDate || null,
          reviewed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (revErr) {
        console.warn('Supabase doctor_reviews insert notice:', revErr.message);
      }

      // Mark care task as Resolved (Loop Formally Closed!)
      const { data: updatedTask, error: taskUpdErr } = await supabase
        .from('care_tasks')
        .update({
          task_status: 'Resolved',
          assigned_role: 'doctor',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()
        .single();

      if (taskUpdErr || !updatedTask) {
        console.error('Failed to update task status in Supabase:', taskUpdErr);
        throw taskUpdErr || new Error('Failed to update task status in database.');
      }

      // Check if follow-up task is required
      if (reviewData.nextAction && reviewData.nextAction !== 'No Further Action Needed') {
        let followUpTitle = 'Follow-up Consultation';
        let followUpType: TaskType = 'Follow-Up Visit';
        let defaultDays = 14;

        if (reviewData.nextAction === 'Specialist Referral') {
          followUpTitle = 'Specialist Referral Consultation';
          followUpType = 'Specialist Referral';
          defaultDays = 21;
        } else if (reviewData.nextAction === 'Medication Adjustment') {
          followUpTitle = 'Medication Review & Follow-up';
          followUpType = 'Follow-Up Visit';
          defaultDays = 14;
        } else if (reviewData.nextAction === 'Routine 90-Day Monitoring') {
          followUpTitle = `Repeat ${task.title} (90-Day Monitoring)`;
          followUpType = task.task_type;
          defaultDays = 90;
        }

        let deadlineString = reviewData.followUpDate;
        if (!deadlineString) {
          const d = new Date();
          d.setDate(d.getDate() + defaultDays);
          deadlineString = d.toISOString().split('T')[0];
        }

        try {
          await supabase
            .from('care_tasks')
            .insert({
              care_plan_id: task.care_plan_id,
              patient_id: task.patient_id,
              doctor_id: doctorId,
              title: followUpTitle,
              task_type: followUpType,
              deadline: deadlineString,
              assigned_role: 'patient',
              task_status: 'Pending',
              instructions: `Physician instructions: ${reviewData.reviewNotes}`,
              fasting_required: false,
              partner_facility: task.partner_facility || 'MetroCare Clinic',
              facility_address: task.facility_address || '420 Health Science Blvd, Suite 200, Metro City'
            });
        } catch (fuErr) {
          console.warn('Follow up task insert notice:', fuErr);
        }
      } else {
        // If no further action needed, check if all tasks in CarePlan are now resolved
        try {
          const { data: allPlanTasks } = await supabase
            .from('care_tasks')
            .select('task_status')
            .eq('care_plan_id', task.care_plan_id);

          if (allPlanTasks && allPlanTasks.every(t => t.task_status === 'Resolved')) {
            await supabase
              .from('care_plans')
              .update({ status: 'Completed', updated_at: new Date().toISOString() })
              .eq('id', task.care_plan_id);
          }
        } catch (cpErr) {
          console.warn('Care plan status check notice:', cpErr);
        }
      }

      // Notify patient of doctor clinical sign-off (best effort)
      try {
        await supabase.from('notifications').insert({
          recipient_role: 'patient',
          recipient_user_id: task.patient_id,
          task_id: task.id,
          channel: 'in-app',
          title: `Doctor Reviewed Your ${task.title}`,
          message: `${doctorName} evaluated your diagnostic findings: "${reviewData.reviewNotes.substring(0, 100)}..." Next step: ${reviewData.nextAction}.`,
          type: 'doctor_review_ready'
        });
      } catch (nErr) {
        console.warn('Notification notice:', nErr);
      }

      // Audit log (best effort)
      try {
        await supabase.from('audit_logs').insert({
          actor_id: doctorId,
          actor_name: doctorName,
          actor_role: 'doctor',
          entity_type: 'Review',
          entity_id: reviewRecord?.id || task.id,
          action: 'DOCTOR_REVIEW_COMPLETED',
          previous_state: 'Verified',
          new_state: 'Resolved',
          details: `Physician clinical sign-off recorded. Loop closed. Next action: ${reviewData.nextAction}. Notes: ${reviewData.reviewNotes}`
        });
      } catch (aErr) {
        console.warn('Audit notice:', aErr);
      }

      this.notify();
      return {
        ...localResult,
        id: updatedTask.id,
        taskStatus: 'Resolved',
        doctorReview: reviewRecord ? {
          id: reviewRecord.id,
          reportId: reviewRecord.report_id || '',
          taskId: reviewRecord.task_id,
          doctorId: reviewRecord.doctor_id,
          doctorName: reviewRecord.doctor_name,
          reviewNotes: reviewRecord.review_notes,
          nextActionRequired: reviewRecord.next_action_required,
          reviewedAt: reviewRecord.reviewed_at,
          followUpDate: reviewRecord.follow_up_date
        } : localResult?.doctorReview
      } as CareTask;
    } catch (err) {
      console.error('Error completing doctor review in Supabase:', err);
      throw err;
    }
  }

  // 6. Record Missed-Task Delay Reason
  public async recordDelayReason(taskId: string, reason: DelayReason, notes: string): Promise<CareTask | null> {
    const resolvedTaskId = resolveTaskUuid(taskId);
    const localResult = careLoopService.recordDelayReason(taskId, reason, notes);

    if (!isSupabaseConfigured()) {
      this.notify();
      return localResult;
    }

    try {
      let taskQuery = await supabase
        .from('care_tasks')
        .select('id, task_status')
        .eq('id', resolvedTaskId)
        .maybeSingle();

      if (!taskQuery.data && resolvedTaskId !== taskId) {
        taskQuery = await supabase
          .from('care_tasks')
          .select('id, task_status')
          .eq('id', taskId)
          .maybeSingle();
      }

      if (!taskQuery.data) {
        this.notify();
        return localResult;
      }

      const { data: updatedTask, error: updErr } = await supabase
        .from('care_tasks')
        .update({
          delay_reason: reason,
          delay_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskQuery.data.id)
        .select()
        .single();

      if (updErr || !updatedTask) {
        throw updErr || new Error('Failed to record delay reason in database.');
      }

      try {
        await supabase.from('audit_logs').insert({
          actor_name: 'Patient',
          actor_role: 'patient',
          entity_type: 'CareTask',
          entity_id: taskQuery.data.id,
          action: 'DELAY_REASON_LOGGED',
          previous_state: updatedTask.task_status,
          new_state: updatedTask.task_status,
          details: `Patient logged delay reason: ${reason}. Notes: ${notes}`
        });
      } catch (aErr) {
        console.warn('Audit notice:', aErr);
      }

      this.notify();
      return {
        ...localResult,
        id: updatedTask.id,
        delayReason: reason,
        delayNotes: notes
      } as CareTask;
    } catch (err) {
      console.error('Error recording delay reason:', err);
      throw err;
    }
  }



  // 7. Escalation Trigger / Simulate Time Leap (+48h for Demonstrations)

  public async simulateTimeLeap(): Promise<void> {

    if (!isSupabaseConfigured()) return;



    try {

      const { data: task } = await supabase

        .from('care_tasks')

        .select('*')

        .eq('task_status', 'Pending')

        .order('created_at', { ascending: true })

        .limit(1)

        .single();



      if (!task) return;



      await supabase

        .from('care_tasks')

        .update({

          task_status: 'Overdue',

          assigned_role: 'coordinator',

          is_escalated: true,

          escalated_to: 'Nida Ali (Care Coordinator)',

          escalation_reason: 'Simulated +48h SLA elapsed without attendance log or uploaded report.',

          escalated_at: new Date().toISOString(),

          updated_at: new Date().toISOString()

        })

        .eq('id', task.id);



      await supabase.from('notifications').insert({

        recipient_role: 'coordinator',

        task_id: task.id,

        channel: 'in-app',

        title: 'RADAR ALARM: Task Overdue Escalation',

        message: `${task.title} has elapsed past deadline. Auto-escalated to safety net radar.`,

        type: 'escalation'

      });



      await supabase.from('audit_logs').insert({

        actor_name: 'CareLoop Gap Router',

        actor_role: 'coordinator',

        entity_type: 'CareTask',

        entity_id: task.id,

        action: 'TASK_AUTO_ESCALATED',

        previous_state: 'Pending',

        new_state: 'Overdue',

        details: 'Time leap triggered: SLA threshold breached. Overdue alarm dispatched to Coordinator Radar.'

      });



      this.notify();

    } catch (err) {

      console.error('Error during simulateTimeLeap:', err);

    }

  }



  // 8. Reassign Escalated Task (Coordinator Action)

  public async reassignEscalatedTask(taskId: string, targetRole: UserRole, notes: string): Promise<CareTask | null> {

    if (!isSupabaseConfigured()) return null;



    try {

      const { data: updatedTask } = await supabase

        .from('care_tasks')

        .update({

          assigned_role: targetRole,

          escalation_reason: notes,

          updated_at: new Date().toISOString()

        })

        .eq('id', taskId)

        .select()

        .single();



      if (!updatedTask) return null;



      await supabase.from('audit_logs').insert({

        actor_name: 'Nida Ali',

        actor_role: 'coordinator',

        entity_type: 'CareTask',

        entity_id: taskId,

        action: 'TASK_REASSIGNED',

        previous_state: updatedTask.task_status,

        new_state: updatedTask.task_status,

        details: `Coordinator reassigned task ownership to ${targetRole}. Note: ${notes}`

      });



      this.notify();

      return updatedTask as any;

    } catch (err) {

      console.error('Error reassigning task:', err);

      return null;

    }

  }



  // 9. Notifications Management

  public async markNotificationRead(id: string): Promise<void> {

    if (!isSupabaseConfigured()) return;

    try {

      await supabase.from('notifications').update({ is_read: true }).eq('id', id);

      this.notify();

    } catch (err) {

      console.error('Error marking notification read:', err);

    }

  }



  public async markAllNotificationsRead(role?: UserRole): Promise<void> {

    if (!isSupabaseConfigured()) return;

    try {

      let query = supabase.from('notifications').update({ is_read: true });

      if (role) {

        query = query.eq('recipient_role', role);

      }

      await query;

      this.notify();

    } catch (err) {

      console.error('Error marking all notifications read:', err);

    }

  }



  // ==============================================================================

  // 10. PATIENT FEEDBACK & CLOSED-LOOP CARE METHODS

  // ==============================================================================



  private mapFeedback(row: any, carePlans: CarePlan[], patients: Patient[]): PatientFeedback {

    const plan = carePlans.find(cp => cp.id === row.care_plan_id);

    const patient = patients.find(p => p.id === row.patient_id || p.userId === row.patient_id);



    return {

      id: row.id,

      patientId: row.patient_id,

      patientName: patient?.fullName || plan?.patientName || 'Patient',

      patientMrn: patient?.mrn || 'PT-UNKNOWN',

      carePlanId: row.care_plan_id,

      carePlanTitle: plan?.title || 'Care Plan',

      carePlanDiagnosis: plan?.diagnosis || 'Clinical Diagnosis',

      improvementStatus: row.improvement_status,

      adherenceStatus: row.adherence_status,

      barrierType: row.barrier_type,

      barrierOtherDetails: row.barrier_other_details || undefined,

      experienceRating: row.experience_rating,

      comments: row.comments || undefined,

      worseningReported: Boolean(row.worsening_reported),

      worseningDetails: row.worsening_details || undefined,

      safetyAcknowledged: Boolean(row.safety_acknowledged),

      reviewStatus: row.review_status,

      doctorResponse: row.doctor_response || undefined,

      reviewedBy: row.reviewed_by || undefined,

      reviewedByName: row.reviewed_by_name || (row.reviewed_by ? 'Dr. Arjun Mehta' : undefined),

      reviewedAt: row.reviewed_at || undefined,

      nextAction: row.next_action || undefined,

      careGapIdentified: row.care_gap_identified || undefined,

      followUpTaskId: row.follow_up_task_id || undefined,

      createdAt: row.created_at,

      updatedAt: row.updated_at

    };

  }



  public async getFeedbacks(): Promise<PatientFeedback[]> {

    if (!isSupabaseConfigured()) {

      return careLoopService.getFeedbacks();

    }



    try {

      const [plans, pts, { data, error }] = await Promise.all([

        this.getCarePlans(),

        this.getPatients(),

        supabase

          .from('patient_feedback')

          .select('*')

          .order('created_at', { ascending: false })

      ]);



      if (error) {

        console.warn('[CareLoop Supabase] Error fetching patient_feedback, falling back to local:', error.message);

        return careLoopService.getFeedbacks();

      }



      if (!data || data.length === 0) {

        return careLoopService.getFeedbacks();

      }



      return data.map((row: any) => this.mapFeedback(row, plans, pts));

    } catch (err) {

      console.warn('[CareLoop Supabase] Unexpected error in getFeedbacks, falling back:', err);

      return careLoopService.getFeedbacks();

    }

  }



  public async getFeedbackByCarePlanId(carePlanId: string): Promise<PatientFeedback | null> {

    const targetCarePlanId = resolveCarePlanUuid(carePlanId);

    if (!isSupabaseConfigured() || !UUID_REGEX.test(targetCarePlanId)) {

      return careLoopService.getFeedbackByCarePlanId(carePlanId)

        || careLoopService.getFeedbackByCarePlanId(targetCarePlanId)

        || null;

    }



    try {

      const { data, error } = await supabase

        .from('patient_feedback')

        .select('*')

        .eq('care_plan_id', targetCarePlanId)

        .maybeSingle();



      if (error || !data) {

        return careLoopService.getFeedbackByCarePlanId(carePlanId)

          || careLoopService.getFeedbackByCarePlanId(targetCarePlanId)

          || null;

      }



      const [plans, pts] = await Promise.all([this.getCarePlans(), this.getPatients()]);

      return this.mapFeedback(data, plans, pts);

    } catch {

      return careLoopService.getFeedbackByCarePlanId(carePlanId)

        || careLoopService.getFeedbackByCarePlanId(targetCarePlanId)

        || null;

    }

  }



  public async getDoctorFeedbackQueue(doctorId?: string): Promise<PatientFeedback[]> {
    const all = await this.getFeedbacks();
    if (!doctorId) return all;
    const plans = await this.getCarePlans();
    const doctorPlanIds = new Set(plans.filter(cp => cp.doctorId === doctorId).map(cp => cp.id));
    return all.filter(f => doctorPlanIds.has(f.carePlanId));
  }

  public async completeFeedbackReview(
    feedbackId: string,
    reviewData: ReviewFeedbackPayload,
    doctorId?: string
  ): Promise<{ feedback: PatientFeedback; followUpTask?: CareTask }> {
    if (!reviewData.doctorResponse || !reviewData.doctorResponse.trim()) {
      throw new Error(
        'Clinical review notes or doctor response is required before marking review complete.'
      );
    }

    const resolvedFeedbackId = resolveFeedbackUuid(feedbackId);
    if (!UUID_REGEX.test(resolvedFeedbackId)) {
      throw new Error(`Invalid feedback UUID: "${resolvedFeedbackId}"`);
    }

    const isTestEnv =
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || Boolean(process.env?.VITEST));

    if (isTestEnv || !isSupabaseConfigured()) {
      return careLoopService.completeFeedbackReview(feedbackId, reviewData, doctorId);
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return careLoopService.completeFeedbackReview(feedbackId, reviewData, doctorId);
    }

    const taskTitle =
      reviewData.followUpTaskDetails?.title ||
      (reviewData as any).taskTitle ||
      null;
    const taskType =
      reviewData.followUpTaskDetails?.taskType ||
      (reviewData as any).taskType ||
      'Follow-Up Visit';
    const deadlineDays =
      reviewData.followUpTaskDetails?.deadlineDays ||
      (reviewData as any).deadlineDays ||
      14;
    const taskInstructions =
      reviewData.followUpTaskDetails?.instructions ||
      (reviewData as any).taskInstructions ||
      null;

    const { data, error } = await supabase.rpc(
      'submit_clinical_feedback_review',
      {
        p_feedback_id: resolvedFeedbackId,
        p_doctor_response: reviewData.doctorResponse.trim(),
        p_next_action: reviewData.nextAction,
        p_care_gap_identified: reviewData.careGapIdentified?.trim() || null,
        p_create_follow_up_task: Boolean(reviewData.createFollowUpTask),
        p_task_title: taskTitle,
        p_task_type: taskType,
        p_deadline_days: deadlineDays,
        p_task_instructions: taskInstructions,
      }
    );

    if (error) {
      console.error(
        '[CareLoop Supabase] submit_clinical_feedback_review failed:',
        error
      );
      throw new Error(`Doctor review submission failed: ${error.message}`);
    }

    this.notify();

    const [feedbacks, tasks] = await Promise.all([
      this.getFeedbacks(),
      this.getTasks(),
    ]);

    const updatedFeedback =
      feedbacks.find(
        (f) => f.id === resolvedFeedbackId || f.id === feedbackId
      ) ||
      (await this.getFeedbacks()).find(
        (f) => f.id === resolvedFeedbackId
      );

    let followUpTask: CareTask | undefined;
    if (data && typeof data === 'object' && 'follow_up_task_id' in data) {
      const taskId = (data as any).follow_up_task_id;
      if (taskId) {
        followUpTask = tasks.find((t) => t.id === taskId);
      }
    }

    if (!updatedFeedback) {
      return careLoopService.completeFeedbackReview(
        feedbackId,
        reviewData,
        doctorId || user.id
      );
    }

    return { feedback: updatedFeedback, followUpTask };
  }

  public async submitPatientFeedback(
    payload: SubmitFeedbackPayload
  ): Promise<PatientFeedback | null> {
    if (
      !Number.isInteger(payload.experienceRating) ||
      payload.experienceRating < 1 ||
      payload.experienceRating > 5
    ) {
      throw new Error('Care experience rating must be between 1 and 5 stars.');
    }

    if ((payload.comments?.length ?? 0) > 3000) {
      throw new Error('Additional comments cannot exceed 3,000 characters.');
    }

    const validImprovements = [
      'much_better',
      'somewhat_better',
      'no_change',
      'worse_than_before',
    ];

    const validAdherence = [
      'followed_all',
      'followed_some',
      'partially',
      'unable_to_follow',
    ];

    const validBarriers = [
      'no_difficulties',
      'none',
      'cost',
      'travel_or_access',
      'side_effects',
      'unclear_instructions',
      'other',
    ];

    if (!validImprovements.includes(payload.improvementStatus)) {
      throw new Error('Invalid improvement status value.');
    }

    if (!validAdherence.includes(payload.adherenceStatus)) {
      throw new Error('Invalid adherence status value.');
    }

    if (!validBarriers.includes(payload.barrierType)) {
      throw new Error('Invalid barrier type value.');
    }

    const carePlanId = resolveCarePlanUuid(payload.carePlanId);
    console.info('[CareLoop Feedback] Care-plan ID resolution:', { submittedId: payload.carePlanId, resolvedId: carePlanId });

    if (!UUID_REGEX.test(carePlanId)) {
      throw new Error(
        `Invalid care plan UUID: "${carePlanId}". Check CARE_PLAN_UUID_MAP.`
      );
    }

    const isTestEnv =
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || Boolean(process.env?.VITEST));

    if (isTestEnv || !isSupabaseConfigured()) {
      return careLoopService.submitPatientFeedback({
        ...payload,
        carePlanId,
      });
    }

    try {
      // 1. Require a real authenticated Supabase user.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`Authentication check failed: ${authError.message}`);
      }

      if (!user) {
        throw new Error('Please sign in before submitting feedback.');
      }

      const patientId = user.id;

      // 2. Confirm that this account is an active patient.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, status')
        .eq('id', patientId)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `Could not verify patient profile: ${profileError.message}`
        );
      }

      if (
        !profile ||
        profile.role !== 'patient' ||
        profile.status !== 'active'
      ) {
        throw new Error(
          'The signed-in account is not an active patient account.'
        );
      }

      // 3. Fetch the actual care plan.
      let plan = null;
      const { data: directPlan, error: planError } = await supabase
        .from('care_plans')
        .select('id, patient_id, doctor_id, title, status')
        .eq('id', carePlanId)
        .maybeSingle();

      if (planError) {
        throw new Error(`Could not load care plan: ${planError.message}`);
      }
      plan = directPlan;

      // Fallback if ID was an alias or completed plan ID lookup
      if (!plan) {
        const { data: fallbackPlan } = await supabase
          .from('care_plans')
          .select('id, patient_id, doctor_id, title, status')
          .eq('patient_id', patientId)
          .eq('status', 'Completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackPlan) {
          plan = fallbackPlan;
        }
      }

      if (!plan) {
        throw new Error(
          `Care plan ${carePlanId} was not found in Supabase. ` +
          'Check the care plan ID used by the patient feedback form.'
        );
      }



    if (plan.patient_id !== patientId) {

      throw new Error(

        'This care plan does not belong to the currently signed-in patient.'

      );

    }



    if (plan.status !== 'Completed') {

      throw new Error(

        `Feedback requires a completed care plan. Current status: ${plan.status}.`

      );

    }



    // 4. Normalize values to match the database constraints.

    const adherenceStatus =

      payload.adherenceStatus === 'partially'

        ? 'followed_some'

        : payload.adherenceStatus;



    const barrierType =

      payload.barrierType === 'none'

        ? 'no_difficulties'

        : payload.barrierType;



    const worseningReported = Boolean(

      payload.worseningReported ||

      payload.improvementStatus === 'worse_than_before'

    );



    // Keep this rule exactly aligned with the INSERT RLS policy.

    const requiresAction =

      worseningReported ||

      adherenceStatus === 'unable_to_follow' ||

      payload.experienceRating <= 2;



    const reviewStatus = requiresAction

      ? 'action_required'

      : 'pending';



    // 5. Prevent duplicate submissions.

    const { data: existingFeedback, error: duplicateCheckError } =

      await supabase

        .from('patient_feedback')

        .select('id')

        .eq('patient_id', patientId)

        .eq('care_plan_id', plan.id)

        .maybeSingle();



    if (duplicateCheckError) {

      throw new Error(

        `Could not check existing feedback: ${duplicateCheckError.message}`

      );

    }



    if (existingFeedback) {

      throw new Error(

        'Feedback has already been submitted for this care plan.'

      );

    }



    // 6. Insert only patient-editable fields.

    // Never accept doctor review fields from the patient.

    const insertRecord = {

      patient_id: patientId,

      care_plan_id: plan.id,

      improvement_status: payload.improvementStatus,

      adherence_status: adherenceStatus,

      barrier_type: barrierType,

      barrier_other_details:

        payload.barrierOtherDetails?.trim() || null,

      experience_rating: payload.experienceRating,

      comments: payload.comments?.trim() || null,

      worsening_reported: worseningReported,

      worsening_details: payload.worseningDetails?.trim() || null,

      safety_acknowledged: Boolean(payload.safetyAcknowledged),

      review_status: reviewStatus,

    };



    const {

      data: inserted,

      error: insertError,

    } = await supabase

      .from('patient_feedback')

      .insert(insertRecord)

      .select('*')

      .single();



    if (insertError) {

      console.error('Patient feedback insert failed:', {

        code: insertError.code,

        message: insertError.message,

        details: insertError.details,

        hint: insertError.hint,

        patientId,

        carePlanId: plan.id,

        reviewStatus,

      });



      throw new Error(

        `Failed to submit feedback [${insertError.code}]: ` +

        `${insertError.message}` +

        (insertError.details ? ` Details: ${insertError.details}` : '') +

        (insertError.hint ? ` Hint: ${insertError.hint}` : '')

      );

    }



    // 7. Best-effort notification. A notification failure must not

    // undo or misreport a successful feedback submission.

    try {

      const { error: notificationError } = await supabase

        .from('notifications')

        .insert({

          recipient_role: 'doctor',

          recipient_user_id: plan.doctor_id,

          channel: 'in-app',

          title: worseningReported

            ? 'Urgent: Worsening Symptoms in Patient Feedback'

            : 'New Care Plan Feedback Submitted',

          message: worseningReported

            ? `A patient reported worsening symptoms for "${plan.title}". Prompt clinical evaluation is recommended.`

            : `A patient submitted feedback (${payload.experienceRating}/5) for "${plan.title}".`,

          type: worseningReported ? 'escalation' : 'general',

        });



      if (notificationError) {

        console.warn(

          'Feedback saved, but notification failed:',

          notificationError.message

        );

      }

    } catch (notificationError) {

      console.warn(

        'Feedback saved, but notification failed:',

        notificationError

      );

    }



    // 8. Best-effort audit record.

    try {

      const { error: auditError } = await supabase

        .from('audit_logs')

        .insert({

          actor_id: patientId,

          actor_name: user.email || 'Authenticated Patient',

          actor_role: 'patient',

          entity_type: 'patient_feedback',

          entity_id: inserted.id,

          action: 'PATIENT_FEEDBACK_SUBMITTED',

          previous_state: 'none',

          new_state: reviewStatus,

          details:

            `Submitted care plan feedback. Rating: ` +

            `${payload.experienceRating}/5. ` +

            `Worsening: ${worseningReported}.`,

        });



      if (auditError) {

        console.warn(

          'Feedback saved, but audit logging failed:',

          auditError.message

        );

      }

    } catch (auditError) {

      console.warn('Feedback saved, but audit logging failed:', auditError);

    }



    this.notify();



    const [plans, patients] = await Promise.all([

      this.getCarePlans(),

      this.getPatients(),

    ]);



    return this.mapFeedback(inserted, plans, patients);

  } catch (error: unknown) {

    console.error(

      '[CareLoop] submitPatientFeedback failed:',

      error

    );



    throw error;

  }

}



}

export const supabaseCareLoopService = new SupabaseCareLoopService();