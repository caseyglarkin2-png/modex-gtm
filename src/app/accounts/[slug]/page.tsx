import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAccounts,
  getAccountBySlug,
  getPersonasByAccount,
  getWavesByAccount,
  getMeetingBriefByAccount,
  slugify,
} from '@/lib/data';
import { getAuditRoutes } from '@/lib/data';

export function generateStaticParams() {
  return getAccounts().map((a) => ({ slug: slugify(a.name) }));
}

const BAND_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800 border-green-300',
  B: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  C: 'bg-orange-100 text-orange-800 border-orange-300',
  D: 'bg-gray-100 text-gray-600 border-gray-300',
};

export default async function AccountDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const account = getAccountBySlug(slug);
  if (!account) notFound();

  const personas = getPersonasByAccount(account.name);
  const waves = getWavesByAccount(account.name);
  const brief = getMeetingBriefByAccount(account.name);
  const auditRoutes = getAuditRoutes();
  const auditRoute = auditRoutes.find((r) => r.account === account.name);

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/accounts" className="text-sm text-[var(--primary)] hover:underline">&larr; Accounts</Link>
      </div>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{account.name}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {account.parent_brand} &middot; {account.vertical} &middot; {account.signal_type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded border px-3 py-1 text-sm font-medium ${BAND_COLORS[account.priority_band] || BAND_COLORS.D}`}>
            Band {account.priority_band}
          </span>
          <span className="rounded border border-[var(--border)] px-3 py-1 text-sm">{account.tier}</span>
          <span className="rounded border border-[var(--border)] px-3 py-1 text-sm">Score: {account.priority_score}</span>
        </div>
      </div>

      {/* Scoring Dimensions */}
      <div className="mt-6 grid grid-cols-6 gap-3">
        {[
          { label: 'ICP Fit', value: account.icp_fit, weight: 30 },
          { label: 'MODEX Signal', value: account.modex_signal, weight: 20 },
          { label: 'Primo Story', value: account.primo_story_fit, weight: 20 },
          { label: 'Warm Intro', value: account.warm_intro, weight: 15 },
          { label: 'Strategic Value', value: account.strategic_value, weight: 10 },
          { label: 'Meeting Ease', value: account.meeting_ease, weight: 5 },
        ].map((dim) => (
          <div key={dim.label} className="rounded-lg border border-[var(--border)] p-3 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">{dim.label} ({dim.weight}%)</p>
            <p className="mt-1 text-xl font-semibold">{dim.value}/5</p>
          </div>
        ))}
      </div>

      {/* Key Info */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-[var(--border)] p-5">
          <h3 className="font-semibold">Why Now</h3>
          <p className="mt-2 text-sm">{account.why_now}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-5">
          <h3 className="font-semibold">Primo Angle</h3>
          <p className="mt-2 text-sm">{account.primo_angle}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Best Intro Path</p>
          <p className="mt-1 text-sm font-medium">{account.best_intro_path}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Current Motion</p>
          <p className="mt-1 text-sm font-medium">{account.current_motion}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Next Action</p>
          <p className="mt-1 text-sm font-medium">{account.next_action}</p>
        </div>
      </div>

      {/* Status Row */}
      <div className="mt-4 flex gap-4 text-sm">
        <span className="rounded bg-[var(--muted)] px-3 py-1">Research: {account.research_status}</span>
        <span className="rounded bg-[var(--muted)] px-3 py-1">Outreach: {account.outreach_status}</span>
        <span className="rounded bg-[var(--muted)] px-3 py-1">Meeting: {account.meeting_status}</span>
        <span className="rounded bg-[var(--muted)] px-3 py-1">Owner: {account.owner}</span>
      </div>

      {/* Personas */}
      <h2 className="mt-8 text-lg font-semibold">Personas ({personas.length})</h2>
      {personas.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted-foreground)]">
                <th className="pb-2 pr-3">ID</th>
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3">Title</th>
                <th className="pb-2 pr-3">Priority</th>
                <th className="pb-2 pr-3">Lane</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Next Step</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((p) => (
                <tr key={p.persona_id} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-3 font-mono text-xs">{p.persona_id}</td>
                  <td className="py-2 pr-3 font-medium">
                    {p.linkedin_url ? (
                      <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">{p.name}</a>
                    ) : p.name}
                  </td>
                  <td className="py-2 pr-3 text-xs">{p.title}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${p.priority === 'P1' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                      {p.priority}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs">{p.persona_lane}</td>
                  <td className="py-2 pr-3 text-xs">{p.persona_status}</td>
                  <td className="py-2 text-xs">{p.next_step}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">No personas mapped yet.</p>
      )}

      {/* Outreach Waves */}
      {waves.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Outreach Waves</h2>
          <div className="mt-3 space-y-3">
            {waves.map((w, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{w.wave}</span>
                  <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-xs">{w.status}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-[var(--muted-foreground)]">
                  <div><span className="font-medium">Channel:</span> {w.channel_mix}</div>
                  <div><span className="font-medium">Start:</span> {w.start_date}</div>
                  <div><span className="font-medium">Owner:</span> {w.owner}</div>
                </div>
                <p className="mt-2 text-sm">{w.primary_objective}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Meeting Brief */}
      {brief && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Meeting Brief</h2>
          <div className="mt-3 rounded-lg border border-[var(--border)] p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Why This Account</p>
              <p className="mt-1 text-sm">{brief.why_this_account}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Why Now</p>
              <p className="mt-1 text-sm">{brief.why_now}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Likely Pain Points</p>
              <p className="mt-1 text-sm">{brief.likely_pain_points}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Primo Relevance</p>
              <p className="mt-1 text-sm">{brief.primo_relevance}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Best First Meeting Outcome</p>
              <p className="mt-1 text-sm">{brief.best_first_meeting_outcome}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Suggested Attendees</p>
              <p className="mt-1 text-sm">{brief.suggested_attendees}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Prep Assets Needed</p>
              <p className="mt-1 text-sm">{brief.prep_assets_needed}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Open Questions</p>
              <p className="mt-1 text-sm">{brief.open_questions}</p>
            </div>
          </div>
        </>
      )}

      {/* Audit Route */}
      {auditRoute && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Audit Route</h2>
          <div className="mt-3 rounded-lg border border-[var(--border)] p-5">
            <a href={auditRoute.audit_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline break-all">
              {auditRoute.audit_url}
            </a>
            <div className="mt-3 space-y-2 text-sm">
              <div><span className="font-medium">Suggested Message:</span> {auditRoute.suggested_message}</div>
              <div><span className="font-medium">Fast Ask:</span> {auditRoute.fast_ask}</div>
              <div><span className="font-medium">Proof Asset:</span> {auditRoute.proof_asset}</div>
              {auditRoute.warm_route && <div><span className="font-medium">Warm Route:</span> {auditRoute.warm_route}</div>}
            </div>
          </div>
        </>
      )}

      {account.notes && (
        <div className="mt-6 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Notes</p>
          <p className="mt-1 text-sm">{account.notes}</p>
        </div>
      )}
    </>
  );
}
