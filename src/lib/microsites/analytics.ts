export interface MicrositeEngagementAnalyticsInput {
  account_name: string;
  account_slug: string;
  person_name: string | null;
  person_slug: string | null;
  path: string;
  sections_viewed: string[];
  cta_ids: string[];
  variant_history: string[];
  scroll_depth_pct: number;
  duration_seconds: number;
  updated_at: Date;
}

export interface RecentMicrositeSession {
  accountName: string;
  accountSlug: string;
  personName: string | null;
  personSlug: string | null;
  path: string;
  sectionsViewedCount: number;
  ctaCount: number;
  variantCount: number;
  scrollDepthPct: number;
  durationSeconds: number;
  viewedAt: Date;
  intentScore: number;
  isHighIntent: boolean;
}

export interface HotMicrositeAccount {
  accountName: string;
  accountSlug: string;
  lastPath: string;
  lastPersonName: string | null;
  sessionCount: number;
  highIntentSessions: number;
  ctaSessions: number;
  variantCompareSessions: number;
  avgScrollDepthPct: number;
  avgDurationSeconds: number;
  engagementScore: number;
  primarySignal: string;
  recommendedAction: string;
  lastViewedAt: Date;
}

export interface MicrositeAnalyticsSummary {
  totalSessions: number;
  accountsEngaged: number;
  highIntentSessions: number;
  ctaSessions: number;
  avgScrollDepthPct: number;
  avgDurationSeconds: number;
  hotAccounts: HotMicrositeAccount[];
  recentSessions: RecentMicrositeSession[];
}

export interface MicrositeAccountAnalytics {
  totalSessions: number;
  highIntentSessions: number;
  ctaSessions: number;
  avgScrollDepthPct: number;
  avgDurationSeconds: number;
  accountSummary: HotMicrositeAccount | null;
  recentSessions: RecentMicrositeSession[];
  variants: MicrositeVariantPerformance[];
}

export interface MicrositeVariantPerformance {
  label: string;
  slug: string;
  path: string;
  sessionCount: number;
  highIntentSessions: number;
  ctaSessions: number;
  avgScrollDepthPct: number;
  avgDurationSeconds: number;
  lastViewedAt: Date;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function scoreMicrositeSession(session: MicrositeEngagementAnalyticsInput): number {
  let score = 0;

  if (session.sections_viewed.length >= 3) score += 15;
  if (session.sections_viewed.length >= 5) score += 10;
  if (session.scroll_depth_pct >= 60) score += 10;
  if (session.scroll_depth_pct >= 85) score += 10;
  if (session.duration_seconds >= 60) score += 10;
  if (session.duration_seconds >= 180) score += 10;
  if (session.cta_ids.length > 0) score += 30;
  if (session.variant_history.length > 1) score += 10;

  return Math.min(100, score);
}

export function isHighIntentMicrositeSession(session: MicrositeEngagementAnalyticsInput): boolean {
  if (session.cta_ids.length > 0) return true;
  if (session.sections_viewed.length >= 4 && session.scroll_depth_pct >= 70) return true;
  if (session.sections_viewed.length >= 3 && session.duration_seconds >= 90) return true;
  if (session.variant_history.length > 1 && session.scroll_depth_pct >= 60) return true;

  return scoreMicrositeSession(session) >= 50;
}

export function scoreHotMicrositeAccount(
  account: Pick<HotMicrositeAccount, 'ctaSessions' | 'highIntentSessions' | 'avgScrollDepthPct' | 'avgDurationSeconds' | 'variantCompareSessions' | 'lastViewedAt'>,
  now = new Date(),
): number {
  let score = 0;

  score += Math.min(35, account.ctaSessions * 35);
  score += Math.min(25, account.highIntentSessions * 12);
  score += Math.min(15, Math.round(account.avgScrollDepthPct / 7));
  score += Math.min(10, Math.round(account.avgDurationSeconds / 30));
  score += Math.min(10, account.variantCompareSessions * 5);

  const hoursSinceLastView = (now.getTime() - account.lastViewedAt.getTime()) / 3_600_000;
  if (hoursSinceLastView <= 24) score += 5;
  else if (hoursSinceLastView <= 72) score += 3;

  return Math.min(100, score);
}

function getPrimarySignal(account: Pick<HotMicrositeAccount, 'ctaSessions' | 'variantCompareSessions' | 'highIntentSessions' | 'sessionCount'>) {
  if (account.ctaSessions > 0) return pluralize(account.ctaSessions, 'CTA session');
  if (account.variantCompareSessions > 0) return pluralize(account.variantCompareSessions, 'variant comparison');
  if (account.highIntentSessions > 0) return pluralize(account.highIntentSessions, 'deep read');
  return pluralize(account.sessionCount, 'microsite visit');
}

function getRecommendedAction(account: Pick<HotMicrositeAccount, 'ctaSessions' | 'highIntentSessions' | 'variantCompareSessions' | 'sessionCount' | 'lastPersonName'>) {
  if (account.ctaSessions > 0) {
    return account.lastPersonName
      ? `Follow up with ${account.lastPersonName} today. CTA clicked on microsite.`
      : 'Follow up today. CTA clicked on microsite.';
  }

  if (account.highIntentSessions > 0 && account.variantCompareSessions > 0) {
    return 'Send a role-specific follow-up and route to the viewed stakeholder.';
  }

  if (account.highIntentSessions > 0) {
    return 'Prioritize a same-day follow-up while the account is actively reading.';
  }

  if (account.sessionCount > 1) {
    return 'Re-thread with proof and drive them back to the strongest variant.';
  }

  return 'Keep the account warm with proof-led follow-up.';
}

export function buildMicrositeAnalyticsSummary(
  sessions: MicrositeEngagementAnalyticsInput[],
  now = new Date(),
): MicrositeAnalyticsSummary {
  const orderedSessions = [...sessions].sort((left, right) => right.updated_at.getTime() - left.updated_at.getTime());

  if (orderedSessions.length === 0) {
    return {
      totalSessions: 0,
      accountsEngaged: 0,
      highIntentSessions: 0,
      ctaSessions: 0,
      avgScrollDepthPct: 0,
      avgDurationSeconds: 0,
      hotAccounts: [],
      recentSessions: [],
    };
  }

  const hotAccountMap = new Map<string, Omit<HotMicrositeAccount, 'engagementScore' | 'primarySignal' | 'recommendedAction'>>();
  let totalScrollDepth = 0;
  let totalDuration = 0;
  let highIntentSessions = 0;
  let ctaSessions = 0;

  function upsertAccountRollup(session: MicrositeEngagementAnalyticsInput, isHighIntent: boolean) {
    const existing = hotAccountMap.get(session.account_name);
    if (existing) {
      existing.sessionCount += 1;
      existing.highIntentSessions += isHighIntent ? 1 : 0;
      existing.ctaSessions += session.cta_ids.length > 0 ? 1 : 0;
      existing.variantCompareSessions += session.variant_history.length > 1 ? 1 : 0;
      existing.avgScrollDepthPct += session.scroll_depth_pct;
      existing.avgDurationSeconds += session.duration_seconds;

      if (session.updated_at.getTime() > existing.lastViewedAt.getTime()) {
        existing.lastViewedAt = session.updated_at;
        existing.lastPath = session.path;
        existing.lastPersonName = session.person_name;
      }

      return;
    }

    hotAccountMap.set(session.account_name, {
      accountName: session.account_name,
      accountSlug: session.account_slug,
      lastPath: session.path,
      lastPersonName: session.person_name,
      sessionCount: 1,
      highIntentSessions: isHighIntent ? 1 : 0,
      ctaSessions: session.cta_ids.length > 0 ? 1 : 0,
      variantCompareSessions: session.variant_history.length > 1 ? 1 : 0,
      avgScrollDepthPct: session.scroll_depth_pct,
      avgDurationSeconds: session.duration_seconds,
      lastViewedAt: session.updated_at,
    });
  }

  const recentSessions = orderedSessions.slice(0, 12).map((session) => {
    const intentScore = scoreMicrositeSession(session);
    const isHighIntent = intentScore >= 40;

    if (isHighIntent) highIntentSessions++;
    if (session.cta_ids.length > 0) ctaSessions++;
    totalScrollDepth += session.scroll_depth_pct;
    totalDuration += session.duration_seconds;

    upsertAccountRollup(session, isHighIntent);

    return {
      accountName: session.account_name,
      accountSlug: session.account_slug,
      personName: session.person_name,
      personSlug: session.person_slug,
      path: session.path,
      sectionsViewedCount: session.sections_viewed.length,
      ctaCount: session.cta_ids.length,
      variantCount: session.variant_history.length,
      scrollDepthPct: session.scroll_depth_pct,
      durationSeconds: session.duration_seconds,
      viewedAt: session.updated_at,
      intentScore,
      isHighIntent,
    };
  });

  for (const session of orderedSessions.slice(12)) {
    const isHighIntent = isHighIntentMicrositeSession(session);
    if (isHighIntent) highIntentSessions++;
    if (session.cta_ids.length > 0) ctaSessions++;
    totalScrollDepth += session.scroll_depth_pct;
    totalDuration += session.duration_seconds;

    upsertAccountRollup(session, isHighIntent);
  }

  const hotAccounts: HotMicrositeAccount[] = Array.from(hotAccountMap.values())
    .map((account) => {
      const avgScrollDepthPct = Math.round(account.avgScrollDepthPct / account.sessionCount);
      const avgDurationSeconds = Math.round(account.avgDurationSeconds / account.sessionCount);
      const engagementScore = scoreHotMicrositeAccount(
        {
          ...account,
          avgScrollDepthPct,
          avgDurationSeconds,
        },
        now,
      );

      return {
        ...account,
        avgScrollDepthPct,
        avgDurationSeconds,
        engagementScore,
        primarySignal: getPrimarySignal(account),
        recommendedAction: getRecommendedAction(account),
      };
    })
    .sort((left, right) => {
      if (right.engagementScore !== left.engagementScore) {
        return right.engagementScore - left.engagementScore;
      }

      return right.lastViewedAt.getTime() - left.lastViewedAt.getTime();
    })
    .slice(0, 8);

  return {
    totalSessions: orderedSessions.length,
    accountsEngaged: hotAccountMap.size,
    highIntentSessions,
    ctaSessions,
    avgScrollDepthPct: Math.round(totalScrollDepth / orderedSessions.length),
    avgDurationSeconds: Math.round(totalDuration / orderedSessions.length),
    hotAccounts,
    recentSessions,
  };
}

export function buildMicrositeAccountAnalytics(
  sessions: MicrositeEngagementAnalyticsInput[],
  now = new Date(),
): MicrositeAccountAnalytics {
  const summary = buildMicrositeAnalyticsSummary(sessions, now);
  const variantMap = new Map<string, Omit<MicrositeVariantPerformance, 'avgScrollDepthPct' | 'avgDurationSeconds'>>();

  for (const session of sessions) {
    const label = session.person_name ?? 'Overview';
    const slug = session.person_slug ?? 'overview';
    const key = session.path;
    const highIntent = isHighIntentMicrositeSession(session);
    const existing = variantMap.get(key);

    if (existing) {
      existing.sessionCount += 1;
      existing.highIntentSessions += highIntent ? 1 : 0;
      existing.ctaSessions += session.cta_ids.length > 0 ? 1 : 0;
      existing.lastViewedAt = session.updated_at.getTime() > existing.lastViewedAt.getTime()
        ? session.updated_at
        : existing.lastViewedAt;
      continue;
    }

    variantMap.set(key, {
      label,
      slug,
      path: session.path,
      sessionCount: 1,
      highIntentSessions: highIntent ? 1 : 0,
      ctaSessions: session.cta_ids.length > 0 ? 1 : 0,
      lastViewedAt: session.updated_at,
    });
  }

  const variants = Array.from(variantMap.values())
    .map((variant) => {
      const variantSessions = sessions.filter((session) => session.path === variant.path);

      return {
        ...variant,
        avgScrollDepthPct: Math.round(
          variantSessions.reduce((sum, session) => sum + session.scroll_depth_pct, 0) / Math.max(variantSessions.length, 1),
        ),
        avgDurationSeconds: Math.round(
          variantSessions.reduce((sum, session) => sum + session.duration_seconds, 0) / Math.max(variantSessions.length, 1),
        ),
      };
    })
    .sort((left, right) => {
      if (right.ctaSessions !== left.ctaSessions) return right.ctaSessions - left.ctaSessions;
      if (right.highIntentSessions !== left.highIntentSessions) return right.highIntentSessions - left.highIntentSessions;
      if (right.sessionCount !== left.sessionCount) return right.sessionCount - left.sessionCount;
      return right.lastViewedAt.getTime() - left.lastViewedAt.getTime();
    })
    .slice(0, 6);

  return {
    totalSessions: summary.totalSessions,
    highIntentSessions: summary.highIntentSessions,
    ctaSessions: summary.ctaSessions,
    avgScrollDepthPct: summary.avgScrollDepthPct,
    avgDurationSeconds: summary.avgDurationSeconds,
    accountSummary: summary.hotAccounts[0] ?? null,
    recentSessions: summary.recentSessions,
    variants,
  };
}