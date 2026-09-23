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
 *                        url). Registered as sourceKind `manual` with
 *                        sourceId `manual:<sha1(url)>`, `externalOk` true.
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

/** The url when it parses with an http(s) scheme, else null. */
function httpUrl(raw: string | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
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
    sourceId: `manual:${sha1(url)}`,
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
    const url = httpUrl(body.url);
    if (!url) return invalidBody('url');
    input = publicFactInput(body, url, observedAt, email);
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
