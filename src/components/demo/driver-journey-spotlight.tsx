'use client';

import { useMemo, useState } from 'react';
import type { DemoPack } from '@/lib/demo/pack-schema';
import { DriverJourneyReplay } from './driver-journey-replay';

/**
 * Front-and-center driver-journey experience: the truck replay promoted
 * from a buried side-panel toggle to a primary microsite surface ("Watch
 * the run" tab). Auto-loads the featured site's run, with a picker to
 * switch between any audited site that has a scenario. No marker-hunting.
 */
export function DriverJourneySpotlight({
  pack,
  initialSiteId,
  onExit,
}: {
  pack: DemoPack;
  initialSiteId?: string | null;
  onExit: () => void;
}) {
  // Only sites with a scenario can be replayed.
  const playable = useMemo(
    () => pack.network.sites.filter((s) => s.scenario),
    [pack.network.sites],
  );

  const defaultId = useMemo(() => {
    if (initialSiteId && playable.some((s) => s.id === initialSiteId)) return initialSiteId;
    if (pack.account.featuredSiteId && playable.some((s) => s.id === pack.account.featuredSiteId)) {
      return pack.account.featuredSiteId;
    }
    return playable[0]?.id ?? null;
  }, [initialSiteId, playable, pack.account.featuredSiteId]);

  const [siteId, setSiteId] = useState<string | null>(defaultId);
  const site = playable.find((s) => s.id === siteId) ?? playable[0] ?? null;

  if (!site || !site.scenario) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-white/60">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.20em] text-white/45">
            No driver journey modeled
          </p>
          <p className="mt-2 max-w-[360px] text-sm">
            This network does not have a scenario-modeled site yet.{' '}
            <button onClick={onExit} className="text-[#00B4FF] underline underline-offset-2">
              Back to the atlas
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" data-driver-journey-spotlight>
      {/* Picker bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#00B4FF]/[0.12] px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.20em] text-[#00B4FF]/85">
          Watch the run
        </span>
        <label className="flex items-center gap-2 text-[12px] text-white/70">
          <span className="sr-only">Choose a site</span>
          <select
            value={site.id}
            onChange={(e) => setSiteId(e.target.value)}
            data-ms-cta-id="driver-journey-site-select"
            className="max-w-[320px] rounded-[8px] border border-white/15 bg-[#0a0c10] px-2.5 py-1.5 text-[12.5px] text-white outline-none transition-colors focus:border-[#00B4FF]/60"
          >
            {playable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          {playable.length} of {pack.network.sites.length} sites modeled
        </span>
      </div>

      {/* The replay, centered so it reads intentional on wide viewports.
          Keyed by site so switching sites cleanly remounts the animation. */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto h-full w-full max-w-3xl">
          <DriverJourneyReplay key={site.id} site={site} scenario={site.scenario} onClose={onExit} />
        </div>
      </div>
    </div>
  );
}
