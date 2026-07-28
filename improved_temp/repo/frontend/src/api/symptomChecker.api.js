/**
 * Symptom checker API: analyze free-text symptoms -> specialist suggestion.
 */
import apiClient from './client';

export async function analyzeSymptoms(text) {
  const { data } = await apiClient.post('symptom-checker/analyze', { text });
  return data;
}

export async function getSymptomCheckerStatus() {
  const { data } = await apiClient.get('symptom-checker/status');
  return data;
}
