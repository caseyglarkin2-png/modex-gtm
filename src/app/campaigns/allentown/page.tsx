import type { Metadata } from 'next';
import './console.css';
import { inter, jetbrainsMono } from './fonts';
import {
  resolveClawdBaseUrl,
  resolveClawdToken,
} from '@/lib/signal-bridge/clawd-export-client';
import {
  adaptCanonicalView,
  type CommandCenterView,
  type RawCanonicalCampaign,
} from '@/lib/campaigns/canonical-view';
import { loadLatestScored, buildCuratedRows, filterProspects } from '@/lib/discovery/data';
import type { Corridor, ProspectRow } from '@/lib/discovery/types';
import { CommandCenter } from './_components/console';

export const dynamic = 'force-dynamic';

// The discovery corridor this campaign anchors on (Breinigsville / Lehigh Valley).
const ALLENTOWN_CORRIDOR = 'Allentown, PA';

export const metadata: Metadata = {
  title: 'Allentown Tour — Command Center',
  robots: { index: false, follow: false },
};

const CAMPAIGN_TAG = 'allentown-tour';

interface FetchResult {
  view: CommandCenterView | null;
  error: string | null;
}

async function loadCanonicalView(): Promise<FetchResult> {
  const token = resolveClawdToken();
  if (!token) {
    return { view: null, error: 'Missing clawd API token (MC_API_TOKEN).' };
  }
  const base = resolveClawdBaseUrl().replace(/\/+$/, '');
  const url = `${base}/api/canonical/campaign/${CAMPAIGN_TAG}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { view: null, error: `Canonical endpoint returned ${res.status}.` };
    }
    const json = (await res.json()) as RawCanonicalCampaign;
    if (!json || !Array.isArray(json.accounts) || !Array.isArray(json.persons)) {
      return { view: null, error: 'Canonical response missing accounts/persons.' };
    }
    return { view: adaptCanonicalView(json), error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown fetch error';
    return { view: null, error: `Could not reach the canonical endpoint: ${message}` };
  }
}

/**
 * Load the Allentown-corridor prospects + corridors from the discovery pipeline
 * for the real corridor map. Fail-soft: any error yields empty arrays so the map
 * renders an empty state and the page still loads.
 */
function loadCorridorProspects(): { prospects: ProspectRow[]; corridors: Corridor[] } {
  try {
    const output = loadLatestScored();
    if (!output) return { prospects: [], corridors: [] };
    const rows = buildCuratedRows(output);
    const prospects = filterProspects(rows, { corridor: ALLENTOWN_CORRIDOR });
    return { prospects, corridors: output.corridors ?? [] };
  } catch {
    return { prospects: [], corridors: [] };
  }
}

export default async function AllentownCommandCenterPage() {
  const { view, error } = await loadCanonicalView();
  const { prospects, corridors } = loadCorridorProspects();
  const scopeClass = `cc-scope ${inter.variable} ${jetbrainsMono.variable}`;

  if (!view) {
    return (
      <div className={`${scopeClass} cc-unavailable`}>
        <div className="cc-retry">
          <h2>Canonical view unavailable</h2>
          <p>
            The Allentown command center could not load the live canonical campaign. This is a
            read of the clawd ledger and does not send anything. Refresh to retry.
          </p>
          {error && <div className="mono">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={scopeClass}>
      <CommandCenter view={view} prospects={prospects} corridors={corridors} />
    </div>
  );
}
