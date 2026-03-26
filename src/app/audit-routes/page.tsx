import { getAuditRoutes } from '@/lib/data';

export default function AuditRoutesPage() {
  const routes = getAuditRoutes();

  return (
    <>
      <h1 className="text-2xl font-bold">Audit Routes ({routes.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        UTM-tracked landing page URLs for yardflow.ai/audit. Each route pre-populates account context.
      </p>

      <div className="mt-6 space-y-3">
        {routes.map((r) => (
          <div key={r.account} className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block rounded bg-[var(--accent)] px-2 py-0.5 text-xs font-mono mr-2">#{r.rank}</span>
                <span className="font-semibold">{r.account}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">{r.owner}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${r.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                  {r.status}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <a
                href={r.audit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--primary)] hover:underline break-all"
              >
                {r.audit_url}
              </a>
            </div>
            <p className="mt-2 text-sm">{r.suggested_message}</p>
            <div className="mt-2 rounded bg-[var(--muted)] p-2 text-xs">
              <span className="font-medium">Fast Ask:</span> {r.fast_ask}
            </div>
            <div className="mt-1 text-xs text-[var(--muted-foreground)]">
              Proof: {r.proof_asset} &middot; Warm Route: {r.warm_route}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
