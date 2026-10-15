/**
 * Indian Female Voice Synthesizer & Speech Engine
 * Specially calibrated for India (English, Hindi, and Hinglish).
 * Designed to sound just like a real Indian female ChatGPT voice agent:
 * - Fluid, connected speech with NO long pauses at commas or full stops
 * - High, sweet, natural, and expressive feminine tone
 * - Brisk, lively talking speed without stutter or lagging
 */

// Cache loaded voices
let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Ensures voices are fully loaded across all browsers (Chrome, Edge, Safari, Firefox).
 * Resolves asynchronously without blocking.
 */
export const getLoadedVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      cachedVoices = immediate;
      resolve(immediate);
      return;
    }

    if (cachedVoices.length > 0) {
      resolve(cachedVoices);
      return;
    }

    let resolved = false;
    const onVoicesChanged = () => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        cachedVoices = window.speechSynthesis.getVoices();
        resolve(cachedVoices);
      }
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

    // Safety timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        cachedVoices = window.speechSynthesis.getVoices();
        resolve(cachedVoices);
      }
    }, 350);
  });
};

// Pre-warm voices immediately in the background
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  getLoadedVoices();
}

/**
 * Checks whether text contains Devanagari script (Hindi, Marathi, Sanskrit).
 */
export const isDevanagariHindi = (text: string): boolean => {
  return /[\u0900-\u097F]/.test(text);
};

/**
 * Blacklist of male keywords to guarantee a female voice is ALWAYS selected.
 */
const MALE_KEYWORDS = [
  "david",
  "mark",
  "guy",
  "ryan",
  "george",
  "christopher",
  "james",
  "brian",
  "eric",
  "andrew",
  "stefan",
  "roger",
  "tom",
  "alex",
  "fred",
  "daniel",
  "oliver",
  "richard",
  "stephen",
  "male",
  "aarav",
  "prabhat",
  "madhav",
  "hemant",
  "ravi",
  "amit",
  "rohit",
  "rahul",
  "vikram",
  "suresh",
  "ajay",
  "anil",
  "raj",
  "kumar",
  "manoj",
  "sanjay",
  "deepak",
  "vijay",
  "karan",
  "aniket",
  "arjun",
  "en-us-standard-b",
  "en-us-standard-d",
  "en-us-wavenet-b",
  "en-us-wavenet-d",
  "en-in-standard-b",
  "en-in-wavenet-b",
];

const isMaleVoice = (name: string): boolean => {
  const lower = name.toLowerCase();
  if (lower.includes("female") || lower.includes("woman")) return false;
  return MALE_KEYWORDS.some((kw) => lower.includes(kw));
};

/**
 * Selects the sweetest, most natural, human-like Indian female voice available.
 * Prioritizes Microsoft Neural (Neerja, Swara, Kavya), Google हिन्दी, Google English (India), Heera, and Veena.
 */
export const getBestIndianFemaleVoice = (
  voicesList: SpeechSynthesisVoice[],
  isHindi: boolean
): { voice: SpeechSynthesisVoice | null; lang: string } => {
  if (!voicesList || voicesList.length === 0) {
    return { voice: null, lang: isHindi ? "hi-IN" : "en-IN" };
  }

  // 1. If text is Devanagari Hindi (हिंदी)
  if (isHindi) {
    const hindiFemaleNames = [
      "swara online (natural)", // Azure Neural Swara (top tier natural Hindi female)
      "swara",
      "kavya online (natural)",
      "kavya",
      "ananya online (natural)",
      "sunita online (natural)",
      "google हिन्दी",
      "google hindi",
      "hi-in-x-cfn",
      "hi-in-x-hie",
      "kalpana", // Microsoft Kalpana (Hindi India)
      "lekha", // Apple Lekha
      "ananya",
      "priya",
      "pooja",
      "shruti",
      "sangeeta",
    ];

    for (const target of hindiFemaleNames) {
      const match = voicesList.find((v) => {
        const name = v.name.toLowerCase();
        return name.includes(target) && !isMaleVoice(name);
      });
      if (match) return { voice: match, lang: match.lang || "hi-IN" };
    }

    // Any non-male hi-IN / hi_IN voice
    const anyHiIn = voicesList.find((v) => {
      const lang = v.lang.toLowerCase().replace("_", "-");
      return (lang === "hi-in" || lang.startsWith("hi")) && !isMaleVoice(v.name);
    });
    if (anyHiIn) return { voice: anyHiIn, lang: anyHiIn.lang || "hi-IN" };
  }

  // 2. English & Hinglish (Romanized Hindi)
  // Strictly prioritize authentic Indian English female voices:
  const indianFemaleKeywords = [
    "neerja online (natural)", // Azure Neural Neerja: #1 sweet, crystal clear real Indian girl voice
    "neerja",
    "microsoft heera", // Windows en-IN female (Heera)
    "heera",
    "mstts_v110_enin_heera",
    "veena", // Apple/iOS Veena (English India)
    "google english (india)",
    "en-in-x-end", // Android Google TTS Indian female
    "en-in-x-ene",
    "en-in-x-cxx",
    "kavya online (natural)",
    "swara online (natural)",
    "kalyani",
    "priya",
    "ananya",
    "aditi",
    "kanya",
    "chahat",
    "geeta",
    "sunita",
    "meera",
  ];

  for (const target of indianFemaleKeywords) {
    const match = voicesList.find((v) => {
      const name = v.name.toLowerCase();
      const lang = (v.lang || "").toLowerCase().replace("_", "-");
      // CRITICAL: NEVER match google hindi or hi-IN for English/Hinglish text!
      const isPureHindi = lang.startsWith("hi") || name.includes("हिन्दी") || name.includes("hindi");
      if (isPureHindi) return false;
      return name.includes(target) && !isMaleVoice(name);
    });
    if (match) return { voice: match, lang: match.lang || "en-IN" };
  }

  // Any non-male voice with 'en-IN' locale that is NOT pure Hindi
  const enInFemale = voicesList.find((v) => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    const name = v.name.toLowerCase();
    const isEnIn = lang === "en-in" || lang.startsWith("en-in");
    const isPureHindi = name.includes("हिन्दी") || name.includes("hindi");
    return isEnIn && !isPureHindi && !isMaleVoice(name);
  });
  if (enInFemale) return { voice: enInFemale, lang: enInFemale.lang || "en-IN" };

  // Any voice with 'india' or 'indian' in name and 'en' in lang
  const indiaNamed = voicesList.find((v) => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    return (name.includes("india") || name.includes("indian")) && lang.startsWith("en") && !isMaleVoice(name);
  });
  if (indiaNamed) return { voice: indiaNamed, lang: indiaNamed.lang || "en-IN" };

  // Sweet natural female global fallbacks (if no Indian voices installed on user's specific browser)
  const sweetGlobalFallbacks = [
    "jenny online (natural)",
    "aria online (natural)",
    "sonia online (natural)",
    "google uk english female",
    "samantha",
    "victoria",
    "karen",
    "zira",
  ];

  for (const target of sweetGlobalFallbacks) {
    const match = voicesList.find((v) => {
      const name = v.name.toLowerCase();
      return name.includes(target) && !isMaleVoice(name);
    });
    if (match) return { voice: match, lang: match.lang || "en-US" };
  }

  // Any non-male English voice
  const nonMaleEn = voicesList.find((v) => {
    const isEn = v.lang.toLowerCase().startsWith("en");
    return isEn && !isMaleVoice(v.name);
  });
  if (nonMaleEn) return { voice: nonMaleEn, lang: nonMaleEn.lang || "en-US" };

  const anyFemale = voicesList.find((v) => !isMaleVoice(v.name));
  return { voice: anyFemale || voicesList[0] || null, lang: isHindi ? "hi-IN" : "en-IN" };
};

/**
 * Cleans text for ultra-fluid, natural, ChatGPT-like conversational speech:
 * - REMOVES commas, semicolons, colons, and dashes: In Web Speech API, commas cause
 *   long 400ms-600ms dead silences. By replacing them with a space, speech flows
 *   continuously and connectedly with authentic human coarticulation!
 * - Normalizes full stops into crisp, natural breath transitions without lagging.
 * - Strips emojis, markdown, URLs, and code blocks.
 * - Expands acronyms smoothly without stuttering periods (e.g. AI -> AI, ML -> ML).
 */
export const cleanTextForSpeech = (rawText: string): string => {
  if (!rawText) return "";

  let cleaned = rawText
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    // Remove links and markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    // Remove all emojis (standard, surrogate pairs, symbols, dingbats)
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu,
      ""
    )
    // Remove markdown headers, bullets, numbers, blockquotes
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*•+]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/[*_~`>#|\\^{}[\]()]/g, "")
    // Smooth pronunciation helpers: remove dots from acronyms so they don't cause period pauses
    .replace(/\bA\.I\.\b|\bAI\b/g, "AI")
    .replace(/\bM\.L\.\b|\bML\b/g, "ML")
    .replace(/\bU\.I\.\b|\bUI\b/g, "UI")
    .replace(/\bU\.X\.\b|\bUX\b/g, "UX")
    .replace(/\bA\.P\.I\.\b|\bAPI\b/g, "API")
    .replace(/\be\.g\.\b/gi, "for example")
    .replace(/\bi\.e\.\b/gi, "that is")
    .replace(/\betc\.\b/gi, "and so on")
    .replace(/&/g, " and ")
    .replace(/%/g, " percent ")
    // CRITICAL: Replace commas, semicolons, colons, dashes, and ellipses with spaces!
    // This directly fixes the issue where the voice takes a long time pausing at commas.
    // Instead of stopping for 500ms, words now flow smoothly into each other like ChatGPT voice!
    .replace(/[,;:–—]/g, " ")
    .replace(/\.{2,}/g, " ")
    .replace(/--+/g, " ")
    // Reduce multiple exclamation/question marks to single clean punctuation
    .replace(/!+/g, "!")
    .replace(/\?+/g, "?")
    // Normalize spaces and eliminate double periods
    .replace(/\.\s*\./g, ".")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
};

/**
 * Splits text into fluent, natural paragraph blocks (~300-500 characters)
 * ONLY if text is extraordinarily long. Short & medium conversational dialogue
 * (1-4 sentences) stays in a SINGLE utterance so there is ZERO inter-sentence
 * chunk initialization lag or full-stop freezing!
 */
export const splitIntoSpeechChunks = (text: string, maxChunkLen: number = 420): string[] => {
  if (!text) return [];

  // If text is short or medium, keep it as ONE single fluent utterance (ChatGPT-style!)
  if (text.length <= maxChunkLen) {
    return [text];
  }

  // Split on sentence boundaries: periods, exclamation, question marks, Hindi danda (।)
  const rawSentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (!currentChunk) {
      currentChunk = trimmed;
    } else if (currentChunk.length + trimmed.length + 1 <= maxChunkLen) {
      currentChunk += " " + trimmed;
    } else {
      chunks.push(currentChunk);
      currentChunk = trimmed;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
};

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  pitchMultiplier?: number;
  rateMultiplier?: number;
}

// Session counter to ensure only the latest speech session plays and cancels earlier ones
let activeSpeechSessionId = 0;

/**
 * Speaks text using the real Indian female voice engine (ChatGPT Agent style).
 * - ZERO awkward pauses at commas: commas are smoothed into fluid connected speech
 * - Minimal, natural breath at full stops: no 1-second lag or engine restart delay
 * - Sweet, bright, warm Indian feminine pitch (~1.24)
 * - Brisk, lively talking speed (1.20)
 */
// Global watchdog timer to ensure speaking state never hangs on mobile
let speechWatchdogTimer: any = null;

export const speakWithIndianFemaleVoice = async (
  rawText: string,
  options: SpeakOptions = {}
): Promise<void> => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (options.onEnd) options.onEnd();
    return;
  }

  // Cancel any ongoing speech cleanly
  activeSpeechSessionId++;
  const thisSessionId = activeSpeechSessionId;

  if (speechWatchdogTimer) {
    clearTimeout(speechWatchdogTimer);
    speechWatchdogTimer = null;
  }

  try {
    window.speechSynthesis.cancel();
    // Mobile browsers (iOS Safari, Android Chrome) can sleep in paused state
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (_) {}

  const clean = cleanTextForSpeech(rawText);
  if (!clean) {
    if (options.onEnd) options.onEnd();
    return;
  }

  const isHindi = isDevanagariHindi(clean);
  const voices = await getLoadedVoices();
  const { voice, lang } = getBestIndianFemaleVoice(voices, isHindi);

  // Split only if extraordinarily long (> 420 chars); keeps standard messages in ONE continuous stream!
  const chunks = splitIntoSpeechChunks(clean, 420);
  if (chunks.length === 0) {
    if (options.onEnd) options.onEnd();
    return;
  }

  // Authentic, High, Sweet Indian Female Voice Calibration:
  // - Studio Neural/Online voices (Neerja, Swara, Jenny): Pitch 1.01 (pure studio vocoder, sweet clarity)
  // - Standard native voices (Heera, Veena, Google UK): Pitch 1.05 (natural, bright, sweet feminine lift without chipmunk/robotic distortion)
  // - Rate: 1.08 (fluent, lively, human conversational tempo)
  const isNeuralVoice =
    voice?.name.toLowerCase().includes("natural") ||
    voice?.name.toLowerCase().includes("online") ||
    voice?.name.toLowerCase().includes("neural");
  const basePitch = isNeuralVoice ? 1.01 : 1.05;
  const baseRate = 1.08;

  const finalPitch = Math.min(Math.max(basePitch * (options.pitchMultiplier || 1.0), 0.8), 1.2);
  const finalRate = Math.min(Math.max(baseRate * (options.rateMultiplier || 1.0), 0.7), 1.4);

  let currentChunkIndex = 0;
  let hasStarted = false;

  const cleanupSession = () => {
    if (speechWatchdogTimer) {
      clearTimeout(speechWatchdogTimer);
      speechWatchdogTimer = null;
    }
    try {
      (window as any).__si_active_utterance = null;
    } catch (_) {}
  };

  const speakNextChunk = () => {
    // If a new session started or speech was stopped, abort
    if (thisSessionId !== activeSpeechSessionId) {
      cleanupSession();
      return;
    }

    if (currentChunkIndex >= chunks.length) {
      cleanupSession();
      if (options.onEnd) options.onEnd();
      return;
    }

    const chunkText = chunks[currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = lang;
    if (voice) {
      utterance.voice = voice;
    }

    utterance.pitch = finalPitch;
    utterance.rate = finalRate;
    utterance.volume = 1.0;

    // Prevent iOS Safari WebKit garbage collection bug
    try {
      (window as any).__si_active_utterance = utterance;
    } catch (_) {}

    // Watchdog timer: if mobile browser drops onend event, trigger next or end
    if (speechWatchdogTimer) clearTimeout(speechWatchdogTimer);
    const estimatedMs = Math.max((chunkText.length / 10) * 1000 + 4000, 3500);
    speechWatchdogTimer = setTimeout(() => {
      if (thisSessionId === activeSpeechSessionId) {
        currentChunkIndex++;
        if (currentChunkIndex < chunks.length) {
          speakNextChunk();
        } else {
          cleanupSession();
          if (options.onEnd) options.onEnd();
        }
      }
    }, estimatedMs);

    utterance.onstart = () => {
      if (thisSessionId !== activeSpeechSessionId) return;
      if (!hasStarted) {
        hasStarted = true;
        if (options.onStart) options.onStart();
      }
    };

    utterance.onend = () => {
      if (thisSessionId !== activeSpeechSessionId) return;
      if (speechWatchdogTimer) {
        clearTimeout(speechWatchdogTimer);
        speechWatchdogTimer = null;
      }
      currentChunkIndex++;
      if (currentChunkIndex < chunks.length) {
        speakNextChunk();
      } else {
        cleanupSession();
        if (options.onEnd) options.onEnd();
      }
    };

    utterance.onerror = (e) => {
      if (thisSessionId !== activeSpeechSessionId) return;
      if (speechWatchdogTimer) {
        clearTimeout(speechWatchdogTimer);
        speechWatchdogTimer = null;
      }
      // If cancelled or interrupted intentionally, don't trigger error
      if (e.error === "canceled" || e.error === "interrupted") {
        cleanupSession();
        if (options.onEnd) options.onEnd();
        return;
      }
      console.debug("Indian female TTS event:", e);
      currentChunkIndex++;
      if (currentChunkIndex < chunks.length) {
        speakNextChunk();
      } else {
        cleanupSession();
        if (options.onEnd) options.onEnd();
        if (options.onError) options.onError(e);
      }
    };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.debug("Speech speak invocation error:", err);
      cleanupSession();
      if (options.onEnd) options.onEnd();
    }
  };

  speakNextChunk();
};

/**
 * Preview helper to immediately hear the real Indian female voice agent.
 */
export const previewIndianFemaleVoice = async (
  sampleText: string = "Namaste, main aapki kaise madad kar sakti hoon? Hello, how may I help you?",
  options: SpeakOptions = {}
) => {
  return speakWithIndianFemaleVoice(sampleText, options);
};

/**
 * Immediately cancels any active speech synthesis and halts chunk queue.
 */
export const stopSpeaking = () => {
  activeSpeechSessionId++;
  if (speechWatchdogTimer) {
    clearTimeout(speechWatchdogTimer);
    speechWatchdogTimer = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      (window as any).__si_active_utterance = null;
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
};
