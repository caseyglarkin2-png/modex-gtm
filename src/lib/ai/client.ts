import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

function getClient() {
  if (!API_KEY) throw new Error('GEMINI_API_KEY is not set. Add it to your Vercel environment variables.');
  return new GoogleGenerativeAI(API_KEY);
}

export async function generateText(prompt: string, maxTokens = 1024): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}
