export type StuckGenerationJobRow = {
  id: number;
  account_name: string;
  status: string;
  started_at: Date | null;
  updated_at: Date;
};

export type StuckSendJobRow = {
  id: number;
  status: string;
  started_at: Date | null;
  updated_at: Date;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
};

export type StuckJobRecord = {
  kind: 'generation' | 'send';
  id: number;
  label: string;
  ageMinutes: number;
  recommendedAction: string;
  updatedAt: Date;
};

type ComputeStuckJobsInput = {
  generationJobs: StuckGenerationJobRow[];
  sendJobs: StuckSendJobRow[];
  thresholdMs?: number;
  now?: Date;
};

function ageMs(startedAt: Date | null, updatedAt: Date, nowMs: number): number {
  const baseline = startedAt?.getTime() ?? updatedAt.getTime();
  return nowMs - baseline;
}

export function computeStuckJobs(input: ComputeStuckJobsInput): StuckJobRecord[] {
  const thresholdMs = input.thresholdMs ?? 15 * 60 * 1000;
  const nowMs = (input.now ?? new Date()).getTime();

  const generation = input.generationJobs
    .filter((job) => job.status === 'processing')
    .map((job) => ({
      job,
      ageMs: ageMs(job.started_at, job.updated_at, nowMs),
    }))
    .filter(({ ageMs: jobAgeMs }) => jobAgeMs > thresholdMs)
    .map(({ job, ageMs: jobAgeMs }) => ({
      kind: 'generation' as const,
      id: job.id,
      label: job.account_name,
      ageMinutes: Math.floor(jobAgeMs / 60_000),
      recommendedAction: 'Retry generation job if worker logs show no progress.',
      updatedAt: job.updated_at,
    }));

  const send = input.sendJobs
    .filter((job) => job.status === 'processing')
    .map((job) => ({
      job,
      ageMs: ageMs(job.started_at, job.updated_at, nowMs),
    }))
    .filter(({ ageMs: jobAgeMs }) => jobAgeMs > thresholdMs)
    .map(({ job, ageMs: jobAgeMs }) => ({
      kind: 'send' as const,
      id: job.id,
      label: `Send Job #${job.id}`,
      ageMinutes: Math.floor(jobAgeMs / 60_000),
      recommendedAction: 'Open tracker and retry failed recipients after job review.',
      updatedAt: job.updated_at,
    }));

  return [...generation, ...send].sort((left, right) => right.ageMinutes - left.ageMinutes);
}
