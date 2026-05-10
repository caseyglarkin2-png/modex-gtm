import type { OnePagerData } from '@/components/ai/one-pager-preview';

// Detect named industry-event references (currently MODEX; extend if other shows are added)
const INDUSTRY_EVENT_PATTERN = /\bmodex\b/i;
const SPECULATIVE_PATTERN = /\b(attendance|attendee|signal|likely)\b/i;

function shouldSuppressPublicContext(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!INDUSTRY_EVENT_PATTERN.test(trimmed)) return false;
  return SPECULATIVE_PATTERN.test(trimmed);
}

export function sanitizePublicContext(value: string): string {
  return shouldSuppressPublicContext(value) ? '' : value.trim();
}

export function sanitizeOnePagerData(data: OnePagerData): OnePagerData {
  return {
    ...data,
    publicContext: sanitizePublicContext(data.publicContext),
  };
}
