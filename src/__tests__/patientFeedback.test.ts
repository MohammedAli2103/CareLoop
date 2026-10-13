import { describe, it, expect, beforeEach } from 'vitest';
import { MockCareLoopService } from '../services/mockCareLoopService';
import { SubmitFeedbackPayload, ReviewFeedbackPayload } from '../types';

describe('Patient Feedback and Closed-Loop Care System', () => {
  let service: MockCareLoopService;

  beforeEach(() => {
    service = new MockCareLoopService();
  });

  describe('1. Sample Feedback Submission (User Specification)', () => {
    it('successfully submits and processes the exact sample feedback', () => {
      // Prompt Requirement 3:
      // - Improvement: somewhat_better
      // - Adherence: partially
      // - Barrier: none
      // - Experience rating: 4
      // - Additional comments: empty
      const samplePayload: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443', // Completed care plan for Sarah Khan
        patientId: 'patient-1',
        improvementStatus: 'somewhat_better',
        adherenceStatus: 'partially',
        barrierType: 'none',
        experienceRating: 4,
        comments: '',
        worseningReported: false,
        safetyAcknowledged: false
      };

      const result = service.submitPatientFeedback(samplePayload);

      expect(result).toBeDefined();
      expect(result.patientId).toBe('patient-1');
      expect(result.carePlanId).toBe('44444444-4444-4444-a444-444444444443');
      expect(result.improvementStatus).toBe('somewhat_better');
      expect(result.adherenceStatus).toBe('partially');
      expect(result.barrierType).toBe('none');
      expect(result.experienceRating).toBe(4);
      expect(result.comments).toBeUndefined();
      expect(result.worseningReported).toBe(false);
      expect(result.reviewStatus).toBe('pending');

      // Verify it appears in patient's feedback query
      const fetched = service.getFeedbackByCarePlanId('44444444-4444-4444-a444-444444444443');
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(result.id);

      // Verify doctor notification was created
      const notifications = service.getNotifications();
      const doctorNotif = notifications.find(
        n => n.recipientRole === 'doctor' && n.title.includes('New Care Plan Feedback')
      );
      expect(doctorNotif).toBeDefined();
      expect(doctorNotif?.type).toBe('general');

      // Verify audit log was recorded
      const logs = service.getAuditLogs();
      const auditLog = logs.find(
        l => l.entityType === 'patient_feedback' && l.action === 'PATIENT_FEEDBACK_SUBMITTED'
      );
      expect(auditLog).toBeDefined();
    });
  });

  describe('2. Validation & Business Constraints', () => {
    it('rejects submissions for non-completed care plans', () => {
      // plan-1 is Active
      const payload: SubmitFeedbackPayload = {
        carePlanId: 'plan-1',
        patientId: 'patient-1',
        improvementStatus: 'somewhat_better',
        adherenceStatus: 'followed_all',
        barrierType: 'no_difficulties',
        experienceRating: 5,
        worseningReported: false,
        safetyAcknowledged: false
      };

      expect(() => service.submitPatientFeedback(payload)).toThrowError(
        'Feedback can only be submitted once the care plan has reached its completed state.'
      );
    });

    it('rejects invalid experience ratings outside 1-5 stars', () => {
      const payloadZero: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'somewhat_better',
        adherenceStatus: 'followed_all',
        barrierType: 'no_difficulties',
        experienceRating: 0,
        worseningReported: false,
        safetyAcknowledged: false
      };

      expect(() => service.submitPatientFeedback(payloadZero)).toThrowError(
        'Care experience rating must be between 1 and 5 stars.'
      );

      const payloadSix: SubmitFeedbackPayload = {
        ...payloadZero,
        experienceRating: 6
      };

      expect(() => service.submitPatientFeedback(payloadSix)).toThrowError(
        'Care experience rating must be between 1 and 5 stars.'
      );
    });

    it('rejects comments exceeding 3000 characters', () => {
      const longComment = 'a'.repeat(3001);
      const payload: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'somewhat_better',
        adherenceStatus: 'followed_all',
        barrierType: 'no_difficulties',
        experienceRating: 5,
        comments: longComment,
        worseningReported: false,
        safetyAcknowledged: false
      };

      expect(() => service.submitPatientFeedback(payload)).toThrowError(
        'Additional comments cannot exceed 3,000 characters.'
      );
    });

    it('prevents duplicate feedback submission for the same care plan', () => {
      const payload: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'somewhat_better',
        adherenceStatus: 'followed_all',
        barrierType: 'no_difficulties',
        experienceRating: 5,
        worseningReported: false,
        safetyAcknowledged: false
      };

      // First submission succeeds
      service.submitPatientFeedback(payload);

      // Second duplicate submission must fail
      expect(() => service.submitPatientFeedback(payload)).toThrowError(
        'Feedback has already been submitted for this care plan.'
      );
    });
  });

  describe('3. Worsening Symptoms & Urgent Clinical Triage', () => {
    it('automatically flags feedback as action_required when worsening is reported', () => {
      const worseningPayload: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'worse_than_before',
        adherenceStatus: 'unable_to_follow',
        barrierType: 'side_effects',
        experienceRating: 2,
        comments: 'Acute shortness of breath and dizziness after medication.',
        worseningReported: true,
        worseningDetails: 'Acute shortness of breath and dizziness.',
        safetyAcknowledged: true
      };

      const result = service.submitPatientFeedback(worseningPayload);

      expect(result.reviewStatus).toBe('action_required');
      expect(result.worseningReported).toBe(true);

      // Verify escalation alert is sent to doctor
      const notifs = service.getNotifications();
      const escalationNotif = notifs.find(n => n.type === 'escalation');
      expect(escalationNotif).toBeDefined();
      expect(escalationNotif?.title).toContain('Worsening Symptoms');
    });

    it('flags action_required when patient is unable to follow instructions or has barriers', () => {
      const barrierPayload: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'no_change',
        adherenceStatus: 'unable_to_follow',
        barrierType: 'cost',
        barrierOtherDetails: 'Cannot afford prescription refilling',
        experienceRating: 3,
        worseningReported: false,
        safetyAcknowledged: false
      };

      const result = service.submitPatientFeedback(barrierPayload);
      expect(result.reviewStatus).toBe('action_required');
    });
  });

  describe('4. Doctor Review Workflow & Loop Closure', () => {
    it('allows doctor to review feedback, document findings, and optionally create follow-up task', () => {
      // Initial feedback already seeded for Sarah Khan (fb-sarah-1: reviewStatus pending)
      const reviewPayload: ReviewFeedbackPayload = {
        doctorResponse: 'Evaluated patient metabolic response. Moderate glycemic stabilization achieved.',
        nextAction: 'Medication Adjustment',
        careGapIdentified: 'Fasting compliance difficulty during morning windows',
        createFollowUpTask: true,
        followUpTaskDetails: {
          title: 'Metabolic Consultation & Regimen Adjustment',
          taskType: 'Follow-Up Visit',
          deadlineDays: 10,
          instructions: 'Discuss fasting glucose variations and adjust morning metformin dosing.'
        }
      };

      const { feedback: reviewedFeedback, followUpTask } = service.completeFeedbackReview(
        'fb-sarah-1',
        reviewPayload,
        'user-doctor-1'
      );

      expect(reviewedFeedback.reviewStatus).toBe('reviewed');
      expect(reviewedFeedback.doctorResponse).toBe(reviewPayload.doctorResponse);
      expect(reviewedFeedback.nextAction).toBe('Medication Adjustment');
      expect(reviewedFeedback.careGapIdentified).toBe(reviewPayload.careGapIdentified);
      expect(reviewedFeedback.reviewedBy).toBe('user-doctor-1');
      expect(reviewedFeedback.reviewedAt).toBeDefined();

      // Follow up task verification
      expect(followUpTask).toBeDefined();
      expect(followUpTask?.title).toBe('Metabolic Consultation & Regimen Adjustment');
      expect(followUpTask?.assignedRole).toBe('patient');
      expect(followUpTask?.taskStatus).toBe('Pending');
      expect(reviewedFeedback.followUpTaskId).toBe(followUpTask?.id);

      // Verify patient notification was dispatched
      const notifs = service.getNotifications();
      const patientNotif = notifs.find(
        n => n.recipientRole === 'patient' && n.title.includes('Doctor Reviewed Your Care Plan Feedback')
      );
      expect(patientNotif).toBeDefined();

      // Verify doctor audit log entry was created
      const logs = service.getAuditLogs();
      const reviewLog = logs.find(l => l.action === 'FEEDBACK_CLINICALLY_REVIEWED');
      expect(reviewLog).toBeDefined();
    });

    it('requires doctor notes and next action before closing the review', () => {
      const invalidPayload: ReviewFeedbackPayload = {
        doctorResponse: '',
        nextAction: 'Follow-Up Scheduled'
      };

      expect(() =>
        service.completeFeedbackReview('fb-sarah-1', invalidPayload, 'user-doctor-1')
      ).toThrowError(
        'Clinical review notes or doctor response is required before marking review complete.'
      );
    });

    it('filters feedback correctly for doctor feedback queue', () => {
      const queue = service.getDoctorFeedbackQueue('user-doctor-1');
      expect(queue.length).toBeGreaterThan(0);

      // Verify all belong to care plans assigned to user-doctor-1
      const doctorPlans = service.getCarePlans().filter(cp => cp.doctorId === 'user-doctor-1');
      const planIdSet = new Set(doctorPlans.map(p => p.id));

      for (const item of queue) {
        expect(planIdSet.has(item.carePlanId)).toBe(true);
      }
    });
  });
});
