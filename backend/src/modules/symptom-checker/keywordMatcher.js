/**
 * Rule-based specialist finder: keyword matching + urgency classification.
 * No ML/LLM involved — this is the honest, always-available fallback that
 * powers the checker when no ANTHROPIC_API_KEY is configured, and the
 * safety net if the LLM call fails or times out.
 *
 * (Ported from the frontend's symptomEngine.js, which had this exact logic
 * but was never actually imported by any UI component.)
 */

const SPECIALIST_MAP = [
  { specialist: 'Neurologist', description: 'Brain, spine & nervous system specialist', keywords: ['headache', 'migraine', 'dizziness', 'dizzy', 'seizure', 'seizures', 'numbness', 'numb', 'tingling', 'vertigo', 'fainting', 'faint', 'tremor', 'tremors', 'memory loss', 'confusion', 'paralysis', 'brain', 'nerve', 'concussion', 'stroke'] },
  { specialist: 'Cardiologist', description: 'Heart & cardiovascular specialist', keywords: ['chest pain', 'heart', 'palpitation', 'palpitations', 'high blood pressure', 'high bp', 'hypertension', 'shortness of breath', 'breathless', 'irregular heartbeat', 'cardiac', 'angina', 'cholesterol', 'swollen legs', 'swollen ankles', 'heart attack'] },
  { specialist: 'Dermatologist', description: 'Skin, hair & nail specialist', keywords: ['skin rash', 'rash', 'acne', 'pimple', 'pimples', 'eczema', 'itching', 'itchy', 'hair loss', 'hair fall', 'dandruff', 'psoriasis', 'hives', 'fungal', 'skin infection', 'mole', 'wart', 'warts', 'pigmentation', 'dark spots', 'dry skin', 'skin burn', 'sunburn'] },
  { specialist: 'Orthopedic', description: 'Bone, joint & muscle specialist', keywords: ['joint pain', 'fracture', 'broken bone', 'back pain', 'sprain', 'knee pain', 'shoulder pain', 'hip pain', 'arthritis', 'bone', 'muscle pain', 'sports injury', 'ligament', 'tendon', 'stiffness', 'neck pain', 'spine', 'sciatica', 'slipped disc', 'osteoporosis', 'swollen joint', 'wrist pain', 'ankle pain', 'elbow pain'] },
  { specialist: 'General Medicine', description: 'General health & wellness', keywords: ['fever', 'cold', 'cough', 'flu', 'sore throat', 'weakness', 'fatigue', 'tired', 'body ache', 'malaria', 'typhoid', 'infection', 'chills', 'sweating', 'weight loss', 'weight gain', 'dehydration', 'general checkup', 'health checkup', 'runny nose', 'sneezing', 'congestion', 'unwell', 'sick', 'not feeling well'] },
  { specialist: 'Gastroenterologist', description: 'Digestive system specialist', keywords: ['stomach pain', 'stomach ache', 'nausea', 'vomiting', 'diarrhea', 'acid reflux', 'heartburn', 'indigestion', 'bloating', 'constipation', 'abdominal pain', 'gastric', 'ulcer', 'liver', 'jaundice', 'food poisoning', 'blood in stool', 'irritable bowel', 'cramps', 'gas', 'gassy', 'acidity', 'belly pain'] },
  { specialist: 'Pediatrician', description: 'Child & infant health specialist', keywords: ['child fever', 'baby rash', 'pediatric', 'child', 'infant', 'baby', 'toddler', 'newborn', 'vaccination', 'child cough', 'child cold', 'growth', 'development', 'teething', 'diaper rash', 'child vomiting', 'child diarrhea', 'kids'] },
  { specialist: 'Ophthalmologist', description: 'Eye & vision specialist', keywords: ['eye pain', 'blurry vision', 'blurred vision', 'eye redness', 'red eye', 'watery eyes', 'dry eyes', 'vision loss', 'eye infection', 'cataract', 'glaucoma', 'spectacles', 'glasses', 'contact lens', 'eye strain', 'floaters', 'swollen eye', 'itchy eye', 'eye'] },
  { specialist: 'ENT Specialist', description: 'Ear, nose & throat specialist', keywords: ['ear pain', 'hearing loss', 'sinus', 'sinusitis', 'tonsils', 'tonsillitis', 'nasal', 'nose bleed', 'snoring', 'throat pain', 'voice loss', 'hoarse', 'ear infection', 'ear discharge', 'ringing ear', 'tinnitus', 'blocked ear', 'blocked nose', 'deviated septum', 'adenoids'] },
  { specialist: 'Psychiatrist', description: 'Mental health & behavioral specialist', keywords: ['anxiety', 'depression', 'insomnia', 'stress', 'panic attack', 'panic', 'mental health', 'bipolar', 'mood swings', 'suicidal', 'addiction', 'obsessive', 'ocd', 'ptsd', 'phobia', 'hallucination', 'psychosis', 'sleep disorder', 'cannot sleep', 'cant sleep', 'overthinking', 'nervous breakdown', 'burnout'] },
  { specialist: 'Dentist', description: 'Dental & oral health specialist', keywords: ['tooth pain', 'toothache', 'gum bleeding', 'gum pain', 'cavity', 'dental', 'teeth', 'tooth decay', 'wisdom tooth', 'braces', 'bad breath', 'mouth ulcer', 'jaw pain', 'tooth sensitivity', 'swollen gums', 'root canal', 'tooth broken'] },
  { specialist: 'Gynecologist', description: "Women's health & reproductive specialist", keywords: ['pregnancy', 'pregnant', 'menstrual', 'period pain', 'periods', 'irregular periods', 'pcos', 'pcod', 'menopause', 'fertility', 'ovarian', 'uterus', 'vaginal', 'breast lump', 'breast pain', 'contraception', 'miscarriage', 'prenatal', 'postnatal', 'cramp', 'heavy bleeding'] },
  { specialist: 'Urologist', description: 'Urinary & kidney specialist', keywords: ['urinary', 'urine', 'kidney stone', 'kidney pain', 'bladder', 'prostate', 'uti', 'urinary tract', 'blood in urine', 'frequent urination', 'painful urination', 'kidney'] },
  { specialist: 'Pulmonologist', description: 'Lung & respiratory specialist', keywords: ['asthma', 'wheezing', 'chronic cough', 'lung', 'pneumonia', 'bronchitis', 'tuberculosis', 'tb', 'breathing difficulty', 'chest congestion', 'copd', 'respiratory'] },
];

const EMERGENCY_KEYWORDS = ['chest pain', 'heart attack', 'difficulty breathing', 'cannot breathe', 'cant breathe', 'severe bleeding', 'unconscious', 'stroke', 'seizure', 'suicidal', 'paralysis', 'choking', 'anaphylaxis', 'allergic shock', 'severe head injury', 'overdose'];
const HIGH_URGENCY_KEYWORDS = ['high fever', 'blood in stool', 'blood in urine', 'severe pain', 'persistent vomiting', 'head injury', 'fracture', 'broken bone', 'vision loss', 'fainting', 'swollen legs', 'sudden numbness', 'palpitations', 'panic attack', 'miscarriage', 'high bp', 'high blood pressure'];
const MEDIUM_URGENCY_KEYWORDS = ['fever', 'vomiting', 'diarrhea', 'rash', 'infection', 'sprain', 'ear pain', 'eye pain', 'stomach pain', 'migraine', 'dizziness', 'insomnia', 'anxiety', 'depression', 'acid reflux', 'constipation', 'asthma', 'wheezing'];

function normalize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function fuzzyMatch(inputText, keyword) {
  // Exact substring check — this is the real match.
  if (inputText.includes(keyword)) return true;
  // Reverse check for partial typing of a *single* term (e.g. "arthrit" ->
  // "arthritis") — deliberately NOT applied to multi-word keywords, since
  // that let one generic shared word (e.g. "pain") false-match against
  // every unrelated "X pain" phrase and outscore a real exact match like
  // "chest pain", which could misroute something as serious as chest pain.
  if (keyword.includes(' ')) return false;
  const inputWords = inputText.split(' ');
  for (const word of inputWords) {
    if (word.length >= 4 && keyword.includes(word)) return true;
  }
  return false;
}

function classifyUrgency(normalizedInput) {
  for (const kw of EMERGENCY_KEYWORDS) if (fuzzyMatch(normalizedInput, kw)) return 'emergency';
  for (const kw of HIGH_URGENCY_KEYWORDS) if (fuzzyMatch(normalizedInput, kw)) return 'high';
  for (const kw of MEDIUM_URGENCY_KEYWORDS) if (fuzzyMatch(normalizedInput, kw)) return 'medium';
  return 'low';
}

/**
 * @param {string} text - free-form symptom description
 * @returns {{specialist:string, confidence:number, message:string, urgency:string, description:string, matchedKeywords:string[], source:'keyword'}}
 */
function analyzeSymptoms(text) {
  const input = normalize(text);
  if (input.length < 2) {
    return {
      specialist: 'General Medicine',
      confidence: 0.3,
      message: "Tell me a bit more about what you're experiencing so I can point you to the right specialist.",
      urgency: 'low',
      description: 'General health & wellness',
      matchedKeywords: [],
      source: 'keyword',
    };
  }

  const scores = SPECIALIST_MAP.map((entry) => {
    const matched = entry.keywords.filter((kw) => fuzzyMatch(input, kw));
    return { ...entry, score: matched.length, matchedKeywords: matched };
  });
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const urgency = classifyUrgency(input);

  if (best.score === 0) {
    return {
      specialist: 'General Medicine',
      confidence: 0.3,
      message: "I couldn't match that to a specific specialty. A General Medicine consultation is a safe starting point — that doctor can refer you onward if needed.",
      urgency,
      description: 'General health & wellness',
      matchedKeywords: [],
      source: 'keyword',
    };
  }

  const maxPossible = best.keywords.length;
  const rawConfidence = best.score / Math.max(maxPossible, 1);
  const confidence = Math.min(0.95, Math.max(0.4, 0.4 + rawConfidence * 0.55));

  let message;
  if (urgency === 'emergency') {
    message = `This could be a medical emergency. Please seek immediate in-person care or call your local emergency number rather than waiting for an appointment. Based on what you described, a ${best.specialist} would ordinarily be the right specialist.`;
  } else if (urgency === 'high') {
    message = `Based on what you described, seeing a ${best.specialist} soon would be a good idea — try to book within the next day or two.`;
  } else if (urgency === 'medium') {
    message = `Based on what you described, a ${best.specialist} would be a reasonable specialist to see, ideally within the next few days.`;
  } else {
    message = `Based on what you described, a ${best.specialist} would be the right specialist to book with, at your convenience.`;
  }

  return {
    specialist: best.specialist,
    confidence: Number(confidence.toFixed(2)),
    message,
    urgency,
    description: best.description,
    matchedKeywords: best.matchedKeywords,
    source: 'keyword',
  };
}

const KNOWN_SPECIALISTS = SPECIALIST_MAP.map((s) => s.specialist);

module.exports = { analyzeSymptoms, KNOWN_SPECIALISTS };
