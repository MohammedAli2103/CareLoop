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
  TaskType
} from '../types';
import { 
  INITIAL_CARE_PLANS, 
  INITIAL_PATIENTS, 
  INITIAL_TASKS, 
  INITIAL_USERS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS 
} from '../data/mockData';

class MockCareLoopService {
  private users: User[] = [...INITIAL_USERS];
  private patients: Patient[] = [...INITIAL_PATIENTS];
  private carePlans: CarePlan[] = [...INITIAL_CARE_PLANS];
  private tasks: CareTask[] = [...INITIAL_TASKS];
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem('careloop_v2_tasks', JSON.stringify(this.tasks));
      localStorage.setItem('careloop_v2_careplans', JSON.stringify(this.carePlans));
      localStorage.setItem('careloop_v2_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('careloop_v2_auditlogs', JSON.stringify(this.auditLogs));
      localStorage.setItem('careloop_v2_patients', JSON.stringify(this.patients));
    } catch {
      // ignore storage error in case of restricted sandbox
    }
    this.notify();
  }

  private loadFromStorage() {
    try {
      const storedTasks = localStorage.getItem('careloop_v2_tasks');
      const storedPlans = localStorage.getItem('careloop_v2_careplans');
      const storedNotifs = localStorage.getItem('careloop_v2_notifications');
      const storedLogs = localStorage.getItem('careloop_v2_auditlogs');
      const storedPatients = localStorage.getItem('careloop_v2_patients');

      if (storedTasks) this.tasks = JSON.parse(storedTasks);
      if (storedPlans) this.carePlans = JSON.parse(storedPlans);
      if (storedNotifs) this.notifications = JSON.parse(storedNotifs);
      if (storedLogs) this.auditLogs = JSON.parse(storedLogs);
      if (storedPatients) this.patients = JSON.parse(storedPatients);
    } catch {
      // fallback to in-memory initial values
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- GETTERS ---
  public getUsers(): User[] {
    return this.users;
  }

  public getPatients(): Patient[] {
    return this.patients;
  }

  public getPatientById(id: string): Patient | undefined {
    return this.patients.find(p => p.id === id);
  }

  public getCarePlans(): CarePlan[] {
    return this.carePlans;
  }

  public getCarePlanById(id: string): CarePlan | undefined {
    return this.carePlans.find(cp => cp.id === id);
  }

  public getTasks(): CareTask[] {
    return this.tasks;
  }

  public getTaskById(id: string): CareTask | undefined {
    return this.tasks.find(t => t.id === id);
  }

  public getTasksForRole(role: UserRole, patientId?: string): CareTask[] {
    if (role === 'patient') {
      const activePatientId = patientId || 'patient-1';
      return this.tasks.filter(t => t.patientId === activePatientId);
    }
    return this.tasks;
  }

  public getNotifications(role?: UserRole): NotificationItem[] {
    if (!role) return this.notifications;
    return this.notifications.filter(n => n.recipientRole === role);
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- ACTIONS ---

  // 1. Create a Care Plan (Doctor)
  public createCarePlan(params: {
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
  }): { carePlan: CarePlan; task: CareTask } {
    const patient = this.patients.find(p => p.id === params.patientId) || this.patients[0];
    const doctor = this.users.find(u => u.id === params.doctorId) || this.users[1];

    const planId = `plan-${Date.now()}`;
    const taskId = `task-${Date.now()}`;

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + params.deadlineDays);
    const deadlineString = deadlineDate.toISOString().split('T')[0];

    const newTask: CareTask = {
      id: taskId,
      carePlanId: planId,
      patientId: patient.id,
      patientName: patient.fullName,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      title: params.taskTitle,
      taskType: params.taskType,
      deadline: deadlineString,
      assignedRole: 'patient',
      taskStatus: 'Pending',
      instructions: params.instructions,
      fastingRequired: params.fastingRequired,
      partnerFacility: params.partnerFacility,
      facilityAddress: '420 Lexington Health Blvd, Suite 200, Metro City',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEscalated: false
    };

    const newPlan: CarePlan = {
      id: planId,
      patientId: patient.id,
      patientName: patient.fullName,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      title: params.title,
      diagnosis: params.diagnosis,
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: deadlineString,
      clinicalNotes: `Initial order authored by ${doctor.fullName}. SLA turnaround: ${params.deadlineDays} days.`,
      taskIds: [taskId]
    };

    this.carePlans.unshift(newPlan);
    this.tasks.unshift(newTask);

    // Queue in-app notification for patient
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      taskId: newTask.id,
      recipientRole: 'patient',
      recipientName: patient.fullName,
      channel: 'in-app',
      title: `New Care Order: ${newTask.title}`,
      message: `${doctor.fullName} ordered a new ${newTask.taskType}. Due in ${params.deadlineDays} days.`,
      type: 'deadline_reminder',
      isRead: false,
      sentAt: new Date().toISOString(),
      actionLink: newTask.id,
      previewDetails: {
        patientName: patient.fullName,
        testName: newTask.title,
        deadline: deadlineString,
        instructions: params.instructions
      }
    });

    // Append audit log
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: doctor.id,
      actorName: doctor.fullName,
      actorRole: 'doctor',
      entityType: 'CarePlan',
      entityId: newPlan.id,
      action: 'CARE_PLAN_CREATED',
      previousState: 'None',
      newState: 'Active',
      timestamp: new Date().toISOString(),
      details: `Created care plan "${params.title}" with diagnostic task "${params.taskTitle}".`
    });

    this.saveToStorage();
    return { carePlan: newPlan, task: newTask };
  }

  // 2. Patient Uploads Report (moves to In Progress / Awaiting Staff Verification)
  public uploadReport(taskId: string, fileData: {
    fileName: string;
    fileSize: string;
    fileType: string;
    mockResults?: TestResult[];
  }): CareTask | null {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.tasks[taskIndex];
    const previousStatus = task.taskStatus;
    const reportId = `report-${Date.now()}`;

    // Synthetic OCR values tailored to the test type
    let defaultResults: TestResult[] = [];
    if (task.title.toLowerCase().includes('hba1c')) {
      defaultResults = [
        {
          id: `res-${Date.now()}-1`,
          reportId,
          testName: 'HbA1c (Hemoglobin A1c)',
          value: '7.4',
          unit: '%',
          refRange: '< 5.7%',
          isAbnormal: true,
          confidence: 96,
          editedByStaff: false
        },
        {
          id: `res-${Date.now()}-2`,
          reportId,
          testName: 'Estimated Average Glucose (eAG)',
          value: '166',
          unit: 'mg/dL',
          refRange: '< 117 mg/dL',
          isAbnormal: true,
          confidence: 98,
          editedByStaff: false
        }
      ];
    } else if (task.title.toLowerCase().includes('lipid') || task.title.toLowerCase().includes('cholesterol')) {
      defaultResults = [
        {
          id: `res-${Date.now()}-1`,
          reportId,
          testName: 'Total Cholesterol',
          value: '224',
          unit: 'mg/dL',
          refRange: '< 200 mg/dL',
          isAbnormal: true,
          confidence: 97,
          editedByStaff: false
        },
        {
          id: `res-${Date.now()}-2`,
          reportId,
          testName: 'Triglycerides',
          value: '185',
          unit: 'mg/dL',
          refRange: '< 150 mg/dL',
          isAbnormal: true,
          confidence: 94,
          editedByStaff: false
        },
        {
          id: `res-${Date.now()}-3`,
          reportId,
          testName: 'HDL Cholesterol',
          value: '42',
          unit: 'mg/dL',
          refRange: '> 40 mg/dL',
          isAbnormal: false,
          confidence: 99,
          editedByStaff: false
        },
        {
          id: `res-${Date.now()}-4`,
          reportId,
          testName: 'LDL Cholesterol',
          value: '145',
          unit: 'mg/dL',
          refRange: '< 100 mg/dL',
          isAbnormal: true,
          confidence: 95,
          editedByStaff: false
        }
      ];
    } else {
      defaultResults = [
        {
          id: `res-${Date.now()}-1`,
          reportId,
          testName: 'Primary Diagnostic Marker',
          value: '1.18',
          unit: 'mg/dL',
          refRange: '0.6 - 1.2 mg/dL',
          isAbnormal: false,
          confidence: 97,
          editedByStaff: false
        }
      ];
    }

    const updatedTask: CareTask = {
      ...task,
      taskStatus: 'In Progress', // Strict Principle A: Patient upload = In Progress (Awaiting Report Verification)
      assignedRole: 'coordinator',
      patientCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      report: {
        id: reportId,
        taskId: task.id,
        fileName: fileData.fileName,
        fileType: fileData.fileType || 'application/pdf',
        fileSize: fileData.fileSize || '1.18 MB',
        fileUrl: `/mock/reports/${fileData.fileName}`,
        uploadedAt: new Date().toISOString(),
        uploadedByRole: 'patient',
        verificationStatus: 'Unverified',
        extractedResults: fileData.mockResults || defaultResults
      }
    };

    this.tasks[taskIndex] = updatedTask;

    // Notify coordinator
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      taskId: task.id,
      recipientRole: 'coordinator',
      recipientName: 'Nida Ali',
      channel: 'in-app',
      title: 'Lab Report Uploaded • Staff Audit Required',
      message: `${task.patientName} uploaded ${fileData.fileName}. Please verify OCR fields side-by-side with source file.`,
      type: 'verification_needed',
      isRead: false,
      sentAt: new Date().toISOString(),
      actionLink: task.id,
      previewDetails: {
        patientName: task.patientName,
        testName: task.title,
        instructions: 'PyMuPDF draft extraction ready. Side-by-side audit required.'
      }
    });

    // Audit log
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: 'user-patient-1',
      actorName: task.patientName,
      actorRole: 'patient',
      entityType: 'Report',
      entityId: reportId,
      action: 'REPORT_UPLOADED',
      previousState: previousStatus,
      newState: 'In Progress',
      timestamp: new Date().toISOString(),
      details: `File "${fileData.fileName}" uploaded. OCR pipeline extracted draft values. Transferred to Coordinator for audit.`
    });

    this.saveToStorage();
    return updatedTask;
  }

  // 3. Coordinator Verifies Report (Side-by-side audit completed -> VERIFIED)
  public verifyReport(taskId: string, verifiedResults: TestResult[], notes: string): CareTask | null {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.tasks[taskIndex];
    if (!task.report) return null;

    const previousStatus = task.taskStatus;

    const updatedTask: CareTask = {
      ...task,
      taskStatus: 'Verified',
      assignedRole: 'doctor', // Hand off to ordering doctor for clinical review
      updatedAt: new Date().toISOString(),
      isEscalated: false, // verification resolves coordinator safety gap
      report: {
        ...task.report,
        verificationStatus: 'Verified',
        verifiedBy: 'Nida Ali (Care Coordinator)',
        verifiedAt: new Date().toISOString(),
        verificationNotes: notes || 'Verified side-by-side against original diagnostic laboratory report.',
        extractedResults: verifiedResults
      }
    };

    this.tasks[taskIndex] = updatedTask;

    // Notify doctor
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      taskId: task.id,
      recipientRole: 'doctor',
      recipientName: task.doctorName,
      channel: 'in-app',
      title: 'Lab Report Verified • Ready for Doctor Review',
      message: `Staff coordinator verified ${task.patientName}'s ${task.title}. Ready for physician evaluation and loop closure.`,
      type: 'doctor_review_ready',
      isRead: false,
      sentAt: new Date().toISOString(),
      actionLink: task.id,
      previewDetails: {
        patientName: task.patientName,
        testName: task.title,
        instructions: 'Source verification signed off by staff. Requires physician review.'
      }
    });

    // Audit Log
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: 'user-coord-1',
      actorName: 'Nida Ali',
      actorRole: 'coordinator',
      entityType: 'Report',
      entityId: task.report.id,
      action: 'REPORT_VERIFIED',
      previousState: previousStatus,
      newState: 'Verified',
      timestamp: new Date().toISOString(),
      details: `Human-in-the-loop verification committed. Dispatched to ${task.doctorName}. Notes: ${notes || 'Values matched'}`
    });

    this.saveToStorage();
    return updatedTask;
  }

  // 4. Coordinator Flags Report for Correction
  public flagReportForCorrection(taskId: string, reason: string): CareTask | null {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.tasks[taskIndex];
    if (!task.report) return null;

    const updatedTask: CareTask = {
      ...task,
      taskStatus: 'In Progress',
      assignedRole: 'patient',
      updatedAt: new Date().toISOString(),
      report: {
        ...task.report,
        verificationStatus: 'Flagged',
        verificationNotes: `Flagged for re-upload: ${reason}`
      }
    };

    this.tasks[taskIndex] = updatedTask;

    // Notify Patient
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      taskId: task.id,
      recipientRole: 'patient',
      recipientName: task.patientName,
      channel: 'in-app',
      title: 'Document Issue: Re-upload Requested',
      message: `The report submitted for ${task.title} could not be verified: "${reason}". Please upload a clearer copy.`,
      type: 'verification_needed',
      isRead: false,
      sentAt: new Date().toISOString(),
      actionLink: task.id
    });

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: 'user-coord-1',
      actorName: 'Nida Ali',
      actorRole: 'coordinator',
      entityType: 'Report',
      entityId: task.report.id,
      action: 'REPORT_FLAGGED',
      previousState: 'In Progress',
      newState: 'In Progress (Flagged)',
      timestamp: new Date().toISOString(),
      details: `Coordinator flagged document: ${reason}`
    });

    this.saveToStorage();
    return updatedTask;
  }

  // 5. Doctor Review & Loop Close (-> RESOLVED)
  public completeDoctorReview(taskId: string, reviewData: {
    reviewNotes: string;
    nextAction: NextAction;
    followUpDate?: string;
  }): CareTask | null {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.tasks[taskIndex];
    const previousStatus = task.taskStatus;
    const reviewId = `rev-${Date.now()}`;

    const updatedTask: CareTask = {
      ...task,
      taskStatus: 'Resolved', // Loop formally closed!
      assignedRole: 'doctor',
      updatedAt: new Date().toISOString(),
      doctorReview: {
        id: reviewId,
        reportId: task.report?.id || 'report-direct',
        taskId: task.id,
        doctorId: task.doctorId,
        doctorName: task.doctorName,
        reviewNotes: reviewData.reviewNotes,
        nextActionRequired: reviewData.nextAction,
        reviewedAt: new Date().toISOString(),
        followUpDate: reviewData.followUpDate
      }
    };

    this.tasks[taskIndex] = updatedTask;

    // Check if follow-up task is required (Bug D & E)
    if (reviewData.nextAction && reviewData.nextAction !== 'No Further Action Needed') {
      const followUpTaskId = `task-fu-${Date.now()}`;
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
        followUpType = task.taskType;
        defaultDays = 90;
      }

      let deadlineString = reviewData.followUpDate;
      if (!deadlineString) {
        const d = new Date();
        d.setDate(d.getDate() + defaultDays);
        deadlineString = d.toISOString().split('T')[0];
      }

      const followUpTask: CareTask = {
        id: followUpTaskId,
        carePlanId: task.carePlanId,
        patientId: task.patientId,
        patientName: task.patientName,
        doctorId: task.doctorId,
        doctorName: task.doctorName,
        title: followUpTitle,
        taskType: followUpType,
        deadline: deadlineString,
        assignedRole: 'patient',
        taskStatus: 'Pending',
        instructions: `Physician instructions: ${reviewData.reviewNotes}`,
        fastingRequired: false,
        partnerFacility: task.partnerFacility || 'MetroCare Clinic',
        facilityAddress: task.facilityAddress || '420 Health Science Blvd, Suite 200, Metro City',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEscalated: false
      };

      this.tasks.unshift(followUpTask);

      // Link to care plan taskIds
      const plan = this.carePlans.find(cp => cp.id === task.carePlanId);
      if (plan) {
        if (!plan.taskIds.includes(followUpTaskId)) {
          plan.taskIds.push(followUpTaskId);
        }
        plan.status = 'Active';
      }

      // Audit log for follow up creation
      this.auditLogs.unshift({
        id: `log-${Date.now()}-fu`,
        actorId: task.doctorId,
        actorName: task.doctorName,
        actorRole: 'doctor',
        entityType: 'CareTask',
        entityId: followUpTaskId,
        action: 'FOLLOW_UP_CREATED',
        previousState: 'None',
        newState: 'Pending',
        timestamp: new Date().toISOString(),
        details: `Created follow-up task "${followUpTitle}" linked to review of ${task.title}. Due on ${deadlineString}.`
      });
    } else {
      // If no further action needed, check if all tasks in CarePlan are now resolved
      const planIndex = this.carePlans.findIndex(cp => cp.id === task.carePlanId);
      if (planIndex !== -1) {
        const planTasks = this.tasks.filter(t => t.carePlanId === task.carePlanId);
        const allResolved = planTasks.every(t => t.taskStatus === 'Resolved');
        if (allResolved) {
          this.carePlans[planIndex] = {
            ...this.carePlans[planIndex],
            status: 'Completed' // Administrative completion marker (Principle B)
          };
        }
      }
    }

    // Notify Patient of completion and follow-up guidance
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      taskId: task.id,
      recipientRole: 'patient',
      recipientName: task.patientName,
      channel: 'in-app',
      title: `Doctor Reviewed Your ${task.title}`,
      message: `${task.doctorName} evaluated your diagnostic findings: "${reviewData.reviewNotes.substring(0, 100)}..." Next step: ${reviewData.nextAction}.`,
      type: 'doctor_review_ready',
      isRead: false,
      sentAt: new Date().toISOString(),
      actionLink: task.id,
      previewDetails: {
        patientName: task.patientName,
        testName: task.title,
        instructions: `Next step: ${reviewData.nextAction}. Check task detail for clinical notes.`
      }
    });

    // Audit Log
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: task.doctorId,
      actorName: task.doctorName,
      actorRole: 'doctor',
      entityType: 'Review',
      entityId: reviewId,
      action: 'DOCTOR_REVIEW_COMPLETED',
      previousState: previousStatus,
      newState: 'Resolved',
      timestamp: new Date().toISOString(),
      details: `Physician recorded clinical sign-off. Loop closed. Next action: ${reviewData.nextAction}. Notes: ${reviewData.reviewNotes}`
    });

    this.saveToStorage();
    return updatedTask;
  }

  // 6. Record Missed-Task Reason (Value-add feature from Page 6 & 7)
  public recordDelayReason(taskId: string, reason: DelayReason, notes: string): CareTask | null {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const updatedTask: CareTask = {
      ...this.tasks[taskIndex],
      delayReason: reason,
      delayNotes: notes,
      updatedAt: new Date().toISOString()
    };

    this.tasks[taskIndex] = updatedTask;

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: 'user-patient-1',
      actorName: updatedTask.patientName,
      actorRole: 'patient',
      entityType: 'CareTask',
      entityId: taskId,
      action: 'DELAY_REASON_LOGGED',
      previousState: updatedTask.taskStatus,
      newState: updatedTask.taskStatus,
      timestamp: new Date().toISOString(),
      details: `Patient logged delay reason: ${reason}. Notes: ${notes}`
    });

    this.saveToStorage();
    return updatedTask;
  }

  // 7. Escalation Trigger / Simulate Time Leap (+48h for Hackathon Judges)
  public simulateTimeLeap() {
    // Find task-sk-1 (Sarah Khan's pending HbA1c) or task-1 and force it to OVERDUE with escalation
    const taskIndex = this.tasks.findIndex(t => t.id === 'task-sk-1' || t.id === 'task-1' || (t.taskStatus === 'Pending' && t.assignedRole === 'patient'));
    if (taskIndex !== -1) {
      const task = this.tasks[taskIndex];
      const updatedTask: CareTask = {
        ...task,
        taskStatus: 'Overdue',
        assignedRole: 'coordinator',
        isEscalated: true,
        escalatedTo: 'Nida Ali (Care Coordinator)',
        escalationReason: 'Simulated +48h SLA elapsed without attendance log or uploaded report.',
        escalatedAt: new Date().toISOString(),
        deadline: '2026-10-12', // Past
        updatedAt: new Date().toISOString()
      };
      this.tasks[taskIndex] = updatedTask;

      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        taskId: task.id,
        recipientRole: 'coordinator',
        recipientName: 'Nida Ali',
        channel: 'in-app',
        title: 'RADAR ALARM: Task Overdue Escalation',
        message: `${task.patientName}'s ${task.title} has elapsed past deadline. Auto-escalated to safety net radar.`,
        type: 'escalation',
        isRead: false,
        sentAt: new Date().toISOString(),
        actionLink: task.id
      });

      this.auditLogs.unshift({
        id: `log-${Date.now()}`,
        actorId: 'careloop-engine',
        actorName: 'CareLoop Gap Router',
        actorRole: 'coordinator',
        entityType: 'CareTask',
        entityId: task.id,
        action: 'TASK_AUTO_ESCALATED',
        previousState: 'Pending',
        newState: 'Overdue',
        timestamp: new Date().toISOString(),
        details: 'Time leap triggered: SLA threshold breached. Overdue alarm dispatched to Coordinator Radar.'
      });

      this.saveToStorage();
    }
  }

  // 8. Reassign Escalated Task (Coordinator Radar Action)
  public reassignEscalatedTask(taskId: string, targetRole: UserRole, notes: string) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.tasks[taskIndex];
    const updatedTask: CareTask = {
      ...task,
      assignedRole: targetRole,
      escalationReason: notes || task.escalationReason,
      updatedAt: new Date().toISOString()
    };
    this.tasks[taskIndex] = updatedTask;

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: 'user-coord-1',
      actorName: 'Nida Ali',
      actorRole: 'coordinator',
      entityType: 'CareTask',
      entityId: taskId,
      action: 'TASK_REASSIGNED',
      previousState: task.taskStatus,
      newState: task.taskStatus,
      timestamp: new Date().toISOString(),
      details: `Coordinator reassigned task ownership to ${targetRole}. Note: ${notes}`
    });

    this.saveToStorage();
    return updatedTask;
  }

  // 9. Coordinator Sends Reminder to Doctor
  public sendReminderToDoctor(taskId: string): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return false;

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      taskId: task.id,
      recipientRole: 'doctor',
      recipientName: task.doctorName,
      channel: 'in-app',
      title: `Physician Review Reminder: ${task.title}`,
      message: `Coordinator Nida Ali sent a reminder: ${task.patientName}'s ${task.title} report has been verified and is awaiting your clinical evaluation.`,
      type: 'doctor_review_ready',
      isRead: false,
      sentAt: new Date().toISOString(),
      actionLink: task.id,
      previewDetails: {
        patientName: task.patientName,
        testName: task.title,
        instructions: 'Report verified. Please review and close loop.'
      }
    });

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: 'user-coord-1',
      actorName: 'Nida Ali',
      actorRole: 'coordinator',
      entityType: 'CareTask',
      entityId: task.id,
      action: 'DOCTOR_REMINDER_SENT',
      previousState: task.taskStatus,
      newState: task.taskStatus,
      timestamp: new Date().toISOString(),
      details: `Coordinator sent review reminder to ${task.doctorName} for patient ${task.patientName}.`
    });

    this.saveToStorage();
    return true;
  }

  // 10. Coordinator Sends Safety-Net Alert to Patient
  public sendReminderToPatient(taskId: string): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return false;

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      taskId: task.id,
      recipientRole: 'patient',
      recipientName: task.patientName,
      channel: 'in-app',
      title: `Overdue Task Alert: ${task.title}`,
      message: `Your ${task.title} is past due date. Please upload your report or reach out to clinic coordinator Nida Ali for assistance.`,
      type: 'deadline_reminder',
      isRead: false,
      sentAt: new Date().toISOString(),
      actionLink: task.id,
      previewDetails: {
        patientName: task.patientName,
        testName: task.title,
        instructions: task.instructions
      }
    });

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: 'user-coord-1',
      actorName: 'Nida Ali',
      actorRole: 'coordinator',
      entityType: 'CareTask',
      entityId: task.id,
      action: 'PATIENT_ALERT_SENT',
      previousState: task.taskStatus,
      newState: task.taskStatus,
      timestamp: new Date().toISOString(),
      details: `Coordinator dispatched patient safety alert to ${task.patientName} for overdue ${task.title}.`
    });

    this.saveToStorage();
    return true;
  }

  // 11. Reset Demo Data
  public resetDemoData() {
    this.users = [...INITIAL_USERS];
    this.patients = [...INITIAL_PATIENTS];
    this.carePlans = [...INITIAL_CARE_PLANS];
    this.tasks = [...INITIAL_TASKS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    try {
      localStorage.removeItem('careloop_tasks');
      localStorage.removeItem('careloop_careplans');
      localStorage.removeItem('careloop_notifications');
      localStorage.removeItem('careloop_auditlogs');
      localStorage.removeItem('careloop_v2_tasks');
      localStorage.removeItem('careloop_v2_careplans');
      localStorage.removeItem('careloop_v2_notifications');
      localStorage.removeItem('careloop_v2_auditlogs');
      localStorage.removeItem('careloop_v2_patients');
    } catch {
      // ignore
    }
    this.notify();
  }

  public markNotificationRead(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications[index].isRead = true;
      this.saveToStorage();
    }
  }

  public markAllNotificationsRead(role?: UserRole) {
    this.notifications = this.notifications.map(n => {
      if (!role || n.recipientRole === role) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.saveToStorage();
  }
}

export const careLoopService = new MockCareLoopService();
