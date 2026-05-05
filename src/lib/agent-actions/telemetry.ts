type WorkflowTelemetryPayload = {
  event: string;
  accountName?: string;
  action?: string;
  provider?: string;
  status?: string;
  email?: string;
  message?: string;
  metric?: string;
  value?: number;
  count?: number;
  details?: Record<string, unknown>;
};

export async function recordWorkflowEvent(payload: WorkflowTelemetryPayload): Promise<void> {
  try {
    await fetch('/api/agent-actions/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking telemetry.
  }
}

export async function recordWorkflowMetric(
  metric: string,
  payload: Omit<WorkflowTelemetryPayload, 'event' | 'metric'> = {},
): Promise<void> {
  return recordWorkflowEvent({
    event: 'workflow_metric',
    metric,
    ...payload,
  });
}
