export type RefreshDiagnosticStatus = 'started' | 'success' | 'error' | 'skipped';

export type RefreshDiagnosticEvent = {
  id: number;
  surface: string;
  trigger: string;
  status: RefreshDiagnosticStatus;
  timestamp: string;
  durationMs?: number;
  inFlightCount: number;
  metadata?: Record<string, unknown>;
  reason?: string;
};

type RefreshSession = {
  id: number;
  startMs: number;
  surface: string;
  trigger: string;
  metadata?: Record<string, unknown>;
};

declare global {
  interface Window {
    __modexRefreshDiagnostics?: RefreshDiagnosticEvent[];
  }
}

let sequence = 0;
let inFlightCount = 0;

function pushRefreshEvent(event: RefreshDiagnosticEvent) {
  if (typeof window !== 'undefined') {
    window.__modexRefreshDiagnostics = window.__modexRefreshDiagnostics ?? [];
    window.__modexRefreshDiagnostics.push(event);
  }
}

export function beginRefreshDiagnostic(input: {
  surface: string;
  trigger: string;
  metadata?: Record<string, unknown>;
}): RefreshSession {
  sequence += 1;
  inFlightCount += 1;

  pushRefreshEvent({
    id: sequence,
    surface: input.surface,
    trigger: input.trigger,
    status: 'started',
    timestamp: new Date().toISOString(),
    inFlightCount,
    metadata: input.metadata,
  });

  return {
    id: sequence,
    startMs: Date.now(),
    surface: input.surface,
    trigger: input.trigger,
    metadata: input.metadata,
  };
}

export function endRefreshDiagnostic(
  session: RefreshSession,
  input: {
    status: Exclude<RefreshDiagnosticStatus, 'started'>;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
) {
  inFlightCount = Math.max(0, inFlightCount - 1);

  pushRefreshEvent({
    id: session.id,
    surface: session.surface,
    trigger: session.trigger,
    status: input.status,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - session.startMs,
    inFlightCount,
    metadata: input.metadata ?? session.metadata,
    reason: input.reason,
  });
}
