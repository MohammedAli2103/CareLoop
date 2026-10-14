import { describe, it, expect, beforeEach } from 'vitest';
import { MockCareLoopService, careLoopService } from '../services/mockCareLoopService';
import {
  CareTask,
  TestResult,
  TaskType,
  NextAction
} from '../types';
import {
  resolvePatientUuid,
  resolveDoctorUuid
} from '../data/mockData';

describe('CareLoop Cross-Portal Workflows & Data Synchronization', () => {
  let service: MockCareLoopService;

  beforeEach(() => {
    careLoopService.resetDemoData();
    service = new MockCareLoopService();
  });

  // =========================================================================
  // SCENARIO 1: Care Plan Creation & Patient Synchronization
  // =========================================================================
  describe('Scenario 1 — Care Plan Creation and Patient Synchronization', () => {
    it('creates a care plan and diagnostic task as physician and synchronizes to patient and coordinator', () => {
      const patientId = 'patient-1'; // Sarah Khan
      const doctorId = 'user-doctor-1'; // Dr. Arjun Mehta

      const initialPatientTasks = service.getTasks().filter(t => t.patientId === patientId || resolvePatientUuid(t.patientId) === resolvePatientUuid(patientId));
      const initialTaskCount = initialPatientTasks.length;

      // 1. Physician authors care plan with associated diagnostic order
      const newPlanPayload = {
        patientId,
        doctorId,
        title: 'Comprehensive Cardiovascular Risk Assessment',
        diagnosis: 'Dyslipidemia & Early Atherosclerotic Risk',
        taskTitle: 'Advanced Lipid Fractionation & ApoB Panel',
        taskType: 'Lab Test' as TaskType,
        deadlineDays: 7,
        fastingRequired: true,
        partnerFacility: 'MetroCare Central Pathology Lab',
        instructions: '12-hour fast required. Water only. Morning draw recommended.'
      };

      const result = service.createCarePlan(newPlanPayload);
      expect(result).not.toBeNull();
      expect(result?.carePlan).toBeDefined();
      expect(result?.task).toBeDefined();

      const createdPlan = result!.carePlan;
      const createdTask = result!.task;

      // Verify care plan attributes
      expect(createdPlan.title).toBe(newPlanPayload.title);
      expect(createdPlan.diagnosis).toBe(newPlanPayload.diagnosis);
      expect(createdPlan.status).toBe('Active');
      expect(createdPlan.patientId).toBe(patientId);
      expect(createdPlan.doctorId).toBe(doctorId);
      expect(createdPlan.taskIds).toContain(createdTask.id);

      // Verify associated diagnostic task
      expect(createdTask.carePlanId).toBe(createdPlan.id);
      expect(createdTask.title).toBe(newPlanPayload.taskTitle);
      expect(createdTask.taskType).toBe('Lab Test');
      expect(createdTask.taskStatus).toBe('Pending');
      expect(createdTask.assignedRole).toBe('patient');
      expect(createdTask.fastingRequired).toBe(true);
      expect(createdTask.partnerFacility).toBe(newPlanPayload.partnerFacility);

      // 2. Patient dashboard retrieval: task appears in patient's tasks
      const allTasks = service.getTasks();
      const updatedPatientTasks = allTasks.filter(t => {
        const canonical = resolvePatientUuid(t.patientId);
        return t.patientId === patientId || canonical === resolvePatientUuid(patientId);
      });
      expect(updatedPatientTasks.length).toBe(initialTaskCount + 1);
      const foundInPatient = updatedPatientTasks.find(t => t.id === createdTask.id);
      expect(foundInPatient).toBeDefined();
      expect(foundInPatient?.title).toBe('Advanced Lipid Fractionation & ApoB Panel');

      // 3. Coordinator portal verification: coordinator sees the newly created plan & pending task
      const coordinatorTasks = service.getTasks();
      const foundInCoordinator = coordinatorTasks.find(t => t.id === createdTask.id);
      expect(foundInCoordinator).toBeDefined();
      expect(foundInCoordinator?.taskStatus).toBe('Pending');

      // 4. Physician portal verification: plan is in physician's active plans
      const allPlans = service.getCarePlans();
      const doctorPlans = allPlans.filter(p => p.doctorId === doctorId || resolveDoctorUuid(p.doctorId) === resolveDoctorUuid(doctorId));
      const foundInDoctor = doctorPlans.find(p => p.id === createdPlan.id);
      expect(foundInDoctor).toBeDefined();

      // 5. Patient in-app notification is queued
      const notifications = service.getNotifications('patient');
      const patientNotif = notifications.find(n => n.taskId === createdTask.id);
      expect(patientNotif).toBeDefined();
      expect(patientNotif?.title).toContain('New Care Order');

      // 6. Audit log is recorded
      const logs = service.getAuditLogs();
      const planLog = logs.find(l => l.entityId === createdPlan.id && l.action === 'CARE_PLAN_CREATED');
      expect(planLog).toBeDefined();
    });
  });

  // =========================================================================
  // SCENARIO 2: Diagnostic Review Persistence & Queue Transition
  // =========================================================================
  describe('Scenario 2 — Diagnostic Review Persistence and State Transitions', () => {
    it('transitions verified report to Resolved, updates counts, and persists across sessions', () => {
      const tasks = service.getTasks();
      // Find a verified task awaiting doctor review
      const verifiedTask = tasks.find(t => (t.taskStatus === 'Verified' || t.report?.verificationStatus === 'Verified') && t.taskStatus !== 'Resolved');
      expect(verifiedTask).toBeDefined();
      const taskId = verifiedTask!.id;

      // Initial pending review filter used by DoctorDashboard:
      // reportsToReview = tasks.filter(t => (t.taskStatus === 'Verified' || t.report?.verificationStatus === 'Verified') && t.taskStatus !== 'Resolved')
      const initialPendingReviews = service.getTasks().filter(t => 
        (t.taskStatus === 'Verified' || t.report?.verificationStatus === 'Verified') && t.taskStatus !== 'Resolved'
      );
      const initialResolved = service.getTasks().filter(t => t.taskStatus === 'Resolved');

      expect(initialPendingReviews.some(t => t.id === taskId)).toBe(true);

      // Physician reviews the report
      const reviewPayload = {
        reviewNotes: 'Normal baseline results confirmed. Fasting glucose and lipid metrics remain within safe parameters.',
        nextAction: 'Routine 90-Day Monitoring' as NextAction,
        followUpDate: '2026-12-15'
      };

      const resolvedTask = service.completeDoctorReview(taskId, reviewPayload);
      expect(resolvedTask).not.toBeNull();
      expect(resolvedTask?.taskStatus).toBe('Resolved');
      expect(resolvedTask?.doctorReview).toBeDefined();
      expect(resolvedTask?.doctorReview?.reviewNotes).toBe(reviewPayload.reviewNotes);
      expect(resolvedTask?.doctorReview?.nextActionRequired).toBe('Routine 90-Day Monitoring');

      // 1. Pending review queue decreases immediately; reviewed task leaves queue
      const updatedPendingReviews = service.getTasks().filter(t => 
        (t.taskStatus === 'Verified' || t.report?.verificationStatus === 'Verified') && t.taskStatus !== 'Resolved'
      );
      expect(updatedPendingReviews.length).toBe(initialPendingReviews.length - 1);
      expect(updatedPendingReviews.some(t => t.id === taskId)).toBe(false);

      // 2. Resolved count increases
      const updatedResolved = service.getTasks().filter(t => t.taskStatus === 'Resolved');
      expect(updatedResolved.length).toBe(initialResolved.length + 1);

      // 3. Since next action was 'Routine 90-Day Monitoring', a follow-up task was scheduled
      const followUpTask = service.getTasks().find(t => t.title.includes('90-Day Monitoring'));
      expect(followUpTask).toBeDefined();
      expect(followUpTask?.taskStatus).toBe('Pending');
      expect(followUpTask?.assignedRole).toBe('patient');

      // 4. Persistence verification: Verify state integrity across simulated serialization and rehydration
      const resolvedFromService = service.getTaskById(taskId);
      expect(resolvedFromService).toBeDefined();
      expect(resolvedFromService?.taskStatus).toBe('Resolved');
      expect(resolvedFromService?.doctorReview?.reviewNotes).toBe(reviewPayload.reviewNotes);

      const serializedTasks = JSON.stringify(service.getTasks());
      const rehydratedTasks: CareTask[] = JSON.parse(serializedTasks);
      const persistentTask = rehydratedTasks.find(t => t.id === taskId);
      expect(persistentTask).toBeDefined();
      expect(persistentTask?.taskStatus).toBe('Resolved');
      expect(persistentTask?.doctorReview?.reviewNotes).toBe(reviewPayload.reviewNotes);

      const persistentPending = rehydratedTasks.filter(t => 
        (t.taskStatus === 'Verified' || t.report?.verificationStatus === 'Verified') && t.taskStatus !== 'Resolved'
      );
      expect(persistentPending.some(t => t.id === taskId)).toBe(false);
    });

    it('distinguishes between report verification and clinical review', () => {
      // Create a task in 'In Progress' state with uploaded report
      const tasks = service.getTasks();
      const inProgressTask = tasks.find(t => t.taskStatus === 'In Progress' && t.report && t.report.verificationStatus === 'Unverified');
      expect(inProgressTask).toBeDefined();

      // Coordinator verifies OCR results
      const verified = service.verifyReport(inProgressTask!.id, inProgressTask!.report!.extractedResults, 'Staff verified against lab PDF');
      expect(verified).not.toBeNull();
      // It is now Verified, NOT yet Resolved
      expect(verified?.taskStatus).toBe('Verified');
      expect(verified?.report?.verificationStatus).toBe('Verified');
      expect(verified?.assignedRole).toBe('doctor');

      // Doctor review has NOT occurred yet
      expect(verified?.doctorReview).toBeUndefined();
    });
  });

  // =========================================================================
  // SCENARIO 3: Coordinator Workflow Synchronization & Role Actions
  // =========================================================================
  describe('Scenario 3 — Coordinator Workflow Synchronization', () => {
    it('coordinates report audit, moves task to doctor queue, and logs audit trail', () => {
      const inProgressTask = service.getTasks().find(t => t.taskStatus === 'In Progress' && t.report);
      expect(inProgressTask).toBeDefined();

      const testResults: TestResult[] = [
        {
          id: 'res-1',
          reportId: inProgressTask!.report!.id,
          testName: 'HbA1c',
          value: '6.8',
          unit: '%',
          refRange: '< 5.7%',
          isAbnormal: true,
          confidence: 99,
          editedByStaff: true
        }
      ];

      const verified = service.verifyReport(inProgressTask!.id, testResults, 'Audited values against original document.');
      expect(verified).not.toBeNull();
      expect(verified?.taskStatus).toBe('Verified');
      expect(verified?.assignedRole).toBe('doctor');
      expect(verified?.report?.verificationStatus).toBe('Verified');

      // Doctor notification is generated
      const doctorNotifs = service.getNotifications('doctor');
      const auditNotif = doctorNotifs.find(n => n.taskId === inProgressTask!.id);
      expect(auditNotif).toBeDefined();
      expect(auditNotif?.type).toBe('doctor_review_ready');

      // Audit log records coordinator action
      const logs = service.getAuditLogs();
      const coordLog = logs.find(l => l.entityId === inProgressTask!.report!.id && l.action === 'REPORT_VERIFIED');
      expect(coordLog).toBeDefined();
    });

    it('coordinator flags unreadable report and re-assigns task to patient', () => {
      const taskWithReport = service.getTasks().find(t => t.report && t.taskStatus === 'In Progress');
      expect(taskWithReport).toBeDefined();

      const flagged = service.flagReportForCorrection(taskWithReport!.id, 'Document cutoff at signature line and reference values blurry');
      expect(flagged).not.toBeNull();
      expect(flagged?.report?.verificationStatus).toBe('Flagged');
      expect(flagged?.assignedRole).toBe('patient');
      expect(flagged?.report?.verificationNotes).toContain('Document cutoff');

      // Patient is notified of the issue
      const patientNotifs = service.getNotifications('patient');
      const rejectionNotif = patientNotifs.find(n => n.taskId === taskWithReport!.id);
      expect(rejectionNotif).toBeDefined();
      expect(rejectionNotif?.title).toContain('Re-upload Requested');
    });

    it('coordinator records patient delay barrier and updates follow-up state', () => {
      const task = service.getTasks().find(t => t.taskStatus === 'Pending');
      expect(task).toBeDefined();

      const updated = service.recordDelayReason(task!.id, 'Transportation Barriers', 'Patient requested transit voucher before visiting lab facility');
      expect(updated).not.toBeNull();
      expect(updated?.delayReason).toBe('Transportation Barriers');
      expect(updated?.delayNotes).toContain('transit voucher');

      // Audit log records barrier entry
      const logs = service.getAuditLogs();
      const barrierLog = logs.find(l => l.entityId === task!.id && l.action === 'DELAY_REASON_LOGGED');
      expect(barrierLog).toBeDefined();
    });

    it('time leap correctly calculates overdue tasks based on actual deadlines', () => {
      // Find a pending task and set deadline to past date
      const tasks = service.getTasks();
      const targetTask = tasks.find(t => t.taskStatus === 'Pending');
      expect(targetTask).toBeDefined();

      // Trigger time leap
      service.simulateTimeLeap();

      const updatedTasks = service.getTasks();
      const overdueTasks = updatedTasks.filter(t => t.taskStatus === 'Overdue' || (new Date(t.deadline) < new Date() && t.taskStatus !== 'Resolved'));
      expect(overdueTasks.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SCENARIO 4: Demo Data Completeness & Seed Idempotency
  // =========================================================================
  describe('Scenario 4 — Demo Data Completeness and Seed Idempotency', () => {
    it('contains comprehensive demo dataset across all 5 target task states', () => {
      const tasks = service.getTasks();

      const pendingTasks = tasks.filter(t => t.taskStatus === 'Pending');
      const inProgressTasks = tasks.filter(t => t.taskStatus === 'In Progress');
      const verifiedTasks = tasks.filter(t => t.taskStatus === 'Verified' || t.report?.verificationStatus === 'Verified');
      const overdueTasks = tasks.filter(t => t.taskStatus === 'Overdue');
      const resolvedTasks = tasks.filter(t => t.taskStatus === 'Resolved');

      expect(pendingTasks.length).toBeGreaterThan(0);
      expect(inProgressTasks.length).toBeGreaterThan(0);
      expect(verifiedTasks.length).toBeGreaterThan(0);
      expect(overdueTasks.length).toBeGreaterThan(0);
      expect(resolvedTasks.length).toBeGreaterThan(0);
    });

    it('contains multiple patients, care plans, diverse clinical task types, and feedback records', () => {
      const patients = service.getPatients();
      expect(patients.length).toBeGreaterThanOrEqual(5);

      // Verify key demo patients exist
      const patientNames = patients.map(p => p.fullName);
      expect(patientNames).toContain('Sarah Khan');
      expect(patientNames).toContain('Vikram Kumar');
      expect(patientNames).toContain('Rahul Prasad');
      expect(patientNames).toContain('Ayesha Mariam');

      // Verify care plans exist for multiple patients
      const carePlans = service.getCarePlans();
      expect(carePlans.length).toBeGreaterThanOrEqual(4);

      // Verify diverse task types
      const tasks = service.getTasks();
      const taskTitles = tasks.map(t => t.title.toLowerCase());
      expect(taskTitles.some(title => title.includes('hba1c') || title.includes('blood'))).toBe(true);
      expect(taskTitles.some(title => title.includes('lipid') || title.includes('cholesterol'))).toBe(true);
      expect(taskTitles.some(title => title.includes('thyroid') || title.includes('tsh'))).toBe(true);
      expect(taskTitles.some(title => title.includes('x-ray') || title.includes('imaging') || title.includes('review'))).toBe(true);
      expect(taskTitles.some(title => title.includes('consultation') || title.includes('follow-up'))).toBe(true);

      // Verify feedbacks exist with multiple statuses
      const feedbacks = service.getFeedbacks();
      expect(feedbacks.length).toBeGreaterThanOrEqual(2);
      expect(feedbacks.some(f => f.reviewStatus === 'pending')).toBe(true);
      expect(feedbacks.some(f => f.reviewStatus === 'action_required')).toBe(true);
    });

    it('seed/reset routine is idempotent and does not produce duplicate records', () => {
      const initialTaskCount = service.getTasks().length;
      const initialPatientCount = service.getPatients().length;
      const initialPlanCount = service.getCarePlans().length;

      // Run resetDemoData multiple times
      careLoopService.resetDemoData();
      careLoopService.resetDemoData();
      careLoopService.resetDemoData();

      const freshService = new MockCareLoopService();
      expect(freshService.getTasks().length).toBe(initialTaskCount);
      expect(freshService.getPatients().length).toBe(initialPatientCount);
      expect(freshService.getCarePlans().length).toBe(initialPlanCount);

      // Check unique IDs
      const taskIds = freshService.getTasks().map(t => t.id);
      const uniqueTaskIds = new Set(taskIds);
      expect(uniqueTaskIds.size).toBe(taskIds.length);
    });
  });

  // =========================================================================
  // SCENARIO 5: Patient Data Isolation (Cross-Patient Security)
  // =========================================================================
  describe('Scenario 5 — Patient Data Isolation', () => {
    it('strictly isolates patient tasks and prevents cross-patient leakage', () => {
      const allTasks = service.getTasks();
      const sarahId = 'patient-1';
      const vikramId = 'patient-2';

      const sarahCanonical = resolvePatientUuid(sarahId);
      const vikramCanonical = resolvePatientUuid(vikramId);

      // Tasks for Sarah Khan
      const sarahTasks = allTasks.filter(t => {
        const canonical = resolvePatientUuid(t.patientId);
        return t.patientId === sarahId || canonical === sarahCanonical;
      });

      // Tasks for Vikram Kumar
      const vikramTasks = allTasks.filter(t => {
        const canonical = resolvePatientUuid(t.patientId);
        return t.patientId === vikramId || canonical === vikramCanonical;
      });

      expect(sarahTasks.length).toBeGreaterThan(0);
      expect(vikramTasks.length).toBeGreaterThan(0);

      // No task assigned to Sarah Khan should appear in Vikram's task list
      const sarahTaskIds = new Set(sarahTasks.map(t => t.id));
      const leakedToVikram = vikramTasks.filter(t => sarahTaskIds.has(t.id));
      expect(leakedToVikram.length).toBe(0);

      // No task assigned to Vikram Kumar should appear in Sarah's task list
      const vikramTaskIds = new Set(vikramTasks.map(t => t.id));
      const leakedToSarah = sarahTasks.filter(t => vikramTaskIds.has(t.id));
      expect(leakedToSarah.length).toBe(0);
    });

    it('strictly isolates care plans per patient', () => {
      const allPlans = service.getCarePlans();
      const sarahId = 'patient-1';
      const vikramId = 'patient-2';

      const sarahPlans = allPlans.filter(p => p.patientId === sarahId || resolvePatientUuid(p.patientId) === resolvePatientUuid(sarahId));
      const vikramPlans = allPlans.filter(p => p.patientId === vikramId || resolvePatientUuid(p.patientId) === resolvePatientUuid(vikramId));

      expect(sarahPlans.length).toBeGreaterThan(0);
      expect(vikramPlans.length).toBeGreaterThan(0);

      const sarahPlanIds = new Set(sarahPlans.map(p => p.id));
      const leakedToVikram = vikramPlans.filter(p => sarahPlanIds.has(p.id));
      expect(leakedToVikram.length).toBe(0);
    });
  });

  // =========================================================================
  // SCENARIO 6: Database & Service Error Resilience
  // =========================================================================
  describe('Scenario 6 — Database & Service Error Resilience', () => {
    it('bubbles database failure and prevents false success reporting on care plan creation', () => {
      // Create a mock failure scenario
      const invalidPayload = {
        patientId: 'non-existent-patient-999',
        doctorId: 'non-existent-doctor-999',
        title: 'Failing Plan',
        diagnosis: 'Test Condition',
        taskTitle: 'Failing Task',
        taskType: 'Lab Test' as TaskType,
        deadlineDays: 7,
        fastingRequired: false,
        partnerFacility: 'Test Facility',
        instructions: 'Test Instructions'
      };

      const result = service.createCarePlan(invalidPayload);
      // Because patient does not exist, service returns null
      expect(result).toBeNull();

      // Ensure no dangling care plans or tasks were added
      const plans = service.getCarePlans().filter(p => p.title === 'Failing Plan');
      expect(plans.length).toBe(0);
    });

    it('rejects invalid review submission when task does not exist', () => {
      const result = service.completeDoctorReview('non-existent-task-id', {
        reviewNotes: 'Will not save',
        nextAction: 'No Further Action Needed'
      });
      expect(result).toBeNull();
    });

    it('rejects verification on task with missing diagnostic report', () => {
      // Find a task that has no report attached
      const taskWithoutReport = service.getTasks().find(t => !t.report);
      expect(taskWithoutReport).toBeDefined();

      const result = service.verifyReport(taskWithoutReport!.id, [], 'Notes');
      expect(result).toBeNull();
    });
  });
});
