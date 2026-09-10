import { ObservationsService } from './observations.service';

describe('ObservationsService', () => {
  describe('resolveEventType (static)', () => {
    it('maps CONFUSION to COGNITIVE_CHANGE', () => {
      expect(ObservationsService.resolveEventType('CONFUSION')).toBe('COGNITIVE_CHANGE');
    });

    it('maps FALL to FALL', () => {
      expect(ObservationsService.resolveEventType('FALL')).toBe('FALL');
    });

    it('maps NEAR_FALL to NEAR_FALL', () => {
      expect(ObservationsService.resolveEventType('NEAR_FALL')).toBe('NEAR_FALL');
    });

    it('maps APPETITE to APPETITE_CHANGE', () => {
      expect(ObservationsService.resolveEventType('APPETITE')).toBe('APPETITE_CHANGE');
    });

    it('maps SLEEP to SLEEP_CHANGE', () => {
      expect(ObservationsService.resolveEventType('SLEEP')).toBe('SLEEP_CHANGE');
    });

    it('maps MOBILITY to MOBILITY_CHANGE', () => {
      expect(ObservationsService.resolveEventType('MOBILITY')).toBe('MOBILITY_CHANGE');
    });

    it('maps MOOD to SYMPTOM', () => {
      expect(ObservationsService.resolveEventType('MOOD')).toBe('SYMPTOM');
    });

    it('maps PAIN to SYMPTOM', () => {
      expect(ObservationsService.resolveEventType('PAIN')).toBe('SYMPTOM');
    });

    it('maps MEDICATION to MEDICATION_CHANGED by default', () => {
      expect(ObservationsService.resolveEventType('MEDICATION')).toBe('MEDICATION_CHANGED');
    });

    it('maps MEDICATION to MISSED_MEDICATION when structured.type is "missed"', () => {
      expect(
        ObservationsService.resolveEventType('MEDICATION', { type: 'missed' }),
      ).toBe('MISSED_MEDICATION');
    });

    it('maps MEDICATION to MEDICATION_CHANGED when structured.type is not "missed"', () => {
      expect(
        ObservationsService.resolveEventType('MEDICATION', { type: 'started' }),
      ).toBe('MEDICATION_CHANGED');
    });

    it('maps OTHER to CAREGIVER_OBSERVATION', () => {
      expect(ObservationsService.resolveEventType('OTHER')).toBe('CAREGIVER_OBSERVATION');
    });

    it('falls back to CAREGIVER_OBSERVATION for unknown category', () => {
      expect(ObservationsService.resolveEventType('UNKNOWN_CATEGORY')).toBe('CAREGIVER_OBSERVATION');
    });
  });
});
