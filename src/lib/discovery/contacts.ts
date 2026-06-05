/**
 * Prospect-contact view model + pure helpers for the discovery contact waterfall.
 * The DB/HubSpot queries live in the server action (actions.ts); this file holds
 * the testable, I/O-free pieces.
 */
import type { InferConfidence } from './email-pattern';

/** A contact surfaced for a prospect, with a real or inferred email. */
export interface ProspectContact {
  name: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  /** Real address (records/HubSpot) or inferred; null when we have no basis. */
  email: string | null;
  /** 'known' = real address from our records; otherwise the inference band. */
  confidence: InferConfidence | 'known';
  emailBasis?: string;
  source: 'records' | 'hubspot' | 'added' | 'research';
  linkedinUrl?: string;
  /** Why this person is relevant (from web research). */
  reason?: string;
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com',
  'me.com', 'live.com', 'msn.com', 'comcast.net', 'verizon.net', 'protonmail.com',
]);

/** Most common corporate email domain in a list, ignoring free providers. */
export function dominantDomain(emails: string[]): string | null {
  const counts = new Map<string, number>();
  for (const e of emails) {
    const d = e.split('@')[1]?.toLowerCase().trim();
    if (!d || FREE_EMAIL_DOMAINS.has(d)) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let best: string | null = null;
  let max = 0;
  for (const [d, n] of counts) {
    if (n > max) { max = n; best = d; }
  }
  return best;
}

const REAL_EMAIL = new Set<ProspectContact['confidence']>(['known']);

function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
}

/** Rank a contact for dedupe: real email + better source wins. */
function rank(c: ProspectContact): number {
  let score = 0;
  if (REAL_EMAIL.has(c.confidence)) score += 100;
  else if (c.email) score += 10;
  if (c.source === 'records') score += 3;
  else if (c.source === 'hubspot') score += 2;
  return score;
}

/** Collapse duplicate people by name, keeping the highest-ranked record. */
export function dedupeContacts(contacts: ProspectContact[]): ProspectContact[] {
  const byKey = new Map<string, ProspectContact>();
  for (const c of contacts) {
    const key = nameKey(c.name);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing || rank(c) > rank(existing)) byKey.set(key, c);
  }
  return [...byKey.values()];
}
