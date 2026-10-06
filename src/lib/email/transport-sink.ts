/**
 * TRANSPORT SINK (GAP OS execution recovery, R05, 2026-10-06).
 *
 * A controlled mail boundary for the end-to-end safety harness: with `GAP_SEND_TRANSPORT=sink`, every Gmail send
 * and draft that reaches the wire is written to a file under `GAP_SINK_DIR` instead of Google, AFTER every
 * application gate has run (human one-to-one proof, the warm-intro restriction, the autonomy kill-switch, the
 * cross-plane suppression contract, the daily cap). The sink refuses, before any network access, a recipient whose
 * domain is not on `GAP_SINK_ALLOWED_DOMAINS` (default: the reserved `example.com`, `example.net`, `example.org`),
 * so a harness can never mail a real address by mistake, and it records every attempt (allowed or refused) in the
 * same directory, so a test can prove what was tried.
 *
 * Off by default. Any value other than exactly `sink` means the real transport. In production the variable is
 * unset, so this module never runs there. Pure apart from the file write.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const SINK_DEFAULT_DOMAINS = ['example.com', 'example.net', 'example.org'] as const;

export interface SinkConfig {
  dir: string;
  allowedDomains: string[];
}

/** The sink configuration, or null when the real transport is in force. */
export function sinkConfig(env: Record<string, string | undefined> = process.env): SinkConfig | null {
  if ((env.GAP_SEND_TRANSPORT ?? '').trim() !== 'sink') return null;
  const dir = (env.GAP_SINK_DIR ?? '').trim();
  if (!dir) throw new Error('GAP_SEND_TRANSPORT=sink needs GAP_SINK_DIR');
  const allowed = (env.GAP_SINK_ALLOWED_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return { dir, allowedDomains: allowed.length ? allowed : [...SINK_DEFAULT_DOMAINS] };
}

export class SinkRefusal extends Error {
  constructor(
    public readonly recipient: string,
    public readonly allowedDomains: readonly string[],
  ) {
    super(`transport sink refused ${recipient}: not on the allowed test domains (${allowedDomains.join(', ')})`);
  }
}

const domainOf = (address: string): string => {
  const m = /<([^>]+)>/.exec(address);
  const bare = (m ? m[1] : address).trim().toLowerCase();
  const at = bare.lastIndexOf('@');
  return at >= 0 ? bare.slice(at + 1) : '';
};

/** Every recipient not on the allowed domains, in order. Pure. */
export function refusedRecipients(recipients: { to: string; cc?: string[]; bcc?: string }, allowedDomains: readonly string[]): string[] {
  const all = [recipients.to, ...(recipients.cc ?? []), ...(recipients.bcc ? [recipients.bcc] : [])].filter((r) => typeof r === 'string' && r.trim());
  const allowed = allowedDomains.map((d) => d.toLowerCase());
  // A subdomain of an allowed domain is allowed too: the reserved example.com space includes its subdomains.
  const ok = (domain: string) => allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
  return all.filter((r) => !ok(domainOf(r)));
}

export interface SinkRecord {
  kind: 'send' | 'draft' | 'draft_send';
  at: string;
  outcome: 'written' | 'refused';
  to: string;
  cc: string[];
  bcc: string | null;
  subject: string | null;
  purpose: string | null;
  /** The exact message as it would have gone to Gmail (base64url MIME), when written. */
  raw: string | null;
  refused: string[];
  id: string;
}

let seq = 0;

/**
 * Write the attempt to the sink and return its receipt, or throw `SinkRefusal` for a non-test recipient (the attempt
 * is still recorded, outcome `refused`, so the harness can prove the refusal happened before any network call).
 */
export function sinkAttempt(
  cfg: SinkConfig,
  kind: SinkRecord['kind'],
  input: { to: string; cc?: string[]; bcc?: string; subject?: string | null; purpose?: string | null; raw?: string | null },
  now: Date = new Date(),
): SinkRecord {
  mkdirSync(cfg.dir, { recursive: true });
  const refused = refusedRecipients({ to: input.to, cc: input.cc, bcc: input.bcc }, cfg.allowedDomains);
  seq += 1;
  const id = `sink-${now.getTime()}-${process.pid}-${seq}`;
  const record: SinkRecord = {
    kind,
    at: now.toISOString(),
    outcome: refused.length ? 'refused' : 'written',
    to: input.to,
    cc: input.cc ?? [],
    bcc: input.bcc ?? null,
    subject: input.subject ?? null,
    purpose: input.purpose ?? null,
    raw: refused.length ? null : (input.raw ?? null),
    refused,
    id,
  };
  writeFileSync(join(cfg.dir, `${id}.json`), JSON.stringify(record, null, 2));
  if (refused.length) throw new SinkRefusal(refused[0], cfg.allowedDomains);
  // R43 harness fault (sink only, never production): the message LEFT (it is in the sink's Sent) and then the answer
  // was lost, the way a provider timeout after acceptance looks. The send path must leave its claim open (outcome
  // unknown), never resend, and reconcile from Sent.
  if (kind === 'send' && (process.env.GAP_SINK_FAULT ?? '').trim() === 'timeout_after_write') {
    throw new Error('Gmail send answer lost after the request went out (timeout; sink fault)');
  }
  return record;
}

const addressOf = (a: string): string => {
  const m = /<([^>]+)>/.exec(a);
  return (m ? m[1] : a).trim().toLowerCase();
};

/**
 * The sink as the harness mailbox's SENT folder: what left through it to `recipient` in the epoch window (seconds),
 * newest first. The seller-draft gate reads Gmail Sent for a first touch GAP did not record; under the sink that read
 * must see what the sink sent, so a harness first touch is reconciled the same way a real one is.
 */
export function sinkSentTo(cfg: SinkConfig, recipient: string, afterEpoch: number, beforeEpoch: number): Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string }> {
  if (!existsSync(cfg.dir)) return [];
  const want = addressOf(recipient);
  const out: Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string }> = [];
  for (const f of readdirSync(cfg.dir)) {
    if (!f.endsWith('.json')) continue;
    let rec: SinkRecord | null = null;
    try {
      rec = JSON.parse(readFileSync(join(cfg.dir, f), 'utf8')) as SinkRecord;
    } catch {
      rec = null;
    }
    if (!rec || rec.outcome !== 'written' || (rec.kind !== 'send' && rec.kind !== 'draft_send')) continue;
    if (addressOf(rec.to) !== want) continue;
    const at = new Date(rec.at);
    const epoch = Math.floor(at.getTime() / 1000);
    if (epoch < afterEpoch || epoch >= beforeEpoch) continue;
    out.push({ id: rec.id, threadId: null, internalDate: at, to: rec.to, subject: rec.subject ?? '' });
  }
  return out.sort((a, b) => b.internalDate.getTime() - a.internalDate.getTime());
}
