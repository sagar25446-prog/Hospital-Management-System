import { describe, it, expect } from 'vitest';
import { analyzeSymptoms, getSpecialists } from '../symptomEngine';

describe('symptomEngine (offline fallback used by SymptomCheckerWidget)', () => {
  it('routes an obvious cardiac symptom correctly (regression test for the pain/Orthopedic mis-route bug)', () => {
    const result = analyzeSymptoms('severe chest pain and cannot breathe');
    expect(result.specialist).toBe('Cardiologist');
    expect(result.urgency).toBe('emergency');
  });

  it('routes a dental symptom to Dentist', () => {
    const result = analyzeSymptoms('bad toothache and swollen gums');
    expect(result.specialist).toBe('Dentist');
  });

  it('returns null for empty input', () => {
    expect(analyzeSymptoms('')).toBeNull();
    expect(analyzeSymptoms(null)).toBeNull();
  });

  it('exposes a non-empty specialist list for the UI', () => {
    const list = getSpecialists();
    expect(list.length).toBeGreaterThan(5);
    expect(list[0]).toHaveProperty('specialist');
  });
});
