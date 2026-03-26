import Link from 'next/link';
import { getAccounts, slugify, getPersonasByAccount } from '@/lib/data';

const BAND_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-yellow-100 text-yellow-800',
  C: 'bg-orange-100 text-orange-800',
  D: 'bg-gray-100 text-gray-600',
};

export default function AccountsPage() {
  const accounts = getAccounts();

  return (
    <>
      <h1 className="text-2xl font-bold">Accounts ({accounts.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        All target accounts ranked by priority score. 20 accounts across Food &amp; Beverage, Retail, Manufacturing, 3PL / Logistics, and Industrial verticals.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted-foreground)]">
              <th className="pb-3 pr-3">Rank</th>
              <th className="pb-3 pr-3">Account</th>
              <th className="pb-3 pr-3">Vertical</th>
              <th className="pb-3 pr-3">Band</th>
              <th className="pb-3 pr-3">Tier</th>
              <th className="pb-3 pr-3">Score</th>
              <th className="pb-3 pr-3">Personas</th>
              <th className="pb-3 pr-3">Owner</th>
              <th className="pb-3 pr-3">Research</th>
              <th className="pb-3 pr-3">Outreach</th>
              <th className="pb-3">Meeting</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acct) => {
              const personaCount = getPersonasByAccount(acct.name).length;
              return (
                <tr key={acct.name} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                  <td className="py-3 pr-3 text-center">{acct.rank}</td>
                  <td className="py-3 pr-3 font-medium">
                    <Link href={`/accounts/${slugify(acct.name)}`} className="text-[var(--primary)] hover:underline">
                      {acct.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">{acct.vertical}</td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${BAND_COLORS[acct.priority_band] || BAND_COLORS.D}`}>
                      {acct.priority_band}
                    </span>
                  </td>
                  <td className="py-3 pr-3">{acct.tier}</td>
                  <td className="py-3 pr-3">{acct.priority_score}</td>
                  <td className="py-3 pr-3 text-center">{personaCount}</td>
                  <td className="py-3 pr-3">{acct.owner}</td>
                  <td className="py-3 pr-3">{acct.research_status}</td>
                  <td className="py-3 pr-3">{acct.outreach_status}</td>
                  <td className="py-3">{acct.meeting_status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
