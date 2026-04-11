export async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const normalized = text.replace(/\s+/g, ' ').trim();
    const looksLikeHtml = normalized.startsWith('<!DOCTYPE') || normalized.startsWith('<html') || normalized.startsWith('<');

    if (looksLikeHtml) {
      throw new Error('Server returned HTML instead of JSON. Refresh the app and sign in again. If it persists, the API route is failing before it can return JSON.');
    }

    throw new Error(normalized.slice(0, 200) || 'Unexpected response from server');
  }
}