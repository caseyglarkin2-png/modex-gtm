const EMAIL_PATTERN = /\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
const TOKEN_PATTERN = /\b(?:sk|pk|api|token|bearer)[-_A-Za-z0-9]{8,}\b/gi;

export function redactText(value: string): string {
  return value
    .replace(EMAIL_PATTERN, (_, local: string, domain: string) => `${local.slice(0, 2)}***@${domain}`)
    .replace(TOKEN_PATTERN, '[REDACTED_TOKEN]');
}

export function redactUnknown(value: unknown): unknown {
  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map((entry) => redactUnknown(entry));
  if (!value || typeof value !== 'object') return value;

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (/token|authorization|secret|password/i.test(key)) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = redactUnknown(entry);
  }
  return output;
}
