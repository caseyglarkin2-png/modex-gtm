export type SendGuardState = {
  hasQueueInFlight: boolean;
  isOutdatedVersion: boolean;
  requiresGuard: boolean;
  guardBlocksSend: boolean;
  warningMessage: string | null;
};

type BuildSendGuardInput = {
  selectedVersion: number;
  latestVersion: number;
  pendingJobs: number;
  processingJobs: number;
  previewMode: boolean;
  acknowledgedGuard: boolean;
};

export function buildSendGuardState(input: BuildSendGuardInput): SendGuardState {
  const hasQueueInFlight = input.pendingJobs > 0 || input.processingJobs > 0;
  const isOutdatedVersion = input.selectedVersion < input.latestVersion;
  const requiresGuard = hasQueueInFlight || isOutdatedVersion;
  const guardBlocksSend = requiresGuard && (!input.previewMode || !input.acknowledgedGuard);

  let warningMessage: string | null = null;
  if (isOutdatedVersion) {
    warningMessage = `Version ${input.selectedVersion} is older than latest version ${input.latestVersion}.`;
  } else if (hasQueueInFlight) {
    warningMessage = 'New generation jobs are still in queue for this account.';
  }

  return {
    hasQueueInFlight,
    isOutdatedVersion,
    requiresGuard,
    guardBlocksSend,
    warningMessage,
  };
}
