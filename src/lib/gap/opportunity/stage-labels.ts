/**
 * Deal stage NAMES (click test: "In a deal (1417384082)" and "appointmentscheduled"). HubSpot deals carry a stage
 * id; its label lives on the pipeline. Read once per server instance per hour; a failed read falls back to the id
 * (never blocks a page). Display only.
 */
import { getHubSpotClient, withHubSpotRetry } from '@/lib/hubspot/client';

const TTL = 60 * 60_000;
let cached: { at: number; labels: Map<string, string> } | null = null;

export type StageLabelRead = () => Promise<Array<{ stages?: Array<{ id: string; label: string }> }>>;

const hubspotStages: StageLabelRead = async () => {
  const res = await withHubSpotRetry(() => getHubSpotClient().crm.pipelines.pipelinesApi.getAll('deals'), 'gap deal pipeline stages');
  return (res.results ?? []).map((p) => ({ stages: (p.stages ?? []).map((s) => ({ id: String(s.id), label: String(s.label) })) }));
};

/** Stage id to label for every deal pipeline (cached an hour), or an empty map when it cannot be read. */
export async function stageLabels(read: StageLabelRead = hubspotStages, now = Date.now()): Promise<Map<string, string>> {
  const cacheable = read === hubspotStages;
  if (cacheable && cached && now - cached.at < TTL) return cached.labels;
  try {
    const labels = new Map<string, string>();
    for (const p of await read()) for (const s of p.stages ?? []) if (s.id && s.label) labels.set(s.id, s.label);
    if (cacheable) cached = { at: now, labels };
    return labels;
  } catch {
    return new Map();
  }
}
