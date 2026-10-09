/**
 * SENDING THE MORNING BRIEFING, once (X05b, GAP OS sales execution engine, 2026-10-08). Server only; called by the
 * hourly cron /api/cron/gap-briefing.
 *
 * Order of business, pinned by tests/unit/gap/briefing-send.test.ts:
 *   1. no briefing address, or the New York hour has not come: skip in words, nothing claimed
 *   2. the day already sent (a `briefing.sent` row): skip `already_sent`
 *   3. BRIEFING_MAX_ATTEMPTS failures already: skip `abandoned` (the cron stays visible on health)
 *   4. before any retry, Sent is read for this day's briefing to the recipient: a send whose Gmail answer was lost
 *      but went is recorded from Sent (`recoveredFromSent`) and nothing is sent again (the unknown-send pattern)
 *   5. the day is CLAIMED (SystemConfig `gap:briefing:<day>`, the key is the primary key: a second create is P2002)
 *      BEFORE the send, so a double-fired tick or a second instance never mails twice
 *   6. the plan is the day snapshot (work/plan.ts), planned from the one day builder if absent; the links are signed
 *      (work/action-token.ts); the mail goes from the GAP identity as an internal OPERATOR_ALERT with Reply-To the
 *      GAP mailbox and `Auto-Submitted: auto-generated`, through `sendViaGmail` directly (never `sendEmail`, which
 *      logs every send to HubSpot)
 *   7. success: `briefing.sent` (day, to, Gmail ids, the day token, the item count); failure: `briefing.failed`
 *      (attempt, error), the claim released, the error rethrown so the cron records it and the next tick retries
 */
import { randomBytes } from 'node:crypto';
import type { GmailSender, GmailSendPayload } from '@/lib/email/gmail-sender';
import { signActionToken } from './action-token';
import { renderBriefing, type BriefingIntel } from './briefing';
import { loadIntelligence } from './intel';
import { dealCoverageFrom } from './deal-coverage';
import type { IdentityContext } from '../identity/resolve';
import { loadInDealsSummary, type InDealsSummary } from '../deals/in-deals';
import { accountHref } from '../account-intel/href';
import { loadAngles } from '../agents/develop-angle';
import { nyDay, nyDayAt } from './dates';
import { planDay, type DayPlan, type PlanItem, type PlanLoad } from './plan';
import type { SellerSettings } from './settings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const BRIEFING_SENT = 'briefing.sent' as const;
export const BRIEFING_FAILED = 'briefing.failed' as const;
export const BRIEFING_SUBJECT_TYPE = 'work_day' as const;
export const BRIEFING_MAX_ATTEMPTS = 3;
export const briefingClaimKey = (day: string) => `gap:briefing:${day}`;

export interface BriefingSendInput {
  now: Date;
  settings: SellerSettings;
  sender: GmailSender;
  baseUrl: string;
  actionSecret: string | null;
  commandsEnabled: boolean;
  legacyDigest: boolean;
  /** The one day builder's day (work/load-day.ts) with the ready lane's decision ids, read only when no plan exists yet. */
  load: () => Promise<PlanLoad>;
  actor?: string;
  /** X22: an operator's explicit "send it again now" (the cron's `?resend=1` with the secret): past the hour, past already_sent, no day claim; the row says resend. Never the schedule's own path. */
  resend?: boolean;
}

export interface BriefingSendDeps {
  send: (payload: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>;
  /** I04: the intelligence reader (tests inject one). */
  intel?: (prisma: PrismaLike, now: Date) => Promise<BriefingIntel | null>;
  /** C01: the in-deals read the intelligence takes its deal coverage from (the day's own reader by default; tests inject one). */
  inDeals?: (prisma: PrismaLike, now: Date) => Promise<InDealsSummary | null>;
  listSent: (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string }>>;
}

export type BriefingSendResult =
  | { skipped: true; reason: 'no_briefing_address' | 'before_hour' | 'already_sent' | 'abandoned'; day: string; hourNy?: number; attempts?: number }
  | { sent: true; day: string; to: string; gmailMessageId: string | null; gmailThreadId: string | null; items: number; recoveredFromSent: boolean };

/** The New York wall-clock hour of an instant (0..23). */
export function nyHour(t: Date): number {
  const h = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }).format(t);
  return Number(h) % 24;
}

const dayLabelOf = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '');
};

/** The subject every briefing for `day` starts with, so Sent can be read for it. */
export const briefingSubjectPrefix = (day: string) => `GAP today, ${dayLabelOf(day)}:`;

function links(input: BriefingSendInput, day: string) {
  const base = input.baseUrl.replace(/\/$/, '');
  const sign = (op: 'start' | 'open' | 'decide', item?: string) => (input.actionSecret ? signActionToken({ op, day, ...(item ? { item } : {}) }, { secret: input.actionSecret, now: input.now }) : null);
  const start = sign('start');
  return {
    start: start ? `${base}/gap/start?t=${encodeURIComponent(start)}` : `${base}/gap/`,
    work: `${base}/gap/`,
    item: (it: PlanItem) => {
      const t = sign('open', it.token);
      return t ? `${base}/gap/item?t=${encodeURIComponent(t)}` : `${base}${it.href}`;
    },
    // I04: a decision from the inbox, signed; unsigned links are never minted (the item then points at Work).
    decide: (key: string, decision: string) => {
      const t = sign('decide', `${key}|${decision}`);
      return t ? `${base}/gap/decide?t=${encodeURIComponent(t)}` : null;
    },
    account: (name: string) => `${base}${accountHref(name)}/`,
    // C32: the deal brief for an item at an account with an open deal.
    deal: (name: string) => `${base}${accountHref(name)}/?view=brief`,
  };
}

/** I04: the day's intelligence with the prepared angles, for the briefing. */
export async function defaultIntel(prisma: PrismaLike, now: Date, deps: Pick<BriefingSendDeps, 'inDeals'> & { identity?: IdentityContext | null } = {}): Promise<BriefingIntel> {
  // C01: the same complete-or-unavailable deal snapshot the day builds, so the email never says "no deal" on an unread CRM.
  const summary = await (deps.inDeals ?? ((p: PrismaLike, n: Date) => loadInDealsSummary(p, { now: n })))(prisma, now).catch(() => null);
  const x = await loadIntelligence(prisma, { now, coverage: dealCoverageFrom(summary), ...(deps.identity !== undefined ? { identity: deps.identity } : {}) });
  const keys = [...x.signals, ...x.triggers, ...x.people].map((i) => i.key);
  const angles = await loadAngles(prisma, { keys, now });
  return { ...x, angles: Object.fromEntries([...angles.entries()].map(([k, a]) => [k, { whyItMatters: a.whyItMatters, starters: a.starters, peopleNamed: a.peopleNamed.map((p) => ({ name: p.name, title: p.title })), proposedAction: a.proposedAction }])) };
}

async function audit(prisma: PrismaLike, kind: string, actor: string, day: string, payload: Record<string, unknown>) {
  await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: BRIEFING_SUBJECT_TYPE, subject_id: day, payload } });
}

export async function sendMorningBriefing(prisma: PrismaLike, input: BriefingSendInput, deps: BriefingSendDeps): Promise<BriefingSendResult> {
  const actor = input.actor ?? 'cron:gap-briefing';
  const day = nyDay(input.now);
  const to = input.settings.briefingTo;
  if (!to) return { skipped: true, reason: 'no_briefing_address', day };
  const hourNy = nyHour(input.now);
  if (!input.resend && hourNy < input.settings.briefingHourNy) return { skipped: true, reason: 'before_hour', day, hourNy };

  const sentRow = input.resend ? null : await prisma.gapAuditEvent.findFirst({ where: { kind: BRIEFING_SENT, subject_type: BRIEFING_SUBJECT_TYPE, subject_id: day } });
  if (sentRow) return { skipped: true, reason: 'already_sent', day };
  const attempts: number = input.resend ? 0 : await prisma.gapAuditEvent.count({ where: { kind: BRIEFING_FAILED, subject_type: BRIEFING_SUBJECT_TYPE, subject_id: day } });

  // A retry (or an abandoned day) first asks Sent: did an earlier attempt go out although its answer was lost?
  if (attempts > 0) {
    const dayStart = Math.floor(nyDayAt(day, 0).getTime() / 1000);
    const nowS = Math.floor(input.now.getTime() / 1000) + 60;
    const prefix = briefingSubjectPrefix(day);
    const found = (await deps.listSent(to, dayStart, nowS).catch(() => [])).find((m) => m.to.toLowerCase().includes(to.toLowerCase()) && m.subject.startsWith(prefix));
    if (found) {
      await claim(prisma, day, { recoveredFromSent: true, gmailMessageId: found.id });
      const plan = await planDay(prisma, { now: input.now, load: input.load }, actor);
      await audit(prisma, BRIEFING_SENT, actor, day, { to, gmailMessageId: found.id, gmailThreadId: found.threadId, recoveredFromSent: true, items: plan.items.length, dayToken: tokenFromSubject(found.subject) });
      return { sent: true, day, to, gmailMessageId: found.id, gmailThreadId: found.threadId, items: plan.items.length, recoveredFromSent: true };
    }
  }
  if (attempts >= BRIEFING_MAX_ATTEMPTS) return { skipped: true, reason: 'abandoned', day, attempts };

  if (!input.resend && !(await claim(prisma, day, { claimedAt: input.now.toISOString() }))) return { skipped: true, reason: 'already_sent', day };

  try {
    const plan: DayPlan = await planDay(prisma, { now: input.now, load: input.load }, actor);
    const dayToken = randomBytes(12).toString('hex');
    // I04: the intelligence, read soft (a failure never withholds the briefing).
    const intel: BriefingIntel | null = await (deps.intel ?? ((p: PrismaLike, n: Date) => defaultIntel(p, n, deps)))(prisma, input.now).catch(() => null);
    const rendered = renderBriefing({ plan, dayToken, links: links(input, day), commandsEnabled: input.commandsEnabled, legacyDigest: input.legacyDigest, intel, resend: input.resend === true }, input.now);
    const res = await deps.send({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      sender: input.sender,
      purpose: 'OPERATOR_ALERT',
      replyTo: input.sender.userEmail,
      headers: { 'Auto-Submitted': 'auto-generated', 'X-GAP-Day': day },
    });
    // A fresh Gmail message's thread id is its own id; a provider that answers none (the harness sink) is read the same way.
    await audit(prisma, BRIEFING_SENT, actor, day, { to, gmailMessageId: res.id, resend: input.resend === true, gmailThreadId: res.threadId ?? res.id, dayToken, items: plan.items.length, recoveredFromSent: false });
    return { sent: true, day, to, gmailMessageId: res.id, gmailThreadId: res.threadId ?? res.id, items: plan.items.length, recoveredFromSent: false };
  } catch (err) {
    await audit(prisma, BRIEFING_FAILED, actor, day, { to, attempt: attempts + 1, error: (err instanceof Error ? err.message : String(err)).slice(0, 500) }).catch(() => undefined);
    await prisma.systemConfig.delete({ where: { key: briefingClaimKey(day) } }).catch(() => undefined);
    throw err;
  }
}

/** The day claim: true when this call took it; false when it already stood (P2002) or could not be written (fail closed). */
async function claim(prisma: PrismaLike, day: string, value: Record<string, unknown>): Promise<boolean> {
  try {
    await prisma.systemConfig.create({ data: { key: briefingClaimKey(day), value: JSON.stringify(value) } });
    return true;
  } catch {
    return false;
  }
}

const tokenFromSubject = (subject: string): string | null => /\[GAP#([a-f0-9]+)\]/.exec(subject)?.[1] ?? null;
