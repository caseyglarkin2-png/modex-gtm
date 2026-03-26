import { getMobileCaptures } from '@/lib/data';

export default function QueuePage() {
  const captures = getMobileCaptures()
    .filter((c) => c.account && c.status !== 'Closed')
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  return (
    <>
      <h1 className="text-2xl font-bold">Jake Queue</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Follow-up queue from mobile captures. Filtered to open items with assigned accounts, sorted by due date.
      </p>

      {captures.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-lg font-medium text-[var(--muted-foreground)]">Queue Empty</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Mobile captures will appear here once created.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted-foreground)]">
                <th className="pb-2 pr-3">Account</th>
                <th className="pb-2 pr-3">Contact</th>
                <th className="pb-2 pr-3">Due Date</th>
                <th className="pb-2 pr-3">Heat</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {captures.map((c, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-3 font-medium">{c.account}</td>
                  <td className="py-2 pr-3">{c.contact}</td>
                  <td className="py-2 pr-3">{c.due_date}</td>
                  <td className="py-2 pr-3">{c.heat_score}</td>
                  <td className="py-2 pr-3">{c.status}</td>
                  <td className="py-2 max-w-48 truncate text-xs">{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
