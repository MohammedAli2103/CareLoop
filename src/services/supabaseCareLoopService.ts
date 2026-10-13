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
  DoctorReview
} from '../types';
import {
  INITIAL_CARE_PLANS,
  INITIAL_PATIENTS,
  INITIAL_TASKS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS
} from '../data/mockData';

export class SupabaseCareLoopService {
  private listeners: (() => void)[] = [];
  private realtimeChannel: any = null;

  constructor() {
    this.initRealtime();
  }

  private initRealtime() {
    if (!isSupabaseConfigured()) return;

    try {
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
    if (!isSupabaseConfigured()) return INITIAL_USERS;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, avatar_url');

      if (error || !data || data.length === 0) return INITIAL_USERS;

      return data.map((p: any) => ({
        id: p.id,
        email: p.email || '',
        role: p.role as UserRole,
        fullName: p.full_name,
        avatarUrl: p.avatar_url,
        title: p.role === 'doctor' ? 'Staff Physician' : p.role === 'coordinator' ? 'Care Coordinator' : 'Patient'
      }));
    } catch {
      return INITIAL_USERS;
    }
  }

  public async getPatients(): Promise<Patient[]> {
    if (!isSupabaseConfigured()) return INITIAL_PATIENTS;

    try {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select(`
          id,
          mrn,
          date_of_birth,
          gender,
          blood_group,
          emergency_contact_name,
          emergency_contact_phone,
          primary_diagnosis,
          assigned_doctor_id,
          profiles:id (
            full_name,
            email,
            phone
          ),
          doctor:assigned_doctor_id (
            full_name
          )
        `);

      if (error || !data || data.length === 0) return INITIAL_PATIENTS;

      return data.map((row: any) => {
        const profile = row.profiles || {};
        const doctor = row.doctor || {};
        const birthDate = row.date_of_birth ? new Date(row.date_of_birth) : new Date('1990-01-01');
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000));

        return {
          id: row.id,
          userId: row.id,
          mrn: row.mrn || `MRN-${row.id.substring(0, 5).toUpperCase()}`,
          fullName: profile.full_name || 'Patient',
          dateOfBirth: row.date_of_birth || '1990-01-01',
          age: isNaN(age) ? 35 : age,
          gender: row.gender || 'Not specified',
          phone: profile.phone || '',
          email: profile.email || '',
          emergencyContact: `${row.emergency_contact_name || 'Relative'} (${row.emergency_contact_phone || 'N/A'})`,
          primaryDiagnosis: row.primary_diagnosis || 'Under Evaluation',
          assignedDoctorId: row.assigned_doctor_id || 'doctor-1',
          assignedDoctorName: doctor.full_name || 'Dr. Arjun Mehta, MD',
          bloodGroup: row.blood_group
        };
      });
    } catch {
      return INITIAL_PATIENTS;
    }
  }

  public async getCarePlans(): Promise<CarePlan[]> {
    if (!isSupabaseConfigured()) return INITIAL_CARE_PLANS;

    try {
      const { data, error } = await supabase
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
          patient:patient_id ( full_name ),
          doctor:doctor_id ( full_name ),
          care_tasks ( id )
        `);

      if (error || !data || data.length === 0) return INITIAL_CARE_PLANS;

      return data.map((cp: any) => ({
        id: cp.id,
        patientId: cp.patient_id,
        patientName: cp.patient?.full_name || 'Patient',
        doctorId: cp.doctor_id,
        doctorName: cp.doctor?.full_name || 'Doctor',
        title: cp.title,
        diagnosis: cp.diagnosis,
        status: cp.status as 'Active' | 'Completed',
        startDate: cp.start_date,
        targetEndDate: cp.target_end_date,
        clinicalNotes: cp.clinical_notes || '',
        taskIds: (cp.care_tasks || []).map((t: any) => t.id)
      }));
    } catch {
      return INITIAL_CARE_PLANS;
    }
  }

  public async getTasks(): Promise<CareTask[]> {
    if (!isSupabaseConfigured()) return INITIAL_TASKS;

    try {
      const { data, error } = await supabase
        .from('care_tasks')
        .select(`
          *,
          patient:patient_id ( full_name ),
          doctor:doctor_id ( full_name ),
          reports (
            *,
            test_results ( * )
          ),
          doctor_reviews ( * )
        `)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return INITIAL_TASKS;

      return data.map((row: any) => {
        let reportObj: Report | undefined = undefined;
        if (row.reports && row.reports.length > 0) {
          const r = row.reports[0];
          reportObj = {
            id: r.id,
            taskId: r.task_id,
            fileName: r.file_name,
            fileType: r.file_type,
            fileSize: r.file_size,
            fileUrl: r.file_url,
            uploadedAt: r.uploaded_at,
            uploadedByRole: r.uploaded_by_role,
            verificationStatus: r.verification_status,
            verifiedBy: r.verified_by,
            verifiedAt: r.verified_at,
            verificationNotes: r.verification_notes,
            extractedResults: (r.test_results || []).map((tr: any) => ({
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
        if (row.doctor_reviews && row.doctor_reviews.length > 0) {
          const rev = row.doctor_reviews[0];
          doctorReviewObj = {
            id: rev.id,
            reportId: rev.report_id || '',
            taskId: rev.task_id,
            doctorId: rev.doctor_id,
            doctorName: rev.doctor_name,
            reviewNotes: rev.review_notes,
            nextActionRequired: rev.next_action_required,
            reviewedAt: rev.reviewed_at,
            followUpDate: rev.follow_up_date
          };
        }

        return {
          id: row.id,
          carePlanId: row.care_plan_id,
          patientId: row.patient_id,
          patientName: row.patient?.full_name || 'Patient',
          doctorId: row.doctor_id,
          doctorName: row.doctor?.full_name || 'Doctor',
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
    } catch {
      return INITIAL_TASKS;
    }
  }

  public async getNotifications(role?: UserRole): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured()) {
      if (!role) return INITIAL_NOTIFICATIONS;
      return INITIAL_NOTIFICATIONS.filter(n => n.recipientRole === role);
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
        if (!role) return INITIAL_NOTIFICATIONS;
        return INITIAL_NOTIFICATIONS.filter(n => n.recipientRole === role);
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
      if (!role) return INITIAL_NOTIFICATIONS;
      return INITIAL_NOTIFICATIONS.filter(n => n.recipientRole === role);
    }
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    if (!isSupabaseConfigured()) return INITIAL_AUDIT_LOGS;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) return INITIAL_AUDIT_LOGS;

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
      return INITIAL_AUDIT_LOGS;
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

    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      // 1. Insert care plan
      const { data: planData, error: planErr } = await supabase
        .from('care_plans')
        .insert({
          patient_id: params.patientId,
          doctor_id: params.doctorId,
          title: params.title,
          diagnosis: params.diagnosis,
          status: 'Active',
          start_date: new Date().toISOString().split('T')[0],
          target_end_date: deadlineString,
          clinical_notes: `Order created by clinician. Target SLA: ${params.deadlineDays} days.`
        })
        .select()
        .single();

      if (planErr || !planData) throw planErr;

      // 2. Insert initial task
      const { data: taskData, error: taskErr } = await supabase
        .from('care_tasks')
        .insert({
          care_plan_id: planData.id,
          patient_id: params.patientId,
          doctor_id: params.doctorId,
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

      if (taskErr || !taskData) throw taskErr;

      // 3. Queue patient notification
      await supabase.from('notifications').insert({
        recipient_role: 'patient',
        recipient_user_id: params.patientId,
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

      // 4. Log audit event
      await supabase.from('audit_logs').insert({
        actor_id: params.doctorId,
        actor_name: 'Ordering Clinician',
        actor_role: 'doctor',
        entity_type: 'CarePlan',
        entity_id: planData.id,
        action: 'CARE_PLAN_CREATED',
        previous_state: 'None',
        new_state: 'Active',
        details: `Created care plan "${params.title}" with diagnostic task "${params.taskTitle}".`
      });

      this.notify();

      return {
        carePlan: {
          id: planData.id,
          patientId: planData.patient_id,
          patientName: 'Patient',
          doctorId: planData.doctor_id,
          doctorName: 'Doctor',
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
          patientName: 'Patient',
          doctorId: taskData.doctor_id,
          doctorName: 'Doctor',
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
      return null;
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
      const cleanFileName = `${Date.now()}_${fileData.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
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
  public async verifyReport(
    taskId: string,
    verifiedResults: TestResult[],
    notes: string,
    coordinatorName = 'Nida Ali (Care Coordinator)'
  ): Promise<CareTask | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data: task, error: tErr } = await supabase
        .from('care_tasks')
        .select('*, reports(*)')
        .eq('id', taskId)
        .single();

      if (tErr || !task) throw tErr;

      const reportId = task.reports?.[0]?.id;

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
        .eq('id', taskId)
        .select()
        .single();

      if (updErr || !updatedTask) throw updErr;

      // Notify doctor
      await supabase.from('notifications').insert({
        recipient_role: 'doctor',
        task_id: taskId,
        channel: 'in-app',
        title: 'Diagnostic Report Verified • Ready for Doctor Review',
        message: `Coordinator verified report for ${task.title}. Ready for physician evaluation.`,
        type: 'doctor_review_ready',
        preview_details: {
          testName: task.title,
          instructions: 'Human verification complete. Awaiting physician clinical evaluation.'
        }
      });

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_name: coordinatorName,
        actor_role: 'coordinator',
        entity_type: 'Report',
        entity_id: reportId || taskId,
        action: 'REPORT_VERIFIED',
        previous_state: 'In Progress',
        new_state: 'Verified',
        details: `Coordinator audit signed off. Dispatched to doctor for clinical loop closure. Notes: ${notes || 'Values matched'}`
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
      console.error('Error verifying report in Supabase:', err);
      return null;
    }
  }

  // 4. Coordinator Flags Report for Correction
  public async flagReportForCorrection(taskId: string, reason: string): Promise<CareTask | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data: task } = await supabase
        .from('care_tasks')
        .select('*, reports(*)')
        .eq('id', taskId)
        .single();

      if (task?.reports?.[0]?.id) {
        await supabase
          .from('reports')
          .update({
            verification_status: 'Flagged',
            verification_notes: `Flagged for re-upload: ${reason}`
          })
          .eq('id', task.reports[0].id);
      }

      const { data: updatedTask } = await supabase
        .from('care_tasks')
        .update({
          task_status: 'In Progress',
          assigned_role: 'patient',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (!updatedTask) return null;

      // Notify patient
      await supabase.from('notifications').insert({
        recipient_role: 'patient',
        recipient_user_id: task.patient_id,
        task_id: taskId,
        channel: 'in-app',
        title: 'Document Issue: Re-upload Requested',
        message: `The report submitted for ${task.title} could not be verified: "${reason}". Please upload a clearer copy.`,
        type: 'verification_needed'
      });

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_name: 'Coordinator',
        actor_role: 'coordinator',
        entity_type: 'Report',
        entity_id: taskId,
        action: 'REPORT_FLAGGED',
        previous_state: 'In Progress',
        new_state: 'In Progress (Flagged)',
        details: `Coordinator flagged document: ${reason}`
      });

      this.notify();
      return updatedTask as any;
    } catch (err) {
      console.error('Error flagging report in Supabase:', err);
      return null;
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
    if (!isSupabaseConfigured()) return null;

    try {
      const { data: task, error: tErr } = await supabase
        .from('care_tasks')
        .select('*, reports(*)')
        .eq('id', taskId)
        .single();

      if (tErr || !task) throw tErr;

      const reportId = task.reports?.[0]?.id || null;
      const doctorName = reviewData.doctorName || 'Dr. Arjun Mehta, MD';

      // Insert doctor clinical review
      const { data: reviewRecord, error: revErr } = await supabase
        .from('doctor_reviews')
        .insert({
          task_id: taskId,
          report_id: reportId,
          doctor_id: task.doctor_id,
          doctor_name: doctorName,
          review_notes: reviewData.reviewNotes,
          next_action_required: reviewData.nextAction,
          follow_up_date: reviewData.followUpDate || null,
          reviewed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (revErr || !reviewRecord) throw revErr;

      // Mark care task as Resolved (Loop Formally Closed!)
      const { data: updatedTask, error: taskUpdErr } = await supabase
        .from('care_tasks')
        .update({
          task_status: 'Resolved',
          assigned_role: 'doctor',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (taskUpdErr || !updatedTask) throw taskUpdErr;

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

        const { data: followUpTask } = await supabase
          .from('care_tasks')
          .insert({
            care_plan_id: task.care_plan_id,
            patient_id: task.patient_id,
            doctor_id: task.doctor_id,
            title: followUpTitle,
            task_type: followUpType,
            deadline: deadlineString,
            assigned_role: 'patient',
            task_status: 'Pending',
            instructions: `Physician instructions: ${reviewData.reviewNotes}`,
            fasting_required: false,
            partner_facility: task.partner_facility || 'MetroCare Clinic',
            facility_address: task.facility_address || '420 Health Science Blvd, Suite 200, Metro City'
          })
          .select()
          .single();

        if (followUpTask) {
          await supabase.from('audit_logs').insert({
            actor_id: task.doctor_id,
            actor_name: doctorName,
            actor_role: 'doctor',
            entity_type: 'CareTask',
            entity_id: followUpTask.id,
            action: 'FOLLOW_UP_CREATED',
            previous_state: 'None',
            new_state: 'Pending',
            details: `Created follow-up task "${followUpTitle}" linked to clinical review of ${task.title}. Due on ${deadlineString}.`
          });
        }
      } else {
        // If no further action needed, check if all tasks in CarePlan are now resolved
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
      }

      // Notify patient of doctor clinical sign-off
      await supabase.from('notifications').insert({
        recipient_role: 'patient',
        recipient_user_id: task.patient_id,
        task_id: taskId,
        channel: 'in-app',
        title: `Doctor Reviewed Your ${task.title}`,
        message: `${doctorName} evaluated your diagnostic findings: "${reviewData.reviewNotes.substring(0, 100)}..." Next step: ${reviewData.nextAction}.`,
        type: 'doctor_review_ready'
      });

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_id: task.doctor_id,
        actor_name: doctorName,
        actor_role: 'doctor',
        entity_type: 'Review',
        entity_id: reviewRecord.id,
        action: 'DOCTOR_REVIEW_COMPLETED',
        previous_state: 'Verified',
        new_state: 'Resolved',
        details: `Physician clinical sign-off recorded. Loop closed. Next action: ${reviewData.nextAction}. Notes: ${reviewData.reviewNotes}`
      });

      this.notify();
      return updatedTask as any;
    } catch (err) {
      console.error('Error completing doctor review in Supabase:', err);
      return null;
    }
  }

  // 6. Record Missed-Task Delay Reason
  public async recordDelayReason(taskId: string, reason: DelayReason, notes: string): Promise<CareTask | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data: updatedTask } = await supabase
        .from('care_tasks')
        .update({
          delay_reason: reason,
          delay_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (!updatedTask) return null;

      await supabase.from('audit_logs').insert({
        actor_name: 'Patient',
        actor_role: 'patient',
        entity_type: 'CareTask',
        entity_id: taskId,
        action: 'DELAY_REASON_LOGGED',
        previous_state: updatedTask.task_status,
        new_state: updatedTask.task_status,
        details: `Patient logged delay reason: ${reason}. Notes: ${notes}`
      });

      this.notify();
      return updatedTask as any;
    } catch (err) {
      console.error('Error recording delay reason:', err);
      return null;
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
}

export const supabaseCareLoopService = new SupabaseCareLoopService();
