/**
 * /gap/sources/:id?field=&value=   one work source: what GAP did with it.
 * Every count is a member state and drills down to those members.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadSource, loadUnknownCompanies, MEMBER_FILTERS, type MemberView } from '@/lib/gap/intake/views';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { SourceMemberActions } from '@/components/gap/source-member-actions';
import { SourceOpportunities } from '@/components/gap/source-opportunities';
import { SourcePlanButton } from '@/components/gap/source-plan-button';
import { loadOpportunities } from '@/lib/gap/intake/opportunities';
import { UnknownCompanies } from '@/components/gap/unknown-companies';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP source' };

const RESOLUTION_LABEL: Record<string, string> = { resolved: 'Known in GAP', new_candidate: 'New at a known account', ambiguous: 'Ambiguous', unresolved: 'Unresolved' };
const QUALIFICATION_LABEL: Record<string, string> = {
  research: 'Need research',
  evidence_ready: 'Evidence ready',
  already_covered: 'Already covered',
  in_deal: 'In a deal',
  opportunity_unknown: 'Deal status unknown',
  not_icp: 'Not in the watched universe',
  needs_identity: 'Need identity',
  do_not_contact: 'Do not contact',
  human_review: 'Human review',
  unplanned: 'Not planned yet',
};
const STATUS_LABEL: Record<string, string> = { active: 'Active', research_requested: 'Research requested', not_now: 'Not now', ignored: 'Ignored' };

function Counts({ id, field, counts, labels, active }: { id: string; field: string; counts: Record<string, number>; labels: Record<string, string>; active: { field: string; value: string } | null }) {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-2" data-testid={`source-counts-${field}`}>
      {entries.map(([k, n]) => {
        const on = active?.field === field && active.value === k;
        return (
          <Link key={k} href={on ? `/gap/sources/${id}` : `/gap/sources/${id}?field=${field}&value=${encodeURIComponent(k)}`} className={`rounded-md border px-2 py-1 text-xs ${on ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--border)]'}`}>
            <span className="font-semibold">{n}</span> {labels[k] ?? k.replace(/_/g, ' ')}
          </Link>
        );
      })}
    </div>
  );
}

function Member({ m }: { m: MemberView }) {
  return (
    <li className="space-y-1 border-b border-[var(--border)] py-2" data-testid="source-member">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <p className="min-w-0 break-words text-sm">
          <span className="font-medium">{m.kind === 'person' ? m.name ?? m.email ?? '(no name)' : m.company ?? m.accountName}</span>
          {m.kind === 'person' && (m.title || m.company) ? <span className="text-[var(--muted-foreground)]"> · {[m.title, m.company].filter(Boolean).join(' · ')}</span> : null}
        </p>
        <span className="text-xs text-[var(--muted-foreground)]">{RESOLUTION_LABEL[m.resolution] ?? m.resolution}{m.accountName ? `: ${m.accountName}` : ''}</span>
      </div>
      {m.qualification ? (
        <p className="text-xs">
          <span className="font-medium">{QUALIFICATION_LABEL[m.qualification] ?? m.qualification}</span>
          {m.qualificationReason ? `: ${m.qualificationReason}` : ''}
        </p>
      ) : null}
      {m.resolution === 'ambiguous' && m.candidates.length ? <p className="text-xs text-[var(--muted-foreground)]">Could be: {m.candidates.map((c) => `${c.accountName} (${c.why})`).join(', ')}</p> : null}
      {m.note ? <p className="text-xs">Your note: {m.note}</p> : null}
      {m.alsoFrom.length ? <p className="text-xs text-[var(--muted-foreground)]">Also from: {m.alsoFrom.join(', ')}</p> : null}
      <SourceMemberActions memberId={m.id} status={m.status} canResearch={!!m.accountName} />
    </li>
  );
}

export default async function SourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ field?: string; value?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const { id } = await params;
  const q = (await searchParams) ?? {};
  const filter = q.field && q.value && (MEMBER_FILTERS as readonly string[]).includes(q.field) ? { field: q.field as (typeof MEMBER_FILTERS)[number], value: q.value } : null;
  const [data, opportunities, unknown] = await Promise.all([loadSource(prisma, id, { filter }), loadOpportunities(prisma, id, new Date()).catch(() => []), loadUnknownCompanies(prisma, id).catch(() => [])]);
  if (!data) notFound();
  const { source: s, members, total } = data;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="source-name">{s.name}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {s.sourceType.replace(/_/g, ' ')} · {s.intent.replace(/_/g, ' ')}
          {s.relationshipContext ? ` · context: ${s.relationshipContext}` : ''}
        </p>
        {s.notes ? <p className="mt-1 text-sm">Why: {s.notes}</p> : null}
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">How you know them is your context: never evidence, never consent, never sent unless you choose to mention it.</p>
      </div>
      <section className="space-y-2" data-testid="source-summary">
        <p className="text-sm font-semibold">
          {s.members} imported · {s.accounts} {s.accounts === 1 ? 'account' : 'accounts'}
        </p>
        <Counts id={s.id} field="resolution" counts={s.byResolution} labels={RESOLUTION_LABEL} active={filter} />
        <Counts id={s.id} field="qualification" counts={s.byQualification} labels={QUALIFICATION_LABEL} active={filter} />
        <Counts id={s.id} field="status" counts={s.byStatus} labels={STATUS_LABEL} active={filter} />
      </section>
      <SourcePlanButton workSourceId={s.id} />
      <section className="space-y-2" data-testid="source-opportunities">
        <h2 className="text-sm font-semibold">Opportunities worth your attention</h2>
        <SourceOpportunities items={opportunities} />
      </section>
      <UnknownCompanies workSourceId={s.id} items={unknown} />
      <section className="space-y-1">
        <h2 className="text-sm font-semibold">Everyone in this source</h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Showing {members.length} of {total}
          {filter ? ` (${filter.field}: ${filter.value.replace(/_/g, ' ')})` : ''}.
        </p>
        <ul data-testid="source-members">
          {members.map((m) => (
            <Member key={m.id} m={m} />
          ))}
        </ul>
      </section>
    </div>
  );
}
