import { getActionableIntel } from '@/lib/data';

export default function IntelPage() {
  const items = getActionableIntel();

  return (
    <>
      <h1 className="text-2xl font-bold">Actionable Intel ({items.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Research tasks and intelligence items that create outreach timing advantages.
      </p>

      <div className="mt-6 space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-[var(--border)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item.account}</span>
                <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-xs">{item.intel_type}</span>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                item.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
              }`}>
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-sm">{item.why_it_matters}</p>
            <div className="mt-3 rounded bg-[var(--muted)] p-3">
              <p className="text-xs font-semibold text-[var(--muted-foreground)]">How to Find It</p>
              <p className="mt-1 text-sm">{item.how_to_find_it}</p>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
              <span>Owner: {item.owner}</span>
              <span>Updates: {item.field_to_update}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
