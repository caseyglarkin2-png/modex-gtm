/**
 * POST /api/gap/signals   register a fact (a prospecting signal)
 *
 * GAP Prospecting OS, Sprint 2, S2-T10. Session-only: a fact typed by an
 * operator carries the operator's email as `registeredBy`, and there is no
 * agent path here (agents register through the adapters and the registry).
 *
 * Gate: `assertGapEnabled('GAP_HYPOTHESIS_ENABLED')` first; off means 404
 * with the skip payload for every caller (see ../hypotheses/route.ts).
 *
 * Two kinds:
 *   operator_knowledge   `text` required. Goes through `fromOperatorKnowledge`,
 *                        so `externalOk` is hard-wired false: first-party,
 *                        never quotable as public evidence. A blank text is
 *                        the adapter's `no_evidence_text` refusal (422).
 *   public               `url` required and must parse as http(s) (400 field
 *                        url) on a PUBLIC host: loopback, private ranges,
 *                        `.local`/`.internal` and `PRIVATE_FACT_HOSTS` answer
 *                        422 `private_host`; `type` intent or website_behavior
 *                        answers 422 `private_type` (R2-10). Registered as sourceKind `manual` with
 *                        sourceId `manual:<sha1(accountName + "\n" + url)>`
 *                        (R2-9: keyed on the account too), `externalOk` true.
 *
 * The account must exist (404 account_not_found). 201 `{id, created}`;
 * `created` is false when the same source was already registered, because
 * a signal is a frozen fact and re-registration returns the existing row.
 */

import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { freshnessExpiresAt } from '@/lib/gap/signals/freshness';
import { clip, fromOperatorKnowledge, type ProspectingSignalInput } from '@/lib/gap/signals/projection';
import { registerSignal } from '@/lib/gap/signals/registry';
import { SIGNAL_TYPES, type SignalType } from '@/lib/gap/taxonomy';

export const dynamic = 'force-dynamic';

const PUBLIC_CONFIDENCE = 60;
const TITLE_MAX = 120;

const BodySchema = z.object({
  accountName: z.string().min(1),
  kind: z.enum(['operator_knowledge', 'public']),
  text: z.string().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  observedAt: z.string().optional(),
  type: z.enum(SIGNAL_TYPES).optional(),
  hubspotCompanyId: z.string().nullable().optional(),
  personaId: z.number().int().nullable().optional(),
});

type Body = z.infer<typeof BodySchema>;

function firstField(error: z.ZodError): string {
  return error.issues[0]?.path.map(String).join('.') || 'body';
}

function invalidBody(field: string) {
  return NextResponse.json({ error: 'invalid_body', field }, { status: 400 });
}

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

function sha1(value: string): string {
  return createHash('sha1').update(value).digest('hex');
}

/**
 * Hosts that can never be a PUBLIC fact (R2-10): our own properties and the
 * tools we read prospects through. A url on one of these is first-party
 * knowledge at best and private intent at worst; the operator branch is
 * the honest place for it. A host matches when it equals an entry or ends
 * with `.` + the entry.
 */
export const PRIVATE_FACT_HOSTS: readonly string[] = [
  'yardflow.ai',
  'freightroll.com',
  'hubspot.com',
  'app.hubspot.com',
  'docs.google.com',
  'drive.google.com',
];

/** Signal types a public fact may not carry: both name first-party behavior. */
const PRIVATE_FACT_TYPES: ReadonlySet<SignalType> = new Set<SignalType>(['intent', 'website_behavior']);

const PRIVATE_SUFFIXES = ['.local', '.internal', '.localhost'];

/** IPv4 loopback, RFC 1918 and link-local ranges. */
function isPrivateIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 127 || a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/** Loopback, private ranges, local suffixes and the own-domain list. */
export function isPrivateHost(hostname: string): boolean {
  let host = hostname.trim().toLowerCase();
  if (host.endsWith('.')) host = host.slice(0, -1);
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  if (!host) return true;
  if (host === 'localhost' || host === '::1' || host === '0:0:0:0:0:0:0:1') return true;
  if (isPrivateIpv4(host)) return true;
  if (PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  return PRIVATE_FACT_HOSTS.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

type HttpUrlResult = { ok: true; url: string } | { ok: false; reason: 'invalid_url' | 'private_host' };

/** The url when it parses with an http(s) scheme on a public host; the refusal reason otherwise. */
function httpUrl(raw: string | undefined): HttpUrlResult {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { ok: false, reason: 'invalid_url' };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { ok: false, reason: 'invalid_url' };
  if (isPrivateHost(parsed.hostname)) return { ok: false, reason: 'private_host' };
  return { ok: true, url: parsed.toString() };
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** `observedAt` as a Date: the provided value when it parses, `now` when absent, null when unparseable. */
function observedAtFrom(raw: string | undefined, now: Date): Date | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return now;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** A public fact typed by an operator: a URL the compiler may cite in outbound copy. */
function publicFactInput(body: Body, url: string, observedAt: Date, registeredBy: string): ProspectingSignalInput {
  const type: SignalType = body.type ?? 'manual_research';
  return {
    accountName: body.accountName.trim(),
    hubspotCompanyId: trimOrNull(body.hubspotCompanyId),
    personaId: body.personaId ?? null,
    sourceKind: 'manual',
    // Keyed on account + url, as the operator branch is (R2-9): one story
    // cited for two accounts is two facts, so the second account can never
    // link (and freeze) the first account's signal id.
    sourceId: `manual:${sha1(`${body.accountName.trim()}\n${url}`)}`,
    type,
    title: trimOrNull(body.title) ?? clip(url, TITLE_MAX),
    summary: null,
    sourceType: 'public_secondary',
    evidenceUrl: url,
    evidenceText: trimOrNull(body.excerpt),
    claimClass: null,
    externalOk: true,
    observedAt,
    confidence: PUBLIC_CONFIDENCE,
    freshnessExpiresAt: freshnessExpiresAt(type, observedAt),
    metadata: { by: registeredBy },
    registeredBy,
  };
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return invalidBody('body');
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return invalidBody(firstField(parsed.error));
  const body = parsed.data;

  const now = new Date();
  const observedAt = observedAtFrom(body.observedAt, now);
  if (!observedAt) return invalidBody('observedAt');

  let input: ProspectingSignalInput;
  if (body.kind === 'public') {
    const checked = httpUrl(body.url);
    if (!checked.ok) {
      if (checked.reason === 'private_host') return NextResponse.json({ error: 'private_host' }, { status: 422 });
      return invalidBody('url');
    }
    if (body.type && PRIVATE_FACT_TYPES.has(body.type)) return NextResponse.json({ error: 'private_type' }, { status: 422 });
    input = publicFactInput(body, checked.url, observedAt, email);
  } else {
    const text = body.text ?? '';
    const projected = fromOperatorKnowledge(
      {
        accountName: body.accountName,
        hubspotCompanyId: body.hubspotCompanyId ?? null,
        personaId: body.personaId ?? null,
        text,
        title: body.title,
        at: observedAt,
        // One operator typing the same fact for the same account is one fact.
        sourceId: `${email}:${sha1(`${body.accountName.trim()}\n${text.trim()}`)}`,
        by: email,
      },
      { registeredBy: email, now },
    );
    if (!projected.ok) return NextResponse.json({ error: projected.reason }, { status: 422 });
    input = projected.signal;
  }

  const account = await prisma.account.findUnique({ where: { name: input.accountName }, select: { name: true } });
  if (!account) return NextResponse.json({ error: 'account_not_found' }, { status: 404 });

  const registered = await registerSignal(prisma, input);
  return NextResponse.json({ id: registered.id, created: registered.created }, { status: 201 });
}
