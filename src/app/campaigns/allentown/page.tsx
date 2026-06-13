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
import { CommandCenter } from './_components/console';

export const dynamic = 'force-dynamic';

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

export default async function AllentownCommandCenterPage() {
  const { view, error } = await loadCanonicalView();
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
      <CommandCenter view={view} />
    </div>
  );
}
