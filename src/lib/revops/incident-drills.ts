export type IncidentScenario = 'auth_failure' | 'rate_limit_burst' | 'schema_drift';
export type IncidentSeverity = 'high' | 'medium';

export type IncidentDrillResult = {
  scenario: IncidentScenario;
  severity: IncidentSeverity;
  slaMinutes: number;
  remediationPath: string[];
};

export function runConnectorIncidentDrill(scenario: IncidentScenario): IncidentDrillResult {
  if (scenario === 'auth_failure') {
    return {
      scenario,
      severity: 'high',
      slaMinutes: 15,
      remediationPath: [
        'disable_hubspot_sync_flag',
        'rotate_token',
        'verify_connector_health',
        're_enable_canary',
      ],
    };
  }
  if (scenario === 'rate_limit_burst') {
    return {
      scenario,
      severity: 'medium',
      slaMinutes: 30,
      remediationPath: [
        'reduce_batch_size',
        'increase_backoff',
        'run_dry_sync',
        'resume_processing',
      ],
    };
  }
  return {
    scenario,
    severity: 'medium',
    slaMinutes: 30,
    remediationPath: [
      'freeze_external_writes',
      'review_mapping_contract_versions',
      'run_reconciliation',
      'resume_after_validation',
    ],
  };
}
