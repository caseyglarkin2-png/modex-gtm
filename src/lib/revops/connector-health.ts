import { isApolloConfigured } from '@/lib/enrichment/apollo-client';
import { isHubSpotConfigured } from '@/lib/hubspot/client';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';

export type ConnectorRuntimeStatus = {
  key: 'apollo' | 'hubspot';
  configured: boolean;
  enabled: boolean;
  owner: string;
  escalationChannel: string;
  runbookLink: string;
  lastRotationDate: string;
};

function envOr(name: string, fallback: string): string {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;
  return raw.trim();
}

export function getConnectorRuntimeStatuses(): ConnectorRuntimeStatus[] {
  return [
    {
      key: 'apollo',
      configured: isApolloConfigured(),
      enabled: true,
      owner: envOr('APOLLO_CONNECTOR_OWNER', 'RevOps Engineering'),
      escalationChannel: envOr('APOLLO_CONNECTOR_ESCALATION', '#revops-alerts'),
      runbookLink: envOr('APOLLO_CONNECTOR_RUNBOOK', '/docs/roadmaps/hubspot-sync-staged-enablement-runbook.md'),
      lastRotationDate: envOr('APOLLO_CONNECTOR_LAST_ROTATION_DATE', '2026-05-04'),
    },
    {
      key: 'hubspot',
      configured: isHubSpotConfigured(),
      enabled: HUBSPOT_SYNC_ENABLED,
      owner: envOr('HUBSPOT_CONNECTOR_OWNER', 'RevOps Engineering'),
      escalationChannel: envOr('HUBSPOT_CONNECTOR_ESCALATION', '#revops-alerts'),
      runbookLink: envOr('HUBSPOT_CONNECTOR_RUNBOOK', '/docs/roadmaps/hubspot-sync-staged-enablement-runbook.md'),
      lastRotationDate: envOr('HUBSPOT_CONNECTOR_LAST_ROTATION_DATE', '2026-05-04'),
    },
  ];
}
