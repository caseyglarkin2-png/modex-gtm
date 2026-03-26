import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

// Ordered by preference — will try each until one succeeds
const MODEL_CANDIDATES = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

function getClient() {
  if (!API_KEY) throw new Error('GEMINI_API_KEY is not set. Add it to your Vercel environment variables.');
  return new GoogleGenerativeAI(API_KEY);
}

export async function generateText(prompt: string, maxTokens = 1024): Promise<string> {
  const client = getClient();
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  ];
  const generationConfig = { maxOutputTokens: maxTokens, temperature: 0.7 };

  let lastError: Error | null = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = client.getGenerativeModel({ model: modelName, safetySettings, generationConfig });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If it's a quota/rate error or model-not-found, try next model
      const msg = lastError.message;
      if (msg.includes('429') || msg.includes('404') || msg.includes('quota') || msg.includes('not found')) {
        continue;
      }
      // For other errors (auth, safety, etc.), don't retry
      throw lastError;
    }
  }

  throw lastError ?? new Error('All Gemini models failed');
}
