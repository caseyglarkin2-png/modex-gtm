import Link from 'next/link';
import { getAccentClasses } from '@/components/microsites/theme';
import { Badge } from '@/components/ui/badge';
import type { AccountMicrositeData } from '@/lib/microsites/schema';
import { getVariantRoutes } from '@/lib/microsites/rules';
import type { MicrositeAnalyticsSummary } from '@/lib/microsites/analytics';
import type { MicrositeBatchAccountStatus, MicrositeBatchSummary } from '@/lib/microsites/batch-distribution';
import { MicrositeAudioPanel, type MicrositeAudioAsset } from './microsite-audio-panel';

type MicrositesTabProps = {
  accounts: AccountMicrositeData[];
  analytics?: MicrositeAnalyticsSummary | null;
  batch?: MicrositeBatchSummary | null;
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function daysSince(date: Date) {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

const BATCH_STATE_BADGE: Record<MicrositeBatchAccountStatus['state'], { variant: 'success' | 'warning' | 'info' | 'outline'; label: string }> = {
  cta: { variant: 'success', label: 'CTA clicked' },
  'high-intent': { variant: 'warning', label: 'High intent' },
  engaged: { variant: 'info', label: 'Viewed' },
  'no-traffic': { variant: 'outline', label: 'No traffic yet' },
};

function EngagementPanel({ analytics }: { analytics: MicrositeAnalyticsSummary }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <h3 className="text-sm font-semibold">Live engagement</h3>
      <p className="text-xs text-[var(--muted-foreground)]">
        Human microsite traffic — bot and scanner hits are excluded.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Sessions', value: String(analytics.totalSessions) },
          { label: 'Unique people', value: String(analytics.uniquePeople) },
          { label: 'High-intent', value: String(analytics.highIntentSessions) },
          { label: 'CTA sessions', value: String(analytics.ctaSessions) },
          { label: 'Avg scroll', value: `${analytics.avgScrollDepthPct}%` },
        ].map((metric) => (
          <div key={metric.label} className="rounded-md border border-[var(--border)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>

      {analytics.hotAccounts.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Hot accounts</p>
          {analytics.hotAccounts.map((account) => (
            <div
              key={account.accountSlug}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-[var(--border)] p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/accounts/${account.accountSlug}`}
                    className="text-sm font-semibold text-[var(--primary)] hover:underline"
                  >
                    {account.accountName}
                  </Link>
                  <Badge variant={account.engagementScore >= 60 ? 'destructive' : account.engagementScore >= 35 ? 'warning' : 'secondary'}>
                    Heat {account.engagementScore}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {account.primarySignal} · {account.sessionCount} session{account.sessionCount !== 1 ? 's' : ''} · avg {formatDuration(account.avgDurationSeconds)}
                </p>
                <p className="mt-1 text-xs">{account.recommendedAction}</p>
              </div>
              <Link
                href={`/for/${account.accountSlug}`}
                className="shrink-0 text-xs font-medium text-[var(--primary)] hover:underline"
              >
                View microsite
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-[var(--muted-foreground)]">No microsite engagement recorded yet.</p>
      )}
    </section>
  );
}

function BatchPanel({ batch }: { batch: MicrositeBatchSummary }) {
  const daysOut = daysSince(batch.sendDate);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Batch distribution</h3>
        <span className="text-xs text-[var(--muted-foreground)]">
          Sent {batch.sendDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {daysOut} day{daysOut !== 1 ? 's' : ''} out
        </span>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        {batch.engagedAccounts}/{batch.totalAccounts} engaged · {batch.highIntentAccounts} high-intent · {batch.ctaAccounts} CTA
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {batch.accounts.map((account) => {
          const badge = BATCH_STATE_BADGE[account.state];
          return (
            <div key={account.slug} className="rounded-md border border-[var(--border)] p-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/for/${account.slug}`}
                  className="truncate text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                >
                  {account.accountName}
                </Link>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                {account.tier}·{account.band} · {account.poc}
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                {account.sessions > 0
                  ? `${account.sessions} session${account.sessions !== 1 ? 's' : ''}${account.lastViewedAt ? ` · last ${account.lastViewedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                  : 'Awaiting first open'}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MicrositesTab({ accounts, analytics, batch }: MicrositesTabProps) {
  const showcaseAccounts = accounts
    .filter((a) => a.showcase)
    .sort((a, b) => (a.showcaseOrder ?? 99) - (b.showcaseOrder ?? 99));
  const otherAccounts = accounts
    .filter((a) => !a.showcase)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const audioAssets: MicrositeAudioAsset[] = accounts
    .map((account) => ({
      slug: account.slug,
      accountName: account.accountName,
      hasCustomAudio: Boolean(account.audioBrief),
      audioGeneratedAt: account.audioBrief?.generatedAt ?? null,
      hasVideo: Boolean(account.audioBrief?.videoFollowUp),
    }))
    .sort((a, b) => {
      if (a.hasCustomAudio !== b.hasCustomAudio) return a.hasCustomAudio ? -1 : 1;
      return a.accountName.localeCompare(b.accountName);
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Microsites Gallery ({accounts.length})</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Internal index of public-facing account microsites — {showcaseAccounts.length} showcase, {otherAccounts.length} other.
        </p>
      </div>

      {analytics ? <EngagementPanel analytics={analytics} /> : null}
      {batch ? <BatchPanel batch={batch} /> : null}
      {audioAssets.length > 0 ? <MicrositeAudioPanel assets={audioAssets} /> : null}

      {showcaseAccounts.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">Showcase</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {showcaseAccounts.map((account) => {
              const accent = getAccentClasses(account.theme?.accentColor);
              const variants = getVariantRoutes(account);
              const observationSection = account.sections.find((s) => s.type === 'observation');
              const headline = observationSection ? observationSection.headline : '';
              return (
                <Link
                  key={account.slug}
                  href={`/for/${account.slug}`}
                  className="group block rounded-lg border border-[var(--border)] bg-[var(--background)] p-5 transition-colors hover:border-[var(--primary)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${accent.bg}`} />
                    <span className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                      {account.accountName}
                    </span>
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                    {headline}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
                    <span
                      className={`rounded border px-2 py-0.5 font-bold ${
                        account.band === 'A'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-cyan-300 bg-cyan-50 text-cyan-700'
                      }`}
                    >
                      Band {account.band}
                    </span>
                    <span>{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{account.sections.length} sections</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--muted-foreground)]">All Accounts</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <div className="space-y-4">
          {otherAccounts.map((account) => {
            const accent = getAccentClasses(account.theme?.accentColor);
            const variants = getVariantRoutes(account);
            return (
              <div key={account.slug} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${accent.bg}`} />
                      <Link
                        href={`/for/${account.slug}`}
                        className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)]"
                      >
                        {account.accountName}
                      </Link>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
                      <span className="uppercase tracking-[0.15em]">{account.vertical}</span>
                      <span>|</span>
                      <span>{account.network.facilityCount} facilities</span>
                      <span>|</span>
                      <span>{account.people.length} people</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-[10px]">
                    <span
                      className={`rounded border px-2 py-0.5 font-bold ${
                        account.band === 'A'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : account.band === 'B'
                          ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                          : 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      Band {account.band}
                    </span>
                    <span className="font-mono text-xs text-[var(--muted-foreground)]">{account.priorityScore}</span>
                  </div>
                </div>

                {variants.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <Link
                        key={v.slug}
                        href={`/for/${account.slug}/${v.slug}`}
                        className={`rounded-full px-3 py-1 text-xs ${accent.text} ${accent.bgSubtle} border ${accent.border} transition-colors hover:opacity-80`}
                      >
                        {v.personName}
                      </Link>
                    ))}
                  </div>
                ) : null}

                <p className="mt-3 text-[10px] text-[var(--muted-foreground)]">
                  {account.sections.length} sections · {account.personVariants.length} person variants · {account.proofBlocks.length} proof blocks
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
