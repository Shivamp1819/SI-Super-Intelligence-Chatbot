import { configureGemini, getGeminiAPIKey } from "../config/gemini-config.js";

/**
 * Common typo, misspelling, and acronym corrections dictionary.
 */
const CORRECTION_MAP: Record<string, string> = {
  // Programming & Tech
  reatc: "React",
  reactjs: "React.js",
  nodjs: "Node.js",
  nodejs: "Node.js",
  mongdb: "MongoDB",
  mongodb: "MongoDB",
  exprss: "Express",
  expressjs: "Express.js",
  pythn: "Python",
  pyton: "Python",
  javascrpt: "JavaScript",
  javscript: "JavaScript",
  js: "JavaScript",
  typesscript: "TypeScript",
  typescrpt: "TypeScript",
  ts: "TypeScript",
  htlm: "HTML",
  html: "HTML",
  css: "CSS",
  jwt: "JWT",
  jwts: "JWT",
  api: "API",
  apis: "APIs",
  ai: "AI",
  ml: "Machine Learning",
  sql: "SQL",
  nosql: "NoSQL",
  aws: "AWS",
  gcp: "Google Cloud",
  azur: "Azure",
  docker: "Docker",
  git: "Git",
  githb: "GitHub",
  github: "GitHub",
  // Common typo verbs & nouns
  maek: "Make",
  mak: "Make",
  creat: "Create",
  crate: "Create",
  buld: "Build",
  buid: "Build",
  writ: "Write",
  wrt: "Write",
  progrm: "Program",
  programing: "Programming",
  devlop: "Develop",
  devlopment: "Development",
  webiste: "Website",
  websit: "Website",
  aplication: "Application",
  app: "App",
  databse: "Database",
  databas: "Database",
  servr: "Server",
  sever: "Server",
  conection: "Connection",
  connction: "Connection",
  eror: "Error",
  erors: "Errors",
  issu: "Issue",
  issus: "Issues",
  authen: "Authentication",
  authentcatn: "Authentication",
  auth: "Authentication",
  login: "Login",
  loggin: "Login",
  singup: "Sign Up",
  signup: "Sign Up",
  passwrd: "Password",
  pasword: "Password",
  // Concepts & Domains
  quatum: "Quantum",
  computng: "Computing",
  wrks: "Works",
  capitl: "Capital",
  franch: "France",
  frence: "France",
  binarry: "Binary",
  binry: "Binary",
  seach: "Search",
  srch: "Search",
  implemntation: "Implementation",
  implimnt: "Implement",
  algoritm: "Algorithm",
  algorthm: "Algorithm",
  structur: "Structure",
  diference: "Difference",
  diffrence: "Difference",
  explan: "Explanation",
  explnation: "Explanation",
  tutoril: "Tutorial",
  begginer: "Beginner",
  beginer: "Beginner",
  queston: "Question",
  qustion: "Question",
  answr: "Answer",
  soluton: "Solution",
  cod: "Code",
  projct: "Project",
  intall: "Install",
  instal: "Install",
  packag: "Package",
  deply: "Deploy",
  confg: "Config",
  compnent: "Component",
  componet: "Component",
  interfac: "Interface",
  performanc: "Performance",
  optimiz: "Optimization",
  securty: "Security",
  resposne: "Response",
  reposnse: "Response",
  functioanlity: "Functionality",
  functionalty: "Functionality",
  scraller: "Scroller",
  scroler: "Scroller",
  botton: "Bottom",
};

/**
 * Normalizes and formats a word to Title Case, respecting known acronyms and typos.
 */
const formatTitleCaseWord = (word: string): string => {
  const lower = word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
  if (!lower) return "";

  if (CORRECTION_MAP[lower]) {
    return CORRECTION_MAP[lower];
  }

  // Common acronyms
  const acronyms: Record<string, string> = {
    ui: "UI",
    ux: "UX",
    ip: "IP",
    url: "URL",
    uri: "URI",
    http: "HTTP",
    https: "HTTPS",
    json: "JSON",
    xml: "XML",
    rest: "REST",
    crud: "CRUD",
    sdk: "SDK",
    npm: "NPM",
    otp: "OTP",
    pdf: "PDF",
    seo: "SEO",
  };

  if (acronyms[lower]) {
    return acronyms[lower];
  }

  // Standard Title Case
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/**
 * Cleans and formats any title into a concise 2 to 5 word Title Case reference topic.
 */
export const sanitizeDisplayTopic = (title: string): string => {
  if (!title) return "New Chat";

  // Remove markdown quotes, symbols, or prefixes
  let cleaned = title
    .replace(/^\[File:\s*[^\]]+\]\n?/i, "")
    .replace(/^["'`#*\s]+|["'`#*\s]+$/g, "")
    .replace(/^(topic|title|subject|reference):\s*/i, "")
    .replace(/[?!.:;]+$/g, "")
    .trim();

  // Strip conversational question prefixes (including common typo variations)
  cleaned = cleaned.replace(
    /^((can|cn)\s+(you|u)\s+(please\s+)?(writ\w*|tel{1,2}\s+me|help\s+me\s+with|give\s+me\s+)?|could\s+you\s+(please\s+)?|please\s+|tel{1,2}\s+me\s+(about\s+)?(wh?at\s+is\s+)?|explain\s+(to\s+me\s+)?|wh?at\s+(is|are)\s+(the\s+)?|how\s+(to|do\s+i|can\s+i|we\s+can)\s+|help\s+me\s+(with\s+)?|writ\w*\s+(a\s+|an\s+)?|creat\w*\s+(a\s+|an\s+)?|give\s+me\s+(a\s+|an\s+)?|i('?m|\s+am)?\s+(having|facing)\s+(an?\s+)?(issu\w*|probl\w*|er{1,2}or\w*)\s+(wit\w*|in)?|i\s+want\s+to\s+|i\s+need\s+to\s+|show\s+me\s+|is\s+there\s+any\s+|why\s+(is|are|does|do)\s+|who\s+(is|are)\s+)/i,
    ""
  );


  const rawWords = cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  if (rawWords.length === 0) {
    return "New Conversation";
  }

  // Filter out stray question filler words if they remain
  const stopWords = new Set(["the", "a", "an", "of", "in", "for", "with", "and", "or", "to", "on"]);
  const formattedWords: string[] = [];

  for (let i = 0; i < rawWords.length; i++) {
    const raw = rawWords[i];
    const lower = raw.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
    if (!lower) continue;

    if (CORRECTION_MAP[lower]) {
      formattedWords.push(CORRECTION_MAP[lower]);
    } else if (i > 0 && stopWords.has(lower) && i < rawWords.length - 1) {
      formattedWords.push(lower);
    } else {
      formattedWords.push(formatTitleCaseWord(raw));
    }

    if (formattedWords.length >= 5) break;
  }

  if (formattedWords.length === 0) {
    return "New Conversation";
  }

  // Ensure between 2 and 5 words if possible
  const result = formattedWords.join(" ").trim();
  return result.length > 45 ? result.substring(0, 42).trim() + "..." : result;
};

/**
 * Local heuristic fallback topic generator when AI generation is unavailable or times out.
 * Automatically corrects spelling mistakes, capital letters, and extracts the core topic.
 */
export const generateFallbackTopic = (
  prompt: string,
  fileName?: string
): string => {
  const clean = (prompt || "")
    .replace(/^\[File:\s*[^\]]+\]\n?/i, "")
    .trim();

  if (!clean && fileName) {
    return `Analysis: ${fileName.replace(/\.[^/.]+$/, "")}`;
  }

  if (!clean) {
    return "New Conversation";
  }

  return sanitizeDisplayTopic(clean);
};

/**
 * Observes the topic from user question(s) using Gemini AI, with multi-model fallback & local repair.
 * Automatically corrects spelling mistakes, capitalization, grammar, and synthesizes
 * a concise 2 to 5 word reference topic title for the chat history.
 */
export const observeTopicFromQuestion = async (
  prompt: string,
  fileName?: string
): Promise<string> => {
  const cleanPrompt = (prompt || "")
    .replace(/^\[File:\s*[^\]]+\]\n?/i, "")
    .trim();

  // If there is no text prompt and only a file is attached
  if (!cleanPrompt && fileName) {
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    return `Analysis: ${cleanName}`;
  }

  const geminiKey = getGeminiAPIKey();
  if (geminiKey && cleanPrompt.length > 2) {
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];
    const uniqueModels = [...new Set(candidateModels.filter(Boolean))] as string[];

    const instruction = `You are an expert editor, linguist, and topic classifier.
User question: "${cleanPrompt.slice(0, 300)}"

Instructions:
1. Observe the user's question, intent, and core meaning very clearly.
2. Automatically correct all spelling mistakes, typos, grammar errors, and incorrect words.
3. Automatically correct capitalization (use Title Case, correctly format acronyms and technologies like AI, React.js, Node.js, JWT, Python, MongoDB, etc.).
4. Do NOT output the full question or conversational filler (e.g. remove "how to", "tell me what is", "can you write", "what is").
5. Synthesize a clean, professional, concise 2 to 5 word reference topic title.
6. Every word, spelling, and meaning MUST be completely accurate.

Return ONLY the corrected 2 to 5 word reference topic title. No quotes, no explanations, no trailing punctuation.`;

    try {
      const genAI = configureGemini();

      for (const mName of uniqueModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: mName,
            generationConfig: {
              maxOutputTokens: 120,
              temperature: 0.1,
            },
          });

          // Timeout after 3 seconds per attempt so UI is never blocked
          const aiPromise = model.generateContent(instruction);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Timeout on model ${mName}`)),
              3000
            )
          );

          const result: any = await Promise.race([aiPromise, timeoutPromise]);
          let aiTitle = result.response.text()?.trim() || "";

          // Clean up quotes, markdown, and whitespace
          aiTitle = aiTitle
            .replace(/^["'`#*\s]+|["'`#*\s]+$/g, "")
            .replace(/^(topic|title|reference):\s*/i, "")
            .replace(/[?!.:;]+$/g, "")
            .trim();

          // Reject raw full questions if model leaked conversational prefixes
          if (
            /^(can you|could you|tell me|explain|what is|how to|i want to|write a)/i.test(
              aiTitle
            )
          ) {
            aiTitle = sanitizeDisplayTopic(aiTitle);
          }

          if (aiTitle.length >= 2 && aiTitle.length <= 60) {
            return aiTitle;
          }
        } catch (mErr: any) {
          // Log and try next candidate model
          console.warn(
            `[TopicObserver] Model ${mName} observation attempt:`,
            mErr?.message || mErr
          );
        }
      }
    } catch (err: any) {
      console.warn(
        "[TopicObserver] AI topic observation fallback:",
        err?.message || err
      );
    }
  }

  // Graceful, spell-corrected local fallback
  return generateFallbackTopic(cleanPrompt, fileName);
};
