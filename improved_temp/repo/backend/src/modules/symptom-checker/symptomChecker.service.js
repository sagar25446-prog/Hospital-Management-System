/**
 * Symptom checker: LLM-backed when configured, keyword-matched otherwise.
 *
 * This module is the honest fix for a README that advertised an "AI Symptom
 * Checker" backed only by a keyword lookup table. Now:
 *   - If ANTHROPIC_API_KEY is set, a real model reasons about the free-text
 *     description and returns structured JSON (validated before use).
 *   - If it isn't set, or the call fails/times out/returns something we
 *     can't validate, we fall back to the deterministic keyword matcher.
 * Either way the response includes `source` so the frontend can be
 * transparent about which one produced the answer.
 */

const { analyzeSymptoms: keywordAnalyze, KNOWN_SPECIALISTS } = require('./keywordMatcher');

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const REQUEST_TIMEOUT_MS = 8000;

const SYSTEM_PROMPT = `You are a triage assistant for a hospital booking app. A patient will describe symptoms in free text.
Respond with ONLY a JSON object (no markdown fences, no prose) shaped exactly like:
{"specialist": string, "confidence": number between 0 and 1, "urgency": "low"|"medium"|"high"|"emergency", "message": string}

Rules:
- "specialist" MUST be exactly one of: ${KNOWN_SPECIALISTS.join(', ')}.
- "urgency" must be "emergency" for anything potentially life-threatening (e.g. chest pain, difficulty breathing, stroke symptoms, severe bleeding, suicidal ideation).
- "message" is 1-2 short sentences, written directly to the patient, plain language, no diagnosis, no medication advice.
- You are not diagnosing; you are only routing the patient to the right specialist and flagging urgency.
- If the input is empty, nonsensical, or not a symptom description, use specialist "General Medicine", urgency "low", and say so.`;

function isValidResult(obj) {
  return (
    obj &&
    typeof obj.specialist === 'string' &&
    KNOWN_SPECIALISTS.includes(obj.specialist) &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 &&
    obj.confidence <= 1 &&
    ['low', 'medium', 'high', 'emergency'].includes(obj.urgency) &&
    typeof obj.message === 'string' &&
    obj.message.length > 0 &&
    obj.message.length < 600
  );
}

async function analyzeWithClaude(text) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (typeof fetch !== 'function') return null; // Node < 18 without global fetch

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text.slice(0, 2000) }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const data = await response.json();
    const raw = data?.content?.find((b) => b.type === 'text')?.text;
    if (!raw) return null;

    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!isValidResult(parsed)) return null;

    const fallbackDescription = keywordAnalyze(parsed.specialist).description;
    return {
      specialist: parsed.specialist,
      confidence: Math.round(parsed.confidence * 100) / 100,
      urgency: parsed.urgency,
      message: parsed.message,
      description: fallbackDescription,
      matchedKeywords: [],
      source: 'ai',
    };
  } catch (err) {
    return null; // any error (timeout, network, bad JSON) -> caller falls back
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @param {string} text
 * @returns {Promise<object>} result with `source: 'ai' | 'keyword'`
 */
async function analyze(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return keywordAnalyze('');
  }

  const aiResult = await analyzeWithClaude(text);
  if (aiResult) return aiResult;

  return keywordAnalyze(text);
}

/** Whether the AI path is actually configured (surfaced to the frontend so it can be honest in its own copy). */
function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

module.exports = { analyze, isAiConfigured, KNOWN_SPECIALISTS };
