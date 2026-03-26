import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

// Ordered by preference — tries newest/cheapest first, cascades on quota or 404
const MODEL_CANDIDATES = [
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
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

  const errors: string[] = [];

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = client.getGenerativeModel({ model: modelName, safetySettings, generationConfig });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${modelName}: ${msg.slice(0, 120)}`);
      // Retry on quota/rate/model-not-found; throw immediately on auth or safety
      if (msg.includes('429') || msg.includes('404') || msg.includes('quota') || msg.includes('not found') || msg.includes('RESOURCE_EXHAUSTED')) {
        continue;
      }
      throw new Error(`Gemini error (${modelName}): ${msg}`);
    }
  }

  throw new Error(`All Gemini models failed.\n${errors.join('\n')}`);
}

/** Quick health check — returns first model that responds */
export async function checkModelHealth(): Promise<{ ok: boolean; model?: string; errors: string[] }> {
  const client = getClient();
  const errors: string[] = [];
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "ok"');
      if (result.response.text()) return { ok: true, model: modelName, errors };
    } catch (err) {
      errors.push(`${modelName}: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
    }
  }
  return { ok: false, errors };
}
