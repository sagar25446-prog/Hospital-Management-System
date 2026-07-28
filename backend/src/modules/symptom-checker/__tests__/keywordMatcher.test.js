const { analyzeSymptoms, KNOWN_SPECIALISTS } = require('../keywordMatcher');

describe('symptom-checker keywordMatcher', () => {
  it('routes an obvious cardiac symptom to Cardiologist with emergency urgency', () => {
    const result = analyzeSymptoms('I have severe chest pain and cannot breathe');
    expect(result.specialist).toBe('Cardiologist');
    expect(result.urgency).toBe('emergency');
    expect(result.source).toBe('keyword');
  });

  it('routes a headache to Neurologist', () => {
    const result = analyzeSymptoms('bad migraine and dizziness since yesterday');
    expect(result.specialist).toBe('Neurologist');
  });

  it('falls back to General Medicine for unmatched free text', () => {
    const result = analyzeSymptoms('xyzzy plugh qwerty');
    expect(result.specialist).toBe('General Medicine');
    expect(result.matchedKeywords).toEqual([]);
  });

  it('falls back to General Medicine for empty input rather than throwing', () => {
    const result = analyzeSymptoms('');
    expect(result.specialist).toBe('General Medicine');
  });

  it('only ever returns a specialist from the known list', () => {
    const inputs = ['toothache', 'pregnant and cramping', 'kidney stone pain', 'child has a fever'];
    for (const input of inputs) {
      const result = analyzeSymptoms(input);
      expect(KNOWN_SPECIALISTS).toContain(result.specialist);
    }
  });

  it('keeps confidence within [0.3, 0.95]', () => {
    const result = analyzeSymptoms('severe knee pain after a fall, swollen joint, sprain');
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });
});
