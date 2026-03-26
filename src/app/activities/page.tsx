import { getActivities } from '@/lib/data';

export default function ActivitiesPage() {
  const activities = getActivities();

  return (
    <>
      <h1 className="text-2xl font-bold">Activities ({activities.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        All outreach and engagement activities. Logged by owner with timestamps.
      </p>

      {activities.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-lg font-medium text-[var(--muted-foreground)]">No Activities Yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Activities will appear here as outreach begins.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {activities.map((a, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.account}</span>
                  <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-xs">{a.activity_type}</span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">{a.activity_date}</span>
              </div>
              {a.persona && <p className="mt-1 text-sm">Contact: {a.persona}</p>}
              <p className="mt-1 text-sm">{a.notes}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                <span>Owner: {a.owner}</span>
                {a.outcome && <span>Outcome: {a.outcome}</span>}
                {a.next_step && <span>Next: {a.next_step} (due {a.next_step_due})</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
