import { getMeetings } from '@/lib/data';

export default function MeetingsPage() {
  const meetings = getMeetings();

  return (
    <>
      <h1 className="text-2xl font-bold">Meetings ({meetings.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Scheduled and completed meetings. Linked to accounts and briefs.
      </p>

      {meetings.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-lg font-medium text-[var(--muted-foreground)]">No Meetings Yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Meetings will appear here once booked through outreach waves.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted-foreground)]">
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Account</th>
                <th className="pb-2 pr-3">Attendees</th>
                <th className="pb-2 pr-3">Type</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-3">{m.date}</td>
                  <td className="py-2 pr-3 font-medium">{m.account}</td>
                  <td className="py-2 pr-3 text-xs">{m.attendees}</td>
                  <td className="py-2 pr-3">{m.meeting_type}</td>
                  <td className="py-2 pr-3">{m.status}</td>
                  <td className="py-2 text-xs">{m.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
