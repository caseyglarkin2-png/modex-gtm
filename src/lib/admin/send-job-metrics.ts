export type SendJobMetricRow = {
  status: string;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
};

export type SendJobRecipientMetricRow = {
  account_name: string;
  to_email: string;
  status: string;
  error_message: string | null;
  created_at: Date;
};

export type SendJobMetricsSnapshot = {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  partialJobs: number;
  failedJobs: number;
  sentRecipients: number;
  failedRecipients: number;
  skippedRecipients: number;
  avgCompletionSeconds: number;
  recentFailedRecipients: Array<{
    accountName: string;
    toEmail: string;
    error: string;
    createdAt: Date;
  }>;
};

function toSeconds(ms: number): number {
  return Math.round((ms / 1000) * 10) / 10;
}

export function computeSendJobMetrics(
  jobs: SendJobMetricRow[],
  recipients: SendJobRecipientMetricRow[],
): SendJobMetricsSnapshot {
  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter((job) => job.status === 'pending').length;
  const processingJobs = jobs.filter((job) => job.status === 'processing').length;
  const completedJobs = jobs.filter((job) => job.status === 'completed').length;
  const partialJobs = jobs.filter((job) => job.status === 'partial').length;
  const failedJobs = jobs.filter((job) => job.status === 'failed').length;

  const sentRecipients = jobs.reduce((sum, job) => sum + (job.sent_count ?? 0), 0);
  const failedRecipients = jobs.reduce((sum, job) => sum + (job.failed_count ?? 0), 0);
  const skippedRecipients = jobs.reduce((sum, job) => sum + (job.skipped_count ?? 0), 0);

  const durations = jobs
    .filter((job) => job.started_at && job.completed_at)
    .map((job) => job.completed_at!.getTime() - job.started_at!.getTime())
    .filter((duration) => duration >= 0);

  const avgCompletionSeconds = durations.length > 0
    ? toSeconds(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
    : 0;

  const recentFailedRecipients = recipients
    .filter((recipient) => recipient.status === 'failed')
    .sort((left, right) => right.created_at.getTime() - left.created_at.getTime())
    .slice(0, 10)
    .map((recipient) => ({
      accountName: recipient.account_name,
      toEmail: recipient.to_email,
      error: recipient.error_message ?? 'Unknown error',
      createdAt: recipient.created_at,
    }));

  return {
    totalJobs,
    pendingJobs,
    processingJobs,
    completedJobs,
    partialJobs,
    failedJobs,
    sentRecipients,
    failedRecipients,
    skippedRecipients,
    avgCompletionSeconds,
    recentFailedRecipients,
  };
}
