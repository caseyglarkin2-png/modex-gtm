/**
 * Agent failure classes (A01, GAP OS AI recovery, 2026-10-08). A handler that throws a PermanentAgentError ends its
 * task FINAL on that attempt (tasks.ts): a missing or invalid credential, a model that does not exist, exhausted
 * billing, a spent budget or a configuration gap does not get better by trying again five minutes later, and
 * retrying it only spends attempts, time and sometimes money. Any other throw stays a transient failure with the
 * runner's bounded attempts (AGENT_TASK_MAX_ATTEMPTS, one per cron tick). The item and Casey's decision are never
 * touched by either: the task row carries the reason and the recovery in words.
 */
export type PermanentAgentErrorCode = 'billing' | 'authentication' | 'model_missing' | 'configuration' | 'monthly_ceiling' | 'task_budget' | 'could_not_satisfy';

export class PermanentAgentError extends Error {
  readonly permanent = true as const;
  readonly code: PermanentAgentErrorCode;

  constructor(code: PermanentAgentErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = 'PermanentAgentError';
    this.code = code;
  }
}

export function isPermanentAgentError(err: unknown): err is PermanentAgentError {
  return err instanceof PermanentAgentError || (typeof err === 'object' && err !== null && (err as { permanent?: unknown }).permanent === true);
}
