export type OpsTabId =
  | 'proof-ledger'
  | 'cron-health'
  | 'generation-metrics'
  | 'provider-health'
  | 'feature-flags';

export type OpsTab = {
  id: OpsTabId;
  label: string;
  purpose: string;
};

export const opsWorkspaceTabs: OpsTab[] = [
  { id: 'proof-ledger', label: 'Proof Ledger', purpose: 'Latest sprint evidence, deployment metadata, and tested route links.' },
  { id: 'cron-health', label: 'Cron Health', purpose: 'Scheduler and job-runner health with canonical and legacy access.' },
  { id: 'generation-metrics', label: 'Generation Metrics', purpose: 'Generation/send throughput, failures, and stuck work.' },
  { id: 'provider-health', label: 'Provider Health', purpose: 'Model/provider distribution and failure concentration.' },
  { id: 'feature-flags', label: 'Feature Flags', purpose: 'Operational feature toggles affecting delivery behavior.' },
];

export function parseOpsTab(tab: string | undefined): OpsTabId {
  const ids = new Set(opsWorkspaceTabs.map((item) => item.id));
  return ids.has(tab as OpsTabId) ? (tab as OpsTabId) : 'proof-ledger';
}
