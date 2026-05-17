import { readTrafficQuality } from './bot-detection';
import { isHighIntentMicrositeSession, type MicrositeEngagementAnalyticsInput } from './analytics';

export type MicrositeBatchEntry = {
  slug: string;
  accountName: string;
  tier: string;
  band: string;
  poc: string;
};

/** Send date of the curated batch — see docs/superpowers/plans/2026-05-13-microsite-batch-distribution.md */
export const MICROSITE_BATCH_SEND_DATE = new Date('2026-05-13T00:00:00Z');

/** The 13-account curated batch shipped on the send date above. */
export const MICROSITE_BATCH_DISTRIBUTION: MicrositeBatchEntry[] = [
  { slug: 'kraft-heinz', accountName: 'Kraft Heinz', tier: 'T1', band: 'A', poc: 'Flavio Torres' },
  { slug: 'dannon', accountName: 'Dannon', tier: 'T1', band: 'A', poc: 'Heiko Gerling' },
  { slug: 'frito-lay', accountName: 'Frito-Lay', tier: 'T1', band: 'A', poc: 'Brian Watson' },
  { slug: 'ab-inbev', accountName: 'AB InBev', tier: 'T1', band: 'A', poc: 'Elito Siqueira' },
  { slug: 'coca-cola', accountName: 'Coca-Cola', tier: 'T1', band: 'A', poc: 'Daniel Coe' },
  { slug: 'kimberly-clark', accountName: 'Kimberly-Clark', tier: 'T1', band: 'A', poc: 'Tamera Fenske' },
  { slug: 'the-home-depot', accountName: 'The Home Depot', tier: 'T1', band: 'A', poc: 'John Deaton' },
  { slug: 'john-deere', accountName: 'John Deere', tier: 'T3', band: 'D', poc: 'Cory Reed' },
  { slug: 'kenco-logistics-services', accountName: 'Kenco Logistics Services', tier: 'T3', band: 'D', poc: 'Kristi Montgomery' },
  { slug: 'hormel-foods', accountName: 'Hormel Foods', tier: 'T2', band: 'B', poc: 'Will Bonifant' },
  { slug: 'gxo', accountName: 'GXO Logistics', tier: 'T1', band: 'A', poc: 'Michael Jacobs' },
  { slug: 'crowley', accountName: 'Crowley Maritime', tier: 'T1', band: 'A', poc: 'James C. Fowler' },
  { slug: 'mondelez-international', accountName: 'Mondelez International', tier: 'T1', band: 'A', poc: 'Claudio Parrotta' },
];

export type MicrositeBatchAccountStatus = MicrositeBatchEntry & {
  sessions: number;
  highIntentSessions: number;
  ctaSessions: number;
  lastViewedAt: Date | null;
  /** Distribution outcome derived from live engagement. */
  state: 'cta' | 'high-intent' | 'engaged' | 'no-traffic';
};

export type MicrositeBatchSummary = {
  sendDate: Date;
  totalAccounts: number;
  engagedAccounts: number;
  highIntentAccounts: number;
  ctaAccounts: number;
  accounts: MicrositeBatchAccountStatus[];
};

export function buildMicrositeBatchStatus(
  sessions: MicrositeEngagementAnalyticsInput[],
): MicrositeBatchSummary {
  const humanSessions = sessions.filter((session) => readTrafficQuality(session.metadata) !== 'bot');
  const bySlug = new Map<string, MicrositeEngagementAnalyticsInput[]>();
  for (const session of humanSessions) {
    const list = bySlug.get(session.account_slug) ?? [];
    list.push(session);
    bySlug.set(session.account_slug, list);
  }

  const accounts: MicrositeBatchAccountStatus[] = MICROSITE_BATCH_DISTRIBUTION.map((entry) => {
    const accountSessions = bySlug.get(entry.slug) ?? [];
    let highIntentSessions = 0;
    let ctaSessions = 0;
    let lastViewedAt: Date | null = null;

    for (const session of accountSessions) {
      if (isHighIntentMicrositeSession(session)) highIntentSessions += 1;
      if (session.cta_ids.length > 0) ctaSessions += 1;
      if (!lastViewedAt || session.updated_at.getTime() > lastViewedAt.getTime()) {
        lastViewedAt = session.updated_at;
      }
    }

    const state: MicrositeBatchAccountStatus['state'] = ctaSessions > 0
      ? 'cta'
      : highIntentSessions > 0
        ? 'high-intent'
        : accountSessions.length > 0
          ? 'engaged'
          : 'no-traffic';

    return {
      ...entry,
      sessions: accountSessions.length,
      highIntentSessions,
      ctaSessions,
      lastViewedAt,
      state,
    };
  });

  return {
    sendDate: MICROSITE_BATCH_SEND_DATE,
    totalAccounts: accounts.length,
    engagedAccounts: accounts.filter((account) => account.sessions > 0).length,
    highIntentAccounts: accounts.filter((account) => account.highIntentSessions > 0).length,
    ctaAccounts: accounts.filter((account) => account.ctaSessions > 0).length,
    accounts,
  };
}
