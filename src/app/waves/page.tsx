import { getOutreachWaves } from '@/lib/data';

const WAVE_COLORS: Record<number, string> = {
  0: 'border-l-purple-500 bg-purple-50',
  1: 'border-l-blue-500 bg-blue-50',
  2: 'border-l-amber-500 bg-amber-50',
  3: 'border-l-gray-500 bg-gray-50',
};

export default function WavesPage() {
  const waves = getOutreachWaves();
  const grouped = [0, 1, 2, 3].map((order) => ({
    order,
    label: waves.find((w) => w.wave_order === order)?.wave || `Wave ${order}`,
    items: waves.filter((w) => w.wave_order === order),
  }));

  return (
    <>
      <h1 className="text-2xl font-bold">Outreach Waves</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        4-wave outreach strategy: Warm intros → Must-book → High-value → Ecosystem / opportunistic.
      </p>

      <div className="mt-6 space-y-8">
        {grouped.map((group) => (
          <div key={group.order}>
            <h2 className="text-lg font-semibold">{group.label} ({group.items.length} accounts)</h2>
            <div className="mt-3 space-y-3">
              {group.items.map((w, i) => (
                <div key={i} className={`rounded-lg border-l-4 border border-[var(--border)] p-4 ${WAVE_COLORS[group.order] || ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{w.account}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)]">Rank {w.rank}</span>
                      <span className="rounded bg-white/80 px-2 py-0.5 text-xs border border-[var(--border)]">{w.status}</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                    <div><span className="text-[var(--muted-foreground)]">Channel:</span> {w.channel_mix}</div>
                    <div><span className="text-[var(--muted-foreground)]">Owner:</span> {w.owner}</div>
                    <div><span className="text-[var(--muted-foreground)]">Start:</span> {w.start_date}</div>
                    <div><span className="text-[var(--muted-foreground)]">Follow-up 1:</span> {w.follow_up_1}</div>
                    <div><span className="text-[var(--muted-foreground)]">Follow-up 2:</span> {w.follow_up_2}</div>
                    <div><span className="text-[var(--muted-foreground)]">Warm Intro:</span> {w.use_warm_intro ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-[var(--muted-foreground)] text-xs">Objective:</span> {w.primary_objective}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Primary: {w.primary_persona_lane} &middot; Secondary: {w.secondary_persona_lane}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Escalation: {w.escalation_trigger}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
