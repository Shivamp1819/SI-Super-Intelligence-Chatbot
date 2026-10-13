import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiAPIKey = (): string | undefined => {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    (process.env.OPEN_AI_SECRET?.startsWith("AQ.") ||
    process.env.OPEN_AI_SECRET?.startsWith("AIza")
      ? process.env.OPEN_AI_SECRET
      : undefined)
  );
};

export const configureGemini = (): GoogleGenerativeAI => {
  const apiKey = getGeminiAPIKey();
  if (!apiKey) {
    throw new Error("No Gemini API key found in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};
