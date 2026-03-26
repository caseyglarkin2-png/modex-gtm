import { getAccounts, getPersonas, getOutreachWaves, getMeetingBriefs, getActivities } from '@/lib/data';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-5">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const accounts = getAccounts();
  const personas = getPersonas();
  const waves = getOutreachWaves();
  const briefs = getMeetingBriefs();
  const activities = getActivities();

  const bandA = accounts.filter((a) => a.priority_band === 'A').length;
  const bandB = accounts.filter((a) => a.priority_band === 'B').length;
  const bandC = accounts.filter((a) => a.priority_band === 'C').length;
  const bandD = accounts.filter((a) => a.priority_band === 'D').length;
  const p1Personas = personas.filter((p) => p.priority === 'P1').length;
  const researchReady = accounts.filter((a) => a.research_status === 'Ready').length;
  const wave0 = waves.filter((w) => w.wave_order === 0);
  const wave1 = waves.filter((w) => w.wave_order === 1);
  const wave2 = waves.filter((w) => w.wave_order === 2);
  const wave3 = waves.filter((w) => w.wave_order === 3);

  return (
    <>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        MODEX 2026 RevOps Operating System — YardFlow / FreightRoll
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Accounts" value={accounts.length} sub={`${researchReady} research-ready`} />
        <StatCard label="Total Personas" value={personas.length} sub={`${p1Personas} P1 priority`} />
        <StatCard label="Outreach Waves" value={waves.length} sub="4 wave tiers" />
        <StatCard label="Meeting Briefs" value={briefs.length} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Priority Bands</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{bandA}</p>
          <p className="text-sm text-green-600">Band A</p>
        </div>
        <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{bandB}</p>
          <p className="text-sm text-yellow-600">Band B</p>
        </div>
        <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">{bandC}</p>
          <p className="text-sm text-orange-600">Band C</p>
        </div>
        <div className="rounded-lg border-2 border-gray-400 bg-gray-50 p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{bandD}</p>
          <p className="text-sm text-gray-500">Band D</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Wave Pipeline</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Wave 0 — Warm Intros</p>
          <p className="text-xl font-semibold">{wave0.length} accounts</p>
          <p className="text-xs text-[var(--muted-foreground)]">Start: 3/24/2026</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Wave 1 — Must-Book</p>
          <p className="text-xl font-semibold">{wave1.length} accounts</p>
          <p className="text-xs text-[var(--muted-foreground)]">Start: 3/27/2026</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Wave 2 — High-Value</p>
          <p className="text-xl font-semibold">{wave2.length} accounts</p>
          <p className="text-xs text-[var(--muted-foreground)]">Start: 3/30/2026</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Wave 3 — Ecosystem</p>
          <p className="text-xl font-semibold">{wave3.length} accounts</p>
          <p className="text-xs text-[var(--muted-foreground)]">Start: 4/2/2026</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Recent Activities</h2>
      {activities.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">No activities logged yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Account</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Outcome</th>
                <th className="pb-2">Next Step</th>
              </tr>
            </thead>
            <tbody>
              {activities.slice(0, 10).map((a, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-4">{a.activity_date}</td>
                  <td className="py-2 pr-4">{a.account}</td>
                  <td className="py-2 pr-4">{a.activity_type}</td>
                  <td className="py-2 pr-4">{a.outcome}</td>
                  <td className="py-2">{a.next_step}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
