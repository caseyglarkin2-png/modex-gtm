const WARM_INTRO_ONLY_ACCOUNTS = ['dannon', 'danone'];

export function isWarmIntroOnlyAccount(accountName: string): boolean {
  const normalized = accountName.trim().toLowerCase();
  return WARM_INTRO_ONLY_ACCOUNTS.some((name) => normalized.includes(name));
}

export function assertColdOutreachAllowed(accountName: string): void {
  if (isWarmIntroOnlyAccount(accountName)) {
    throw new Error('Dannon is warm-intro only via Mark Shaughnessy. Cold outreach actions are blocked.');
  }
}

export function sanitizeGeneratedCopy(content: string): string {
  return content
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s{3,}/g, '  ')
    .trim();
}

const LENGTH_BANDS: Record<string, [number, number]> = {
  dm: [15, 80],
  follow_up: [30, 120],
  email: [45, 170],
  call_script: [80, 300],
  meeting_prep: [120, 500],
  default: [45, 170],
};

export function scoreOutputQuality(content: string, contentType?: string): { score: number; flags: string[] } {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const sentences = content
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : words.length;
  const hasQuestion = content.includes('?');
  const hasEmDash = /\u2014/.test(content);
  const hasForbiddenClaim = /ship\s+50%\s+more|50%\s+more\s+freight/i.test(content);

  const [minWords, maxWords] = LENGTH_BANDS[contentType ?? 'default'] ?? LENGTH_BANDS.default;

  let score = 60;
  const flags: string[] = [];

  if (words.length >= minWords && words.length <= maxWords) score += 15;
  else flags.push(`Length outside ideal range (${minWords}-${maxWords} words).`);

  if (avgSentenceLength <= 20) score += 10;
  else flags.push('Sentence length may be too long for natural voice.');

  if (hasQuestion) score += 10;
  else flags.push('No direct CTA question detected.');

  if (hasEmDash) {
    score -= 10;
    flags.push('Contains em dash. Replace with periods or commas.');
  }

  if (hasForbiddenClaim) {
    score -= 20;
    flags.push('Contains forbidden 50% volume claim.');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    flags,
  };
}
