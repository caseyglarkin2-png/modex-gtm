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
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const SINK_DEFAULT_DOMAINS = ['example.com', 'example.net', 'example.org'] as const;

export interface SinkConfig {
  dir: string;
  allowedDomains: string[];
}

/** The sink configuration, or null when the real transport is in force. */
export function sinkConfig(env: NodeJS.ProcessEnv = process.env): SinkConfig | null {
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
  const allowed = new Set(allowedDomains.map((d) => d.toLowerCase()));
  return all.filter((r) => !allowed.has(domainOf(r)));
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
  return record;
}
