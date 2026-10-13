import { describe, it, expect, beforeEach } from 'vitest';
import { SupabaseCareLoopService } from '../services/supabaseCareLoopService';
import { careLoopService } from '../services/mockCareLoopService';
import { CARE_PLAN_UUID_MAP, UUID_REGEX } from '../data/mockData';
import { SubmitFeedbackPayload, ReviewFeedbackPayload } from '../types';

describe('SupabaseCareLoopService Patient Feedback', () => {
  let service: SupabaseCareLoopService;

  beforeEach(() => {
    careLoopService.resetDemoData();
    service = new SupabaseCareLoopService();
  });

  it('submits patient feedback with normalization of sample values (partially & none)', async () => {
    // Testing the sample from prompt:
    // Improvement: somewhat_better
    // Adherence: partially
    // Barrier: none
    // Experience rating: 4
    // Comments: empty
    const payload: SubmitFeedbackPayload = {
      carePlanId: '44444444-4444-4444-a444-444444444443',
      patientId: '33333333-3333-4333-a333-333333333333',
      improvementStatus: 'somewhat_better',
      adherenceStatus: 'partially',
      barrierType: 'none',
      experienceRating: 4,
      comments: '',
      worseningReported: false,
      safetyAcknowledged: false
    };

    const result = await service.submitPatientFeedback(payload);
    expect(result).not.toBeNull();
    expect(result?.carePlanId).toBe('44444444-4444-4444-a444-444444444443');
    expect(result?.improvementStatus).toBe('somewhat_better');
    expect(result?.experienceRating).toBe(4);
  });

  // REGRESSION TEST: Fix for "invalid input syntax for type uuid: 'plan-completed-prompt'"
  it('maps legacy "plan-completed-prompt" to valid Supabase care plan UUID efb53af1-7122-44a9-973c-3b13074f675c without uuid syntax error', async () => {
    const legacyPayload: SubmitFeedbackPayload = {
      carePlanId: 'plan-completed-prompt',
      patientId: '33333333-3333-4333-a333-333333333333',
      improvementStatus: 'somewhat_better',
      adherenceStatus: 'partially',
      barrierType: 'none',
      experienceRating: 4,
      comments: '',
      worseningReported: false,
      safetyAcknowledged: false
    };

    const result = await service.submitPatientFeedback(legacyPayload);
    expect(result).not.toBeNull();
    // Regression check: Must resolve to the real Supabase UUID
    expect(result?.carePlanId).toBe('efb53af1-7122-44a9-973c-3b13074f675c');
    expect(result?.improvementStatus).toBe('somewhat_better');
  });

  it('validates CARE_PLAN_UUID_MAP maps all legacy keys to valid UUID format', () => {
    expect(CARE_PLAN_UUID_MAP).toBeDefined();
    expect(CARE_PLAN_UUID_MAP['plan-completed-prompt']).toBe('efb53af1-7122-44a9-973c-3b13074f675c');

    for (const uuid of Object.values(CARE_PLAN_UUID_MAP)) {
      expect(UUID_REGEX.test(uuid as string)).toBe(true);
    }
  });

  it('validates ratings must be between 1 and 5 in submitPatientFeedback', async () => {
    const invalidPayload: SubmitFeedbackPayload = {
      carePlanId: '44444444-4444-4444-a444-444444444443',
      patientId: '33333333-3333-4333-a333-333333333333',
      improvementStatus: 'somewhat_better',
      adherenceStatus: 'followed_all',
      barrierType: 'no_difficulties',
      experienceRating: 7,
      worseningReported: false,
      safetyAcknowledged: false
    };

    await expect(service.submitPatientFeedback(invalidPayload)).rejects.toThrow(
      'Care experience rating must be between 1 and 5 stars.'
    );
  });

  it('rejects unmapped non-UUID care plan strings when submitting feedback to prevent PostgreSQL syntax errors', async () => {
    const malformedPayload: SubmitFeedbackPayload = {
      carePlanId: 'completely-invalid-random-string',
      patientId: '33333333-3333-4333-a333-333333333333',
      improvementStatus: 'somewhat_better',
      adherenceStatus: 'followed_all',
      barrierType: 'no_difficulties',
      experienceRating: 4,
      worseningReported: false,
      safetyAcknowledged: false
    };

    await expect(service.submitPatientFeedback(malformedPayload)).rejects.toThrow();
  });

  it('validates clinical notes are required before doctor review completion', async () => {
    const emptyNotesReview: ReviewFeedbackPayload = {
      doctorResponse: '   ',
      nextAction: 'Follow-Up Scheduled'
    };

    await expect(
      service.completeFeedbackReview('fb-sarah-1', emptyNotesReview, '11111111-1111-4111-a111-111111111111')
    ).rejects.toThrow(
      'Clinical review notes or doctor response is required before marking review complete.'
    );
  });

  it('retrieves feedbacks and correctly filters doctor review queue', async () => {
    const feedbacks = await service.getFeedbacks();
    expect(Array.isArray(feedbacks)).toBe(true);
    expect(feedbacks.length).toBeGreaterThan(0);

    const doctorQueue = await service.getDoctorFeedbackQueue('11111111-1111-4111-a111-111111111111');
    expect(Array.isArray(doctorQueue)).toBe(true);
  });
});
