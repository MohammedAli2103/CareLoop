import { describe, it, expect, beforeEach } from 'vitest';
import { MockCareLoopService } from '../services/mockCareLoopService';
import { SubmitFeedbackPayload, ReviewFeedbackPayload } from '../types';

describe('Security, RLS & Clinical Safety Protocols', () => {
  let service: MockCareLoopService;

  beforeEach(() => {
    service = new MockCareLoopService();
  });

  describe('1. Cross-Patient Data Isolation & Access Controls', () => {
    it('restricts patient feedback retrieval to only their own care plans', () => {
      // Sarah Khan is patient-1, Vikram Kumar is patient-2
      const allFeedbacks = service.getFeedbacks();
      
      const sarahFeedbacks = allFeedbacks.filter(f => f.patientId === 'patient-1');
      const vikramFeedbacks = allFeedbacks.filter(f => f.patientId === 'patient-2');

      expect(sarahFeedbacks.length).toBeGreaterThan(0);
      expect(vikramFeedbacks.length).toBeGreaterThan(0);

      // Verify that patient-1's feedback belongs to patient-1
      for (const fb of sarahFeedbacks) {
        expect(fb.patientId).toBe('patient-1');
      }

      // Verify patient-2's feedback belongs to patient-2
      for (const fb of vikramFeedbacks) {
        expect(fb.patientId).toBe('patient-2');
      }
    });

    it('isolates doctor feedback queues to assigned patients only', () => {
      // Doctor 1 has care plans for Sarah Khan and Vikram Kumar
      const doc1Queue = service.getDoctorFeedbackQueue('user-doctor-1');
      
      // If another unassigned doctor queries, they should not see doc 1 plans
      const doc2Queue = service.getDoctorFeedbackQueue('unassigned-doctor-id');
      expect(doc2Queue.length).toBe(0);

      expect(doc1Queue.length).toBeGreaterThan(0);
    });
  });

  describe('2. Patient Tamper Prevention (Clinician Review Fields)', () => {
    it('prevents patient submission from setting doctor response or reviewStatus to reviewed', () => {
      // Attempting to pass privileged fields during submission
      const tamperedPayload: any = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'somewhat_better',
        adherenceStatus: 'followed_all',
        barrierType: 'no_difficulties',
        experienceRating: 5,
        worseningReported: false,
        safetyAcknowledged: false,
        // Attacker attempts self-approval
        reviewStatus: 'reviewed',
        doctorResponse: 'Self-approved clean bill of health',
        reviewedBy: 'patient-1'
      };

      const result = service.submitPatientFeedback(tamperedPayload);

      // The service must NOT allow patient to self-review
      expect(result.reviewStatus).toBe('pending');
      expect(result.doctorResponse).toBeUndefined();
      expect(result.reviewedBy).toBeUndefined();
    });
  });

  describe('3. Clinical Triage & Safety Disclaimers', () => {
    it('escalates worsening condition to action_required even if rating was high', () => {
      // Patient gave 5 stars, but checked worsening
      const paradoxicalPayload: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'somewhat_better',
        adherenceStatus: 'followed_all',
        barrierType: 'no_difficulties',
        experienceRating: 5,
        worseningReported: true,
        worseningDetails: 'Sudden sharp chest tightness after finishing plan.',
        safetyAcknowledged: true
      };

      const result = service.submitPatientFeedback(paradoxicalPayload);
      expect(result.reviewStatus).toBe('action_required');
    });

    it('escalates when improvement status is worse_than_before', () => {
      const deterioratingPayload: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'worse_than_before',
        adherenceStatus: 'followed_all',
        barrierType: 'no_difficulties',
        experienceRating: 3,
        worseningReported: false,
        safetyAcknowledged: false
      };

      const result = service.submitPatientFeedback(deterioratingPayload);
      expect(result.reviewStatus).toBe('action_required');
    });

    it('creates an urgent escalation notification when worsening is flagged', () => {
      const urgentPayload: SubmitFeedbackPayload = {
        carePlanId: '44444444-4444-4444-a444-444444444443',
        patientId: 'patient-1',
        improvementStatus: 'worse_than_before',
        adherenceStatus: 'unable_to_follow',
        barrierType: 'side_effects',
        experienceRating: 1,
        worseningReported: true,
        worseningDetails: 'Severe palpitations.',
        safetyAcknowledged: true
      };

      service.submitPatientFeedback(urgentPayload);

      const notifs = service.getNotifications();
      const escalationNotif = notifs.find(n => n.type === 'escalation');
      expect(escalationNotif).toBeDefined();
      expect(escalationNotif?.recipientRole).toBe('doctor');
      expect(escalationNotif?.title).toContain('Worsening Symptoms');
    });
  });

  describe('4. Closed-Loop Care Task Integration', () => {
    it('records complete clinical decision audit trail when closing loop', () => {
      const initialLogsCount = service.getAuditLogs().length;

      const reviewPayload: ReviewFeedbackPayload = {
        doctorResponse: 'Lab work reveals persistent dyslipidemia. Initiated statin adjustment and dietary counseling.',
        nextAction: 'Specialist Referral',
        careGapIdentified: 'Transportation access to cardiology clinic',
        createFollowUpTask: true,
        followUpTaskDetails: {
          title: 'Cardiology Specialist Evaluation',
          taskType: 'Specialist Referral',
          deadlineDays: 21,
          instructions: 'Visit MetroCare Cardiology department.'
        }
      };

      service.completeFeedbackReview('fb-sarah-1', reviewPayload, 'user-doctor-1');

      const updatedLogs = service.getAuditLogs();
      expect(updatedLogs.length).toBe(initialLogsCount + 1);

      const latestLog = updatedLogs[0];
      expect(latestLog.action).toBe('FEEDBACK_CLINICALLY_REVIEWED');
      expect(latestLog.actorRole).toBe('doctor');
      expect(latestLog.details).toContain('Specialist Referral');
      expect(latestLog.details).toContain('Transportation access');
    });
  });
});
