/**
 * Symptom Analysis Engine
 * Maps user-described symptoms to the appropriate medical specialist
 * with fuzzy matching, confidence scoring, and urgency classification.
 */

const SPECIALIST_MAP = [
  {
    specialist: 'Neurologist',
    keywords: [
      'headache', 'migraine', 'dizziness', 'dizzy', 'seizure', 'seizures',
      'numbness', 'numb', 'tingling', 'vertigo', 'fainting', 'faint',
      'tremor', 'tremors', 'memory loss', 'confusion', 'paralysis',
      'brain', 'nerve', 'concussion', 'stroke',
    ],
    icon: 'Brain',
    description: 'Brain, spine & nervous system specialist',
  },
  {
    specialist: 'Cardiologist',
    keywords: [
      'chest pain', 'heart', 'palpitation', 'palpitations', 'high blood pressure',
      'high bp', 'hypertension', 'shortness of breath', 'breathless',
      'irregular heartbeat', 'cardiac', 'angina', 'cholesterol',
      'swollen legs', 'swollen ankles', 'heart attack',
    ],
    icon: 'Heart',
    description: 'Heart & cardiovascular specialist',
  },
  {
    specialist: 'Dermatologist',
    keywords: [
      'skin rash', 'rash', 'acne', 'pimple', 'pimples', 'eczema',
      'itching', 'itchy', 'hair loss', 'hair fall', 'dandruff',
      'psoriasis', 'hives', 'fungal', 'skin infection', 'mole',
      'wart', 'warts', 'pigmentation', 'dark spots', 'dry skin',
      'skin burn', 'sunburn',
    ],
    icon: 'Stethoscope',
    description: 'Skin, hair & nail specialist',
  },
  {
    specialist: 'Orthopedic',
    keywords: [
      'joint pain', 'fracture', 'broken bone', 'back pain', 'sprain',
      'knee pain', 'shoulder pain', 'hip pain', 'arthritis', 'bone',
      'muscle pain', 'sports injury', 'ligament', 'tendon', 'stiffness',
      'neck pain', 'spine', 'sciatica', 'slipped disc', 'osteoporosis',
      'swollen joint', 'wrist pain', 'ankle pain', 'elbow pain',
    ],
    icon: 'Stethoscope',
    description: 'Bone, joint & muscle specialist',
  },
  {
    specialist: 'General Medicine',
    keywords: [
      'fever', 'cold', 'cough', 'flu', 'sore throat', 'weakness',
      'fatigue', 'tired', 'body ache', 'malaria', 'typhoid',
      'infection', 'chills', 'sweating', 'weight loss', 'weight gain',
      'dehydration', 'general checkup', 'health checkup', 'runny nose',
      'sneezing', 'congestion', 'unwell', 'sick', 'not feeling well',
    ],
    icon: 'Stethoscope',
    description: 'General health & wellness',
  },
  {
    specialist: 'Gastroenterologist',
    keywords: [
      'stomach pain', 'stomach ache', 'nausea', 'vomiting', 'diarrhea',
      'acid reflux', 'heartburn', 'indigestion', 'bloating', 'constipation',
      'abdominal pain', 'gastric', 'ulcer', 'liver', 'jaundice',
      'food poisoning', 'blood in stool', 'irritable bowel', 'cramps',
      'gas', 'gassy', 'acidity', 'belly pain',
    ],
    icon: 'Stethoscope',
    description: 'Digestive system specialist',
  },
  {
    specialist: 'Pediatrician',
    keywords: [
      'child fever', 'baby rash', 'pediatric', 'child', 'infant',
      'baby', 'toddler', 'newborn', 'vaccination', 'child cough',
      'child cold', 'growth', 'development', 'teething', 'diaper rash',
      'child vomiting', 'child diarrhea', 'kids',
    ],
    icon: 'Stethoscope',
    description: 'Child & infant health specialist',
  },
  {
    specialist: 'Ophthalmologist',
    keywords: [
      'eye pain', 'blurry vision', 'blurred vision', 'eye redness',
      'red eye', 'watery eyes', 'dry eyes', 'vision loss', 'eye infection',
      'cataract', 'glaucoma', 'spectacles', 'glasses', 'contact lens',
      'eye strain', 'floaters', 'swollen eye', 'itchy eye', 'eye',
    ],
    icon: 'Stethoscope',
    description: 'Eye & vision specialist',
  },
  {
    specialist: 'ENT Specialist',
    keywords: [
      'ear pain', 'hearing loss', 'sinus', 'sinusitis', 'tonsils',
      'tonsillitis', 'nasal', 'nose bleed', 'snoring', 'throat pain',
      'voice loss', 'hoarse', 'ear infection', 'ear discharge',
      'ringing ear', 'tinnitus', 'blocked ear', 'blocked nose',
      'deviated septum', 'adenoids',
    ],
    icon: 'Stethoscope',
    description: 'Ear, nose & throat specialist',
  },
  {
    specialist: 'Psychiatrist',
    keywords: [
      'anxiety', 'depression', 'insomnia', 'stress', 'panic attack',
      'panic', 'mental health', 'bipolar', 'mood swings', 'suicidal',
      'addiction', 'obsessive', 'ocd', 'ptsd', 'phobia',
      'hallucination', 'psychosis', 'sleep disorder', 'cannot sleep',
      'cant sleep', 'overthinking', 'nervous breakdown', 'burnout',
    ],
    icon: 'Brain',
    description: 'Mental health & behavioral specialist',
  },
  {
    specialist: 'Dentist',
    keywords: [
      'tooth pain', 'toothache', 'gum bleeding', 'gum pain', 'cavity',
      'dental', 'teeth', 'tooth decay', 'wisdom tooth', 'braces',
      'bad breath', 'mouth ulcer', 'jaw pain', 'tooth sensitivity',
      'swollen gums', 'root canal', 'tooth broken',
    ],
    icon: 'Stethoscope',
    description: 'Dental & oral health specialist',
  },
  {
    specialist: 'Gynecologist',
    keywords: [
      'pregnancy', 'pregnant', 'menstrual', 'period pain', 'periods',
      'irregular periods', 'pcos', 'pcod', 'menopause', 'fertility',
      'ovarian', 'uterus', 'vaginal', 'breast lump', 'breast pain',
      'contraception', 'miscarriage', 'prenatal', 'postnatal',
      'cramp', 'heavy bleeding',
    ],
    icon: 'Stethoscope',
    description: 'Women\'s health & reproductive specialist',
  },
  {
    specialist: 'Urologist',
    keywords: [
      'urinary', 'urine', 'kidney stone', 'kidney pain', 'bladder',
      'prostate', 'uti', 'urinary tract', 'blood in urine',
      'frequent urination', 'painful urination', 'kidney',
    ],
    icon: 'Stethoscope',
    description: 'Urinary & kidney specialist',
  },
  {
    specialist: 'Pulmonologist',
    keywords: [
      'asthma', 'wheezing', 'chronic cough', 'lung', 'pneumonia',
      'bronchitis', 'tuberculosis', 'tb', 'breathing difficulty',
      'chest congestion', 'copd', 'respiratory',
    ],
    icon: 'Stethoscope',
    description: 'Lung & respiratory specialist',
  },
];

/** Symptoms that should trigger emergency urgency */
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'difficulty breathing', 'cannot breathe',
  'cant breathe', 'severe bleeding', 'unconscious', 'stroke', 'seizure',
  'suicidal', 'paralysis', 'choking', 'anaphylaxis', 'allergic shock',
  'severe head injury', 'overdose',
];

/** Symptoms that are considered high-urgency */
const HIGH_URGENCY_KEYWORDS = [
  'high fever', 'blood in stool', 'blood in urine', 'severe pain',
  'persistent vomiting', 'head injury', 'fracture', 'broken bone',
  'vision loss', 'fainting', 'swollen legs', 'sudden numbness',
  'palpitations', 'panic attack', 'miscarriage', 'high bp',
  'high blood pressure',
];

/** Symptoms that are medium-urgency */
const MEDIUM_URGENCY_KEYWORDS = [
  'fever', 'vomiting', 'diarrhea', 'rash', 'infection', 'sprain',
  'ear pain', 'eye pain', 'stomach pain', 'migraine', 'dizziness',
  'insomnia', 'anxiety', 'depression', 'acid reflux', 'constipation',
  'asthma', 'wheezing',
];

/**
 * Normalize text for matching: lowercase, trim, remove extra spaces.
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Fuzzy-check whether a keyword partially matches anywhere in the input text.
 * Supports substring matching — e.g. "headach" matches "headache" and vice-versa.
 * @param {string} inputText  - normalized user input
 * @param {string} keyword    - normalized keyword
 * @returns {boolean}
 */
function fuzzyMatch(inputText, keyword) {
  // Exact substring check (keyword found inside input)
  if (inputText.includes(keyword)) return true;

  // Reverse check – input word fragments inside keyword (handles partial typing)
  const inputWords = inputText.split(' ');
  for (const word of inputWords) {
    if (word.length >= 3 && keyword.includes(word)) return true;
  }

  return false;
}

/**
 * Determine urgency level from input text.
 * @param {string} normalizedInput
 * @returns {'low' | 'medium' | 'high' | 'emergency'}
 */
function classifyUrgency(normalizedInput) {
  for (const kw of EMERGENCY_KEYWORDS) {
    if (fuzzyMatch(normalizedInput, kw)) return 'emergency';
  }
  for (const kw of HIGH_URGENCY_KEYWORDS) {
    if (fuzzyMatch(normalizedInput, kw)) return 'high';
  }
  for (const kw of MEDIUM_URGENCY_KEYWORDS) {
    if (fuzzyMatch(normalizedInput, kw)) return 'medium';
  }
  return 'low';
}

/**
 * Analyse user-described symptoms and return a specialist recommendation.
 *
 * @param {string} text - free-form symptom description from the user
 * @returns {{
 *   specialist: string,
 *   confidence: number,
 *   message: string,
 *   urgency: 'low' | 'medium' | 'high' | 'emergency',
 *   icon: string,
 *   description: string,
 *   matchedKeywords: string[]
 * } | null}  null when no symptoms could be matched
 */
export function analyzeSymptoms(text) {
  if (!text || typeof text !== 'string') return null;

  const input = normalize(text);
  if (input.length < 2) return null;

  // Score every specialist by the number of keyword matches
  const scores = SPECIALIST_MAP.map((entry) => {
    const matched = entry.keywords.filter((kw) => fuzzyMatch(input, normalize(kw)));
    return { ...entry, score: matched.length, matchedKeywords: matched };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  if (best.score === 0) {
    return {
      specialist: 'General Medicine',
      confidence: 0.3,
      message:
        "I wasn't able to pinpoint a specific condition, but I'd recommend starting with a General Medicine consultation. A doctor can evaluate your symptoms and refer you to the right specialist if needed.",
      urgency: 'low',
      icon: 'Stethoscope',
      description: 'General health & wellness',
      matchedKeywords: [],
    };
  }

  // Confidence heuristic: more matched keywords → higher confidence (capped at 0.95)
  const maxPossible = best.keywords.length;
  const rawConfidence = best.score / Math.max(maxPossible, 1);
  const confidence = Math.min(0.95, Math.max(0.4, 0.4 + rawConfidence * 0.55));

  const urgency = classifyUrgency(input);

  // Build user-facing message
  let message = '';

  if (urgency === 'emergency') {
    message = `⚠️ This sounds like it could be a medical emergency. Please seek immediate medical attention or call emergency services. Based on your symptoms, a ${best.specialist} should evaluate you urgently.`;
  } else if (urgency === 'high') {
    message = `Your symptoms suggest you should see a ${best.specialist} soon. I'd recommend booking an appointment as early as possible given the nature of your symptoms.`;
  } else if (urgency === 'medium') {
    message = `Based on your symptoms, I'd recommend consulting a ${best.specialist}. It would be a good idea to schedule an appointment within the next few days.`;
  } else {
    message = `Based on what you've described, a ${best.specialist} would be the right specialist for you. You can book a convenient appointment at your earliest convenience.`;
  }

  return {
    specialist: best.specialist,
    confidence,
    message,
    urgency,
    icon: best.icon,
    description: best.description,
    matchedKeywords: best.matchedKeywords,
  };
}

/**
 * Get all available specialist categories (useful for UI display).
 * @returns {Array<{specialist: string, icon: string, description: string}>}
 */
export function getSpecialists() {
  return SPECIALIST_MAP.map(({ specialist, icon, description }) => ({
    specialist,
    icon,
    description,
  }));
}
