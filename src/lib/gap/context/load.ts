/**
 * Load ONE account's context (context/context.ts) from the stores the app already keeps. Every read is soft: a
 * failed read leaves that slot empty and says nothing, it never fails the page (the account intelligence and the
 * motion are read elsewhere and fail closed on their own). Nothing is written.
 */
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { isHumanTraffic } from '@/lib/microsites/bot-detection';
import { loadDemoPack } from '@/lib/demo/load-pack';
import { getMeetingBriefByAccount } from '@/lib/data';
import { normalizeCompanyName } from '../identity/normalize';
import { restrictionFor } from '../policy/restriction';
import { accountSlug } from '../account-intel/href';
import type { AccountInputs } from '../account-intel/build';
import { projectAssets, projectEngagement, projectHistory, projectRelationship, type AccountContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const soft = <T,>(p: Promise<T> | undefined, fallback: T): Promise<T> => (p ? p.catch(() => fallback) : Promise.resolve(fallback));

/** Load and project in one call (the reads need only the account name; see fetchAccountContextRows). */
export async function loadAccountContext(prisma: PrismaLike, inputs: Pick<AccountInputs, 'account' | 'aliases' | 'domains' | 'memberships'>, now: Date): Promise<AccountContext> {
  return projectAccountContext(await fetchAccountContextRows(prisma, inputs.account.name), inputs, now);
}

type ContextRows = Awaited<ReturnType<typeof fetchAccountContextRows>>;

/** Every context read, by account name only: start it alongside the account inputs (V2 speed). Soft. */
export async function fetchAccountContextRows(prisma: PrismaLike, name: string) {
  const where = { account_name: name };
  const [account, personas, meetings, emails, activities, captures, outcomes, sends, sessions, generated] = await Promise.all([
    soft(prisma.account?.findUnique({ where: { name }, select: { best_intro_path: true, owner: true, next_action: true, updated_at: true } }), null as Row | null),
    soft(prisma.persona?.findMany({ where, select: { name: true, intro_route: true, intro_path: true }, take: 60 }), [] as Row[]),
    soft(prisma.meeting?.findMany({ where, select: { meeting_status: true, meeting_date: true, objective: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 20 }), [] as Row[]),
    soft(prisma.emailLog?.findMany({ where, select: { to_email: true, subject: true, sent_at: true, reply_count: true }, orderBy: { sent_at: 'desc' }, take: 40 }), [] as Row[]),
    soft(prisma.activity?.findMany({ where, select: { activity_type: true, outcome: true, notes: true, next_step: true, activity_date: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 120 }), [] as Row[]),
    soft(prisma.mobileCapture?.findMany({ where, select: { title: true, intent: true, next_step: true, captured_at: true }, orderBy: { captured_at: 'desc' }, take: 20 }), [] as Row[]),
    soft(prisma.operatorOutcome?.findMany({ where, select: { outcome_label: true, notes: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 20 }), [] as Row[]),
    soft(prisma.sendJobRecipient?.findMany({ where: { ...where, sent_at: { not: null } }, select: { to_email: true, sent_at: true, generated_content_id: true }, orderBy: { sent_at: 'desc' }, take: 40 }), [] as Row[]),
    soft(prisma.micrositeEngagement?.findMany({ where, select: { path: true, sections_viewed: true, cta_ids: true, scroll_depth_pct: true, duration_seconds: true, updated_at: true, metadata: true }, orderBy: { updated_at: 'desc' }, take: 400 }), [] as Row[]),
    soft(prisma.generatedContent?.findMany({ where, select: { id: true, content_type: true, version: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 60 }), [] as Row[]),
  ]);
  const micro = (() => {
    const k = normalizeCompanyName(name);
    const own = getAllAccountMicrositeData().filter((m) => normalizeCompanyName(m.accountName) === k || (!!m.hubspotName && normalizeCompanyName(m.hubspotName) === k));
    return own.length === 1 ? own[0] : null;
  })();
  const demoSlug = micro?.slug ?? accountSlug(name);
  const pack = await loadDemoPack(demoSlug).catch(() => null);
  return { name, account, personas, meetings, emails, activities, captures, outcomes, sends, sessions, generated, micro, demoSlug, hasPack: !!pack };
}

/** Shape the rows into the account context (pure). */
export function projectAccountContext(rows: ContextRows, inputs: Pick<AccountInputs, 'account' | 'aliases' | 'domains' | 'memberships'>, now: Date): AccountContext {
  const { name, account, personas, meetings, emails, activities, captures, outcomes, sends, sessions, generated, micro, demoSlug, hasPack } = rows;
  const restriction = restrictionFor({ name, aliases: inputs.aliases, domains: inputs.domains });
  return {
    relationship: projectRelationship({ restriction, account: account as Row | null, personas: personas as Row[] as never, memberships: inputs.memberships, meetings: meetings as never, emails: emails as never, now }),
    engagement: projectEngagement((sessions as Row[]).map((s) => ({ path: s.path, sections_viewed: s.sections_viewed ?? [], cta_ids: s.cta_ids ?? [], scroll_depth_pct: s.scroll_depth_pct ?? 0, duration_seconds: s.duration_seconds ?? 0, updated_at: s.updated_at, human: isHumanTraffic(s.metadata) })), now),
    history: projectHistory({ activities: activities as never, emails: emails as never, meetings: meetings as never, captures: captures as never, outcomes: outcomes as never, sends: sends as never, now }),
    assets: projectAssets({ generated: generated as never, sends: sends as never, micrositeSlug: micro?.slug ?? null, demoSlug: hasPack ? demoSlug : null, legacyMeetingBrief: getMeetingBriefByAccount(name) ? `/briefs/${accountSlug(name)}` : null, accountName: name }),
    legacyNote: account?.next_action?.trim() ? { text: String(account.next_action).trim(), at: account.updated_at ? new Date(account.updated_at).toISOString() : null } : null,
  };
}
