import { describe, it, expect } from 'vitest';
import { getSpecialistVisual, SPECIALIST_ICON_MAP } from '../specialistIcons';

describe('specialistIcons', () => {
  it('returns a mapped icon/label for a known specialist', () => {
    const visual = getSpecialistVisual('Cardiologist');
    expect(visual.icon).toBe('HeartPulse');
    expect(visual.label).toBe('Cardiology');
  });

  it('falls back gracefully for an unknown specialist instead of throwing', () => {
    const visual = getSpecialistVisual('Some New Specialty');
    expect(visual.icon).toBe('Stethoscope');
  });

  it('has an accent class defined for every mapped specialist', () => {
    for (const key of Object.keys(SPECIALIST_ICON_MAP)) {
      expect(SPECIALIST_ICON_MAP[key].accent).toBeTruthy();
    }
  });
});
