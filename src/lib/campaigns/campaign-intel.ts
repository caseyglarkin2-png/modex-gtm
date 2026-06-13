/**
 * Allentown Tour - campaign intelligence + action layer (Phase 5b).
 *
 * Pure, deterministic, unit-tested. Turns what we already hold - the canonical
 * persons/accounts view, the campaign's EmailLog / DraftQueueItem ledger, and
 * the discovery corridor worklist - into the single thing this surface exists to
 * answer: "what is the highest-leverage thing I can do right now to fill the
 * live Primo Brands tour in Breinigsville, PA."
 *
 * Nothing here reaches the network or Prisma. The server component maps its rows
 * into the small plain inputs below and calls these functions; missing sources
 * yield empty intel and the page still renders.
 *
 * Casey's voice in every action string: no em dashes, no filler, "yards" always
 * plural.
 */

import type { ViewContact, ViewAccount } from './canonical-view';

/* ─────────────────────────────────────────────────────────────────────────
 * Per-campaign config. The intel layer is campaign-agnostic: the action copy,
 * the funnel math, and the ranking carry no Allentown literals. Everything that
 * IS campaign-specific lives here, so the same engine drives a Breinigsville
 * tour today and any other date / region / event tomorrow. Pass a CampaignConfig
 * to buildCampaignIntel; the constants below are the Allentown defaults.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * An account Casey invited manually from his own Gmail, outside the canonical
 * committee. These do not come back from the canonical endpoint, so we carry
 * them here as first-class watched accounts: the Gmail scan lights up their
 * invited/replied state and the note rides along in the UI.
 */
export interface WatchedAccount {
  name: string;
  domain: string;
  note: string;
}

export interface CampaignConfig {
  /** The DraftQueueItem/EmailLog cohort label, e.g. 'allentown-tour'. Roots the hrefs. */
  tag: string;
  /** Route the command center lives at, e.g. '/campaigns/allentown'. */
  basePath: string;
  /** The live site / event being filled, e.g. 'Primo Brands, Breinigsville, PA'. */
  liveSite: string;
  /** Short host phrase used in reply copy, e.g. 'Breinigsville'. */
  hostPhrase: string;
  /** The tour date, spoken form, e.g. 'June 29th'. Used in reply copy. */
  tourDate: string;
  /** Key-account fill target. EDIT to change the goal of the surface. */
  target: number;
  /**
   * Accounts invited manually outside the committee, watched via the Gmail scan.
   * Their domains join the scan watch list; their state renders as invited/warm.
   */
  watchedAccounts: WatchedAccount[];
  /**
   * The canonical campaign account domains the Gmail scan watches for invite
   * truth. Casey sends manual invites from his own Gmail that never hit the
   * Outbox, so an outbound to any of these = an invite even with no EmailLog row.
   */
  accountDomains: string[];
}

/** Twelve key accounts is the fill target for the live Breinigsville tour. */
export const ALLENTOWN_TOUR_TARGET = 12;

/** The five canonical campaign account domains the Gmail scan watches. */
export const ALLENTOWN_ACCOUNT_DOMAINS = [
  'unfi.com',
  'homedepot.com',
  'walgreens.com',
  'keurigdrpepper.com',
  'rednersmarkets.com',
];

/**
 * Accounts Casey invited manually from his own Gmail, outside the canonical
 * committee. Boston Beer is confirming Monday; NFI is warm.
 */
export const ALLENTOWN_WATCHED_ACCOUNTS: WatchedAccount[] = [
  { name: 'Boston Beer Company', domain: 'bostonbeer.com', note: 'confirming Monday' },
  { name: 'NFI', domain: 'nfiindustries.com', note: 'warm' },
];

/** The Allentown defaults - one literal place, easy to fork for the next campaign. */
export const ALLENTOWN_CAMPAIGN: CampaignConfig = {
  tag: 'allentown-tour',
  basePath: '/campaigns/allentown',
  liveSite: 'Primo Brands, Breinigsville, PA',
  hostPhrase: 'Breinigsville',
  tourDate: 'June 29th',
  target: ALLENTOWN_TOUR_TARGET,
  watchedAccounts: ALLENTOWN_WATCHED_ACCOUNTS,
  accountDomains: ALLENTOWN_ACCOUNT_DOMAINS,
};

/**
 * The full set of domains the Gmail scan watches for a campaign: the canonical
 * account domains plus the watched-account domains. Deduped, lowercased.
 */
export function watchedScanDomains(config: CampaignConfig): string[] {
  const all = [
    ...config.accountDomains,
    ...config.watchedAccounts.map((w) => w.domain),
  ].map((d) => d.trim().toLowerCase());
  return [...new Set(all)].filter(Boolean);
}

/** How long a sent-but-unopened note stays "waiting" before it reads as cooling. */
export const COOLING_AFTER_DAYS = 2;

/* ─── Invite-truth indicator (the UI chip state) ─────────────────────────── */

export type InviteState = 'replied' | 'invited' | 'none';

export interface InviteIndicator {
  state: InviteState;
  label: string;
  /** Where the truth came from: 'gmail' (manual send), 'outbox' (DraftQueueItem), or 'none'. */
  via: 'gmail' | 'outbox' | 'none';
  /** True when the only evidence is the Gmail scan (a manual invite, no Outbox send). */
  gmailOnly: boolean;
}

/**
 * The single invite-truth read for a person or account: have they ACTUALLY been
 * invited (across the Outbox AND Casey's Gmail), and did they reply. The UI keys
 * its "Invited (email) / Replied / Not yet invited" chip + Gmail source chip off
 * this. `log` is the matched Outbox EmailLog (or null); `invite` is the Gmail
 * truth for the account domain (or null).
 */
export function inviteIndicator(
  log: CampaignEmailLog | null,
  invite: InviteTruthInput | null,
): InviteIndicator {
  const outboxSent = !!log && (log.status === 'sent' || log.status === 'delivered' || log.sentAt != null || (log.openCount ?? 0) > 0);
  const outboxReplied = (log?.replyCount ?? 0) > 0;
  const gmailInvited = !!invite?.invitedAt;
  const gmailReplied = !!invite?.repliedAt;

  if (outboxReplied || gmailReplied) {
    return {
      state: 'replied',
      label: 'Replied',
      via: outboxReplied ? 'outbox' : 'gmail',
      gmailOnly: gmailReplied && !outboxReplied,
    };
  }
  if (outboxSent || gmailInvited) {
    const gmailOnly = gmailInvited && !outboxSent;
    return {
      state: 'invited',
      label: gmailOnly ? 'Invited (email)' : 'Invited',
      via: gmailOnly ? 'gmail' : 'outbox',
      gmailOnly,
    };
  }
  return { state: 'none', label: 'Not yet invited', via: 'none', gmailOnly: false };
}

/* ─── Watched accounts (invited outside the committee) ───────────────────── */

export interface WatchedAccountView {
  name: string;
  domain: string;
  /** The config note, e.g. 'confirming Monday'. */
  note: string;
  /** Strongest invite state from the Gmail scan for this domain. */
  indicator: InviteIndicator;
  /** Engagement temperature, so it sits in the same color key as the committee. */
  temp: Temperature;
  /** ISO of the invite / latest reply, for a relative-time read. */
  invitedAt?: string;
  repliedAt?: string;
  lastSubject?: string;
}

/**
 * Build the watched-account views (Boston Beer, NFI) from the config + the Gmail
 * scan. These are NOT canonical committee accounts, but Casey invited them by
 * hand, so they render as first-class invited/warm accounts. A Gmail reply makes
 * them WARM (a non-booked positive); an outbound makes them INVITED. Falling back
 * to the config note keeps them visibly invited/warm even before Gmail lights up,
 * since Casey told us their state ("confirming Monday" / "warm").
 */
export function watchedAccountViews(
  config: CampaignConfig,
  truthByDomain: Map<string, InviteTruthInput>,
): WatchedAccountView[] {
  return config.watchedAccounts.map((w) => {
    const domain = w.domain.trim().toLowerCase();
    const truth = truthByDomain.get(domain) ?? null;
    const indicator = inviteIndicator(null, truth);
    let temp: Temperature;
    if (indicator.state === 'replied') temp = 'replied';
    else if (indicator.state === 'invited') temp = 'warm';
    else temp = 'warm'; // config says they are warm even before Gmail confirms
    return {
      name: w.name,
      domain,
      note: w.note,
      indicator: indicator.state === 'none'
        ? { state: 'invited', label: 'Invited (email)', via: 'gmail', gmailOnly: true }
        : indicator,
      temp,
      invitedAt: truth?.invitedAt,
      repliedAt: truth?.repliedAt,
      lastSubject: truth?.lastSubject,
    };
  });
}

/* ─── Inputs (plain, decoupled from Prisma) ──────────────────────────────── */

/**
 * The slice of a Gmail invite-truth scan this layer reads (mirrors
 * gmail-invite-scan.InviteTruth, kept structural so the intel module stays pure
 * and never imports the Gmail client / next-cache). The server resolves the
 * scan and hands the matched domain's truth in per person/account.
 */
export interface InviteTruthInput {
  domain: string;
  /** Any outbound OR inbound was seen for the domain (Casey has engaged it). */
  invited: boolean;
  invitedAt?: string;
  repliedAt?: string;
  lastSubject?: string;
  source: 'gmail';
}

/**
 * The slice of an EmailLog row this layer reads. The server component maps the
 * Prisma row to this shape (lowercased email, dates as ms epoch or null) so the
 * module never imports Prisma and stays trivially testable.
 */
export interface CampaignEmailLog {
  toEmail: string;
  status: string; // sent | delivered | opened | clicked | bounced
  openedAt: number | null;
  openCount: number;
  replyCount: number;
  sentAt: number | null;
}

/** The slice of a DraftQueueItem row this layer reads. */
export interface CampaignDraft {
  toEmail: string;
  personaName: string | null;
  status: string; // draft | approved | sending | sent | failed | skipped
}

/** A discovery corridor row, the fields nextAccountsToInvite ranks on. */
export interface DiscoveryIntelRow {
  name: string;
  cityState: string;
  tier: string;
  worklistScore: number;
  nearestPrimoDistance: number;
  /** Distinct known contacts attributed to this row (0 = a clean gap). */
  contactCount: number;
}

/* ─── Engagement temperature ─────────────────────────────────────────────── */

export type Temperature = 'replied' | 'warm' | 'sent' | 'cooling' | 'staged';

export interface EngagementHeat {
  temp: Temperature;
  /** 0..100 leverage-weighted heat. A ready-to-send (staged) outranks a cold (cooling). */
  score: number;
  /** One-line reason, in Casey's voice. */
  why: string;
}

const HEAT_SCORE: Record<Temperature, number> = {
  replied: 95,
  warm: 75,
  sent: 50,
  staged: 40, // a ready-to-send is higher leverage than a cold open: outranks cooling
  cooling: 30,
};

/** Did this person revisit yardflow.ai (a web re-engagement signal)? */
function hasWebRevisit(person: ViewContact): boolean {
  const web = person.web;
  if (!web) return false;
  // A returning visitor: more than one session, or a hot page on the record.
  if (web.sessions > 1) return true;
  return (web.pages || []).some((p) => p.hot);
}

/**
 * Classify a person's engagement into a temperature + heat score. `log` is the
 * matched EmailLog row for the person (or null when nothing has been sent yet).
 * `invite` is the Gmail invite-truth for the person's account domain, or null -
 * this is the Phase 5c truth layer: Casey invites people manually from his own
 * Gmail, so a Gmail outbound = an invite even with no Outbox send, and a Gmail
 * inbound (their reply) makes them warmer than the Outbox alone knows. Replied
 * beats warm beats sent (invited) beats staged.
 *
 * The current campaign state is all-staged (7 drafts, nothing sent) where Gmail
 * is silent, which this correctly reads as STAGED; the post-send and Gmail
 * branches are exercised by the tests.
 */
export function engagementTemperature(
  person: ViewContact,
  log: CampaignEmailLog | null,
  now: number = Date.now(),
  invite: InviteTruthInput | null = null,
): EngagementHeat {
  const draftStatus = (person.draft?.status || '').toLowerCase();
  const replied =
    (log?.replyCount ?? 0) > 0 ||
    draftStatus === 'replied' ||
    person.engagement === 'replied' ||
    !!invite?.repliedAt;
  if (replied) {
    const via = invite?.repliedAt && (log?.replyCount ?? 0) === 0 ? ' Reply landed in Gmail.' : '';
    return { temp: 'replied', score: HEAT_SCORE.replied, why: `Replied. Awaiting a human response.${via}` };
  }

  const opened =
    log?.openedAt != null ||
    log?.status === 'opened' ||
    (log?.openCount ?? 0) > 0 ||
    person.engagement === 'opened';
  const revisited = hasWebRevisit(person);
  if (opened || revisited) {
    return {
      temp: 'warm',
      score: HEAT_SCORE.warm,
      why: revisited && !opened ? 'Came back to yardflow.ai. Warm right now.' : 'Opened, no reply yet. Warm right now.',
    };
  }

  // Invited truth: an Outbox send OR a Gmail outbound to the account domain.
  const gmailInvitedAt = invite?.invitedAt ? Date.parse(invite.invitedAt) : null;
  const wasSent =
    log?.status === 'sent' ||
    log?.status === 'delivered' ||
    log?.sentAt != null ||
    (gmailInvitedAt != null && !Number.isNaN(gmailInvitedAt));
  if (wasSent) {
    // Prefer the Outbox sentAt; fall back to the Gmail invite timestamp.
    const sentAt = log?.sentAt ?? (gmailInvitedAt && !Number.isNaN(gmailInvitedAt) ? gmailInvitedAt : null);
    const viaGmail = log?.sentAt == null && gmailInvitedAt != null;
    const days = sentAt != null ? (now - sentAt) / 86_400_000 : 0;
    if (days >= COOLING_AFTER_DAYS) {
      return {
        temp: 'cooling',
        score: HEAT_SCORE.cooling,
        why: viaGmail
          ? `Invited by email ${Math.floor(days)}d ago, no reply. Cooling.`
          : `Sent ${Math.floor(days)}d ago, no open. Cooling.`,
      };
    }
    return {
      temp: 'sent',
      score: HEAT_SCORE.sent,
      why: viaGmail ? 'Invited by email, waiting on a reply.' : 'Sent, waiting on an open.',
    };
  }

  // draft / approved / nothing-sent
  return { temp: 'staged', score: HEAT_SCORE.staged, why: 'Drafted and ready to send.' };
}

/* ─── Outreach angle ─────────────────────────────────────────────────────── */

export type Angle = 'network' | 'cold-chain' | 'beverage' | 'local' | 'tour';

const ANGLE_ASSET: Record<Angle, string> = {
  network: 'ROI one-pager',
  'cold-chain': 'dwell-and-detention one-pager',
  beverage: 'beverage analog',
  local: 'neighborly walk-through',
  tour: 'live-yard tour invite',
};

/** Derive the outreach angle from a person's role + why text. */
export function deriveAngle(person: ViewContact): Angle {
  const hay = `${person.role || ''} ${person.why || ''}`.toLowerCase();
  if (/cold[\s-]?chain|refrigerat|frozen|temperature|perishable/.test(hay)) return 'cold-chain';
  if (/network|multi[\s-]?dc|optimi|corporate supply|footprint/.test(hay)) return 'network';
  if (/beverage|bottl|drink|brew|soda|water/.test(hay)) return 'beverage';
  if (/local|nearby|breinigsville|allentown|lehigh|neighbor/.test(hay)) return 'local';
  return 'tour';
}

export function angleAsset(angle: Angle): string {
  return ANGLE_ASSET[angle];
}

/* ─── Next best action (per person) ──────────────────────────────────────── */

export interface NextBestAction {
  verb: string;
  detail: string;
  /** 0..100 - how much filling the tour this action moves. */
  leverage: number;
  /** Where the action happens (read-only nav target). */
  targetHref: string;
}

function firstName(name: string): string {
  return (name || '').trim().split(/\s+/)[0] || name || 'them';
}

/**
 * The single next move for one person, given their temperature. Casey's voice,
 * no em dashes. targetHref points at where the action is taken (the Outbox / the
 * person's record), never sends anything from here.
 */
export function nextBestAction(
  person: ViewContact,
  heat: EngagementHeat,
  config: CampaignConfig = ALLENTOWN_CAMPAIGN,
  invite: InviteTruthInput | null = null,
): NextBestAction {
  const first = firstName(person.name);
  const angle = deriveAngle(person);
  const asset = angleAsset(angle);
  const subject = person.draft?.subject || `the ${config.hostPhrase} tour`;
  const href = `${config.basePath}#${person.id}`;
  // An invite that only exists in Gmail carries no open/click tracking, so "wait
  // on an open" is the wrong move. The honest move is to follow up by hand.
  const invitedByGmailOnly = !!invite?.invitedAt && !invite?.repliedAt;

  switch (heat.temp) {
    case 'replied':
      return {
        verb: `Respond to ${first}`,
        detail: `Lock a tour spot for ${config.tourDate}, name the ${config.hostPhrase} host.`,
        leverage: 95,
        targetHref: href,
      };
    case 'warm':
      return {
        verb: `Follow up with ${first} while warm`,
        detail: `Send the ${asset}, reference the open.`,
        leverage: 80,
        targetHref: href,
      };
    case 'cooling':
      return {
        verb: `Bump or pivot on ${first}`,
        detail: invitedByGmailOnly
          ? `You already emailed ${first}. Follow up or move to a second contact.`
          : `Resend or move to a second contact at ${person.accId}.`,
        leverage: 45,
        targetHref: href,
      };
    case 'sent':
      return invitedByGmailOnly
        ? {
            verb: `Follow up with ${first}`,
            detail: `Already invited by email. Nudge for a tour spot on ${config.tourDate}.`,
            leverage: 55,
            targetHref: href,
          }
        : {
            verb: `Hold on ${first}`,
            detail: 'Sent and inside the wait window. Let it breathe a day.',
            leverage: 25,
            targetHref: href,
          };
    case 'staged':
    default:
      return {
        verb: `Send ${first}'s staged draft`,
        detail: subject,
        leverage: 70,
        targetHref: href,
      };
  }
}

/* ─── Committee coverage ─────────────────────────────────────────────────── */

/** The committee a multi-DC shipper tour needs covered. */
export type CommitteeRole =
  | 'economic buyer'
  | 'regional P&L owner'
  | 'practitioner'
  | 'corporate supply chain';

export const TARGET_COMMITTEE_ROLES: CommitteeRole[] = [
  'economic buyer',
  'regional P&L owner',
  'practitioner',
  'corporate supply chain',
];

/** Map a person's title/role to the committee role they cover, if any. */
export function inferCommitteeRole(roleOrTitle: string): CommitteeRole | null {
  const t = (roleOrTitle || '').toLowerCase();
  // Practitioner: hands-on DC / logistics / yard / ops manager.
  if (/(dc|distribution|logistics|yard|warehouse|transportation|fleet|site)\s*(ops|operations)?\s*(manager|lead|supervisor|coordinator)/.test(t))
    return 'practitioner';
  if (/(manager|supervisor|coordinator|lead)\b/.test(t) && /(dc|distribution|logistics|yard|warehouse|transportation|site|plant)/.test(t))
    return 'practitioner';
  // Corporate supply chain.
  if (/(corporate|enterprise|head of|global|chief)\b.*(supply chain|logistics|scm)/.test(t)) return 'corporate supply chain';
  if (/\bcsco\b/.test(t)) return 'corporate supply chain';
  if (/supply chain/.test(t) && /(corporate|global|enterprise)/.test(t)) return 'corporate supply chain';
  // Economic buyer: VP / Director of Ops or Supply Chain.
  if (/(vp|vice president|svp|evp|chief)\b/.test(t) && /(ops|operations|supply chain|logistics|distribution)/.test(t))
    return 'economic buyer';
  if (/director\b/.test(t) && /(ops|operations|supply chain|logistics|distribution)/.test(t)) return 'economic buyer';
  // Regional P&L owner: regional / area / general manager.
  if (/(regional|area|division|district|general)\s+(vp|director|manager|gm)/.test(t)) return 'regional P&L owner';
  if (/\bgm\b|general manager/.test(t)) return 'regional P&L owner';
  return null;
}

export interface CommitteeCoverage {
  contacted: Array<{ name: string; role: string }>;
  /** The covered committee roles, in target order. */
  coveredRoles: CommitteeRole[];
  targetRoles: CommitteeRole[];
  missingRoles: CommitteeRole[];
  /** covered / target, 0..1. */
  coveragePct: number;
}

/**
 * Which of the target committee roles the contacted people at an account cover,
 * and which are still missing. persons are the campaign people already attached
 * to the account (its committee).
 */
export function committeeCoverage(account: ViewAccount, persons: ViewContact[]): CommitteeCoverage {
  const contacted = persons.map((p) => ({ name: p.name, role: p.title?.v && p.title.v !== '—' ? p.title.v : p.role }));
  const covered = new Set<CommitteeRole>();
  for (const p of persons) {
    const fromTitle = inferCommitteeRole(p.title?.v && p.title.v !== '—' ? p.title.v : '');
    const fromRole = inferCommitteeRole(p.role || '');
    const r = fromTitle ?? fromRole;
    if (r) covered.add(r);
  }
  const coveredRoles = TARGET_COMMITTEE_ROLES.filter((r) => covered.has(r));
  const missingRoles = TARGET_COMMITTEE_ROLES.filter((r) => !covered.has(r));
  return {
    contacted,
    coveredRoles,
    targetRoles: TARGET_COMMITTEE_ROLES,
    missingRoles,
    coveragePct: coveredRoles.length / TARGET_COMMITTEE_ROLES.length,
  };
}

/* ─── Next accounts to invite ────────────────────────────────────────────── */

export interface InviteCandidate {
  name: string;
  tier: string;
  score: number;
  distanceMi: number;
  cityState: string;
  reason: string;
}

function roundMi(mi: number): number {
  return Math.round(mi * 10) / 10;
}

/**
 * The top corridor prospects to invite next: zero known contacts, not already in
 * the campaign, ranked by worklistScore desc then distance to Primo asc.
 */
export function nextAccountsToInvite(
  discoveryRows: DiscoveryIntelRow[],
  alreadyInCampaign: Set<string>,
  limit: number,
): InviteCandidate[] {
  const inSet = new Set([...alreadyInCampaign].map((n) => n.trim().toLowerCase()));
  const candidates = discoveryRows
    .filter((r) => (r.contactCount ?? 0) === 0)
    .filter((r) => !inSet.has(r.name.trim().toLowerCase()))
    .sort((a, b) => {
      if (b.worklistScore !== a.worklistScore) return b.worklistScore - a.worklistScore;
      return a.nearestPrimoDistance - b.nearestPrimoDistance;
    })
    .slice(0, Math.max(0, limit));

  return candidates.map((r) => {
    const mi = roundMi(r.nearestPrimoDistance);
    return {
      name: r.name,
      tier: r.tier,
      score: r.worklistScore,
      distanceMi: mi,
      cityState: r.cityState,
      reason: `Tier ${r.tier}, ${mi} mi from the live site, no committee yet.`,
    };
  });
}

/* ─── Tour funnel ────────────────────────────────────────────────────────── */

export interface TourFunnel {
  target: number;
  confirmed: number;
  warm: number;
  invited: number;
  staged: number;
  /** Accounts still needing any first contact to reach the target. */
  toSource: number;
  /** (confirmed + warm) / target, 0..1. */
  pct: number;
}

/**
 * Roll the per-account state up against the tour target. An account is counted
 * at its strongest committee temperature.
 */
export function tourFunnel(
  accounts: ViewAccount[],
  accountTemps: Map<string, Temperature>,
  target: number = ALLENTOWN_CAMPAIGN.target,
): TourFunnel {
  let confirmed = 0;
  let warm = 0;
  let invited = 0;
  let staged = 0;
  let withAnyContact = 0;

  for (const a of accounts) {
    const temp = accountTemps.get(a.id);
    // booked / meeting stage on the account is a confirmed seat.
    const booked = a.stage === 'booked' || a.stage === 'meeting';
    if (booked) {
      confirmed += 1;
      withAnyContact += 1;
      continue;
    }
    if (temp === 'replied') {
      // a reply is the warmest non-booked state
      warm += 1;
      withAnyContact += 1;
    } else if (temp === 'warm') {
      warm += 1;
      withAnyContact += 1;
    } else if (temp === 'sent' || temp === 'cooling') {
      invited += 1;
      withAnyContact += 1;
    } else if (temp === 'staged') {
      staged += 1;
      withAnyContact += 1;
    }
  }

  const toSource = Math.max(0, target - withAnyContact);
  const pct = target > 0 ? (confirmed + warm) / target : 0;
  return { target, confirmed, warm, invited, staged, toSource, pct };
}

/* ─── The ranked action queue (the hero) ─────────────────────────────────── */

export type MoveKind = 'person' | 'committee' | 'invite';

export interface NextMove {
  kind: MoveKind;
  verb: string;
  why: string;
  leverage: number;
  targetHref: string;
  /** The account or person this move concerns, for the UI to key/group on. */
  refId: string;
}

export interface NextMovesInput {
  accounts: ViewAccount[];
  /** All campaign people. */
  persons: ViewContact[];
  /** person.id -> its EmailLog row (or null). */
  logByPersonId: Map<string, CampaignEmailLog | null>;
  /** account.id -> the people on its committee. */
  personsByAccountId: Map<string, ViewContact[]>;
  /** Ranked invite candidates from nextAccountsToInvite. */
  inviteCandidates: InviteCandidate[];
  /** person.id -> the Gmail invite-truth for its account domain (or null). */
  inviteByPersonId?: Map<string, InviteTruthInput | null>;
  config?: CampaignConfig;
  now?: number;
}

/**
 * Merge per-person next-best-actions, committee-gap moves, and next-account
 * invites into one leverage-sorted queue. This is the hero of the page: the
 * brain talking, top of the list = the single highest-leverage move right now.
 */
export function nextMoves(input: NextMovesInput): NextMove[] {
  const { accounts, persons, logByPersonId, personsByAccountId, inviteCandidates } = input;
  const config = input.config ?? ALLENTOWN_CAMPAIGN;
  const now = input.now ?? Date.now();
  const inviteByPersonId = input.inviteByPersonId ?? new Map<string, InviteTruthInput | null>();
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const moves: NextMove[] = [];

  // 1. Per-person actions. Invite truth (Casey's manual Gmail sends) flows into
  // both the temperature and the action copy, so an already-emailed person reads
  // "follow up", not "send the staged draft".
  for (const p of persons) {
    const log = logByPersonId.get(p.id) ?? null;
    const invite = inviteByPersonId.get(p.id) ?? null;
    const heat = engagementTemperature(p, log, now, invite);
    const action = nextBestAction(p, heat, config, invite);
    const acct = accountById.get(p.accId);
    moves.push({
      kind: 'person',
      verb: action.verb,
      why: `${action.detail}${acct ? ` (${acct.name})` : ''}`,
      leverage: action.leverage,
      targetHref: action.targetHref,
      refId: p.id,
    });
  }

  // 2. Committee-gap moves: an account in play that is missing committee roles.
  for (const a of accounts) {
    const committee = personsByAccountId.get(a.id) || [];
    if (committee.length === 0) continue; // not yet in play; the invite path covers it
    const cov = committeeCoverage(a, committee);
    if (cov.missingRoles.length === 0) continue;
    const missing = cov.missingRoles.slice(0, 2).join(', ');
    // More missing committee on a warmer account is higher leverage.
    const base = 40;
    const lift = cov.missingRoles.length * 5;
    moves.push({
      kind: 'committee',
      verb: `Source ${cov.missingRoles.length} more at ${a.name}`,
      why: `Missing ${missing}. ${cov.coveredRoles.length}/${cov.targetRoles.length} committee covered.`,
      leverage: Math.min(68, base + lift),
      targetHref: `/discovery?q=${encodeURIComponent(a.name)}`,
      refId: a.id,
    });
  }

  // 3. Next-account invites.
  inviteCandidates.forEach((c, i) => {
    // Top candidate leads at 60, each step down loses a little.
    const leverage = Math.max(40, 60 - i * 3);
    moves.push({
      kind: 'invite',
      verb: `Invite ${c.name}, ${c.distanceMi} mi`,
      why: `${c.reason} Open the discovery hand-off.`,
      leverage,
      targetHref: `/discovery?q=${encodeURIComponent(c.name)}`,
      refId: c.name,
    });
  });

  // Stable sort by leverage desc; equal leverage keeps insertion order (person >
  // committee > invite), which is the right tiebreak.
  return moves
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (b.m.leverage - a.m.leverage) || (a.i - b.i))
    .map(({ m }) => m);
}

/* ─── The bundle the server component hands the client ───────────────────── */

export interface CampaignIntel {
  funnel: TourFunnel;
  moves: NextMove[];
  /** person.id -> its engagement heat. */
  heatByPersonId: Record<string, EngagementHeat>;
  /** person.id -> its next best action. */
  actionByPersonId: Record<string, NextBestAction>;
  /** account.id -> its committee coverage. */
  coverageByAccountId: Record<string, CommitteeCoverage>;
  /** person.id -> its invite-truth indicator (Outbox + Gmail merged). */
  inviteByPersonId: Record<string, InviteIndicator>;
  /** The ranked accounts to invite next. */
  invites: InviteCandidate[];
  /** Boston Beer + NFI: invited outside the committee, Gmail-derived state. */
  watchedAccounts: WatchedAccountView[];
}

/** The empty intel - what the page renders when every source is missing. */
export function emptyIntel(config: CampaignConfig = ALLENTOWN_CAMPAIGN): CampaignIntel {
  return {
    funnel: { target: config.target, confirmed: 0, warm: 0, invited: 0, staged: 0, toSource: config.target, pct: 0 },
    moves: [],
    heatByPersonId: {},
    actionByPersonId: {},
    coverageByAccountId: {},
    inviteByPersonId: {},
    invites: [],
    // Even with no Gmail data the watched accounts render from the config note.
    watchedAccounts: watchedAccountViews(config, new Map()),
  };
}

export interface BuildIntelInput {
  accounts: ViewAccount[];
  persons: ViewContact[];
  /** person.id -> EmailLog row (or null). The server resolves the match by email. */
  logByPersonId: Map<string, CampaignEmailLog | null>;
  discoveryRows: DiscoveryIntelRow[];
  /**
   * domain -> Gmail invite-truth. The server resolves this from scanInviteTruth;
   * empty when Gmail is down or unconfigured (fail-soft, the page still renders).
   */
  inviteTruthByDomain?: Map<string, InviteTruthInput>;
  /** Per-campaign config; defaults to the Allentown tour. */
  config?: CampaignConfig;
  now?: number;
}

/** Resolve a person's account domain from the account it belongs to. */
function personDomain(person: ViewContact, accountById: Map<string, ViewAccount>): string | null {
  const acct = accountById.get(person.accId);
  const d = acct?.domain?.trim().toLowerCase();
  return d || null;
}

/**
 * Compose the whole intel bundle. One call from the server component; pure, so
 * the UI snapshot is testable end-to-end. Invite truth from Casey's Gmail merges
 * into the temperature, the actions, the funnel, and the per-person indicator,
 * and the watched accounts (Boston Beer, NFI) ride along as first-class entries.
 */
export function buildCampaignIntel(input: BuildIntelInput): CampaignIntel {
  const { accounts, persons, logByPersonId } = input;
  const config = input.config ?? ALLENTOWN_CAMPAIGN;
  const now = input.now ?? Date.now();
  const truthByDomain = input.inviteTruthByDomain ?? new Map<string, InviteTruthInput>();
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const personsByAccountId = new Map<string, ViewContact[]>();
  for (const p of persons) {
    const list = personsByAccountId.get(p.accId) || [];
    list.push(p);
    personsByAccountId.set(p.accId, list);
  }

  // person.id -> the Gmail invite-truth for its account domain.
  const inviteInputByPersonId = new Map<string, InviteTruthInput | null>();
  for (const p of persons) {
    const d = personDomain(p, accountById);
    inviteInputByPersonId.set(p.id, (d && truthByDomain.get(d)) || null);
  }

  // Per-person heat + action + invite indicator (Outbox + Gmail merged).
  const heatByPersonId: Record<string, EngagementHeat> = {};
  const actionByPersonId: Record<string, NextBestAction> = {};
  const inviteByPersonId: Record<string, InviteIndicator> = {};
  for (const p of persons) {
    const log = logByPersonId.get(p.id) ?? null;
    const invite = inviteInputByPersonId.get(p.id) ?? null;
    const heat = engagementTemperature(p, log, now, invite);
    heatByPersonId[p.id] = heat;
    actionByPersonId[p.id] = nextBestAction(p, heat, config, invite);
    inviteByPersonId[p.id] = inviteIndicator(log, invite);
  }

  // Per-account temperature = strongest committee member's temp.
  const TEMP_RANK: Temperature[] = ['staged', 'cooling', 'sent', 'warm', 'replied'];
  const accountTemps = new Map<string, Temperature>();
  for (const a of accounts) {
    const committee = personsByAccountId.get(a.id) || [];
    let best: Temperature | undefined;
    for (const p of committee) {
      const t = heatByPersonId[p.id]?.temp;
      if (!t) continue;
      if (best == null || TEMP_RANK.indexOf(t) > TEMP_RANK.indexOf(best)) best = t;
    }
    if (best) accountTemps.set(a.id, best);
  }

  // Committee coverage per account.
  const coverageByAccountId: Record<string, CommitteeCoverage> = {};
  for (const a of accounts) {
    coverageByAccountId[a.id] = committeeCoverage(a, personsByAccountId.get(a.id) || []);
  }

  // Invite candidates: corridor rows not already in the campaign.
  const campaignNames = new Set(accounts.map((a) => a.name));
  const invites = nextAccountsToInvite(input.discoveryRows, campaignNames, 6);

  const funnel = tourFunnel(accounts, accountTemps, config.target);

  const moves = nextMoves({
    accounts,
    persons,
    logByPersonId,
    personsByAccountId,
    inviteCandidates: invites,
    inviteByPersonId: inviteInputByPersonId,
    config,
    now,
  });

  const watchedAccounts = watchedAccountViews(config, truthByDomain);

  return {
    funnel,
    moves,
    heatByPersonId,
    actionByPersonId,
    coverageByAccountId,
    inviteByPersonId,
    invites,
    watchedAccounts,
  };
}
