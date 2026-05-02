'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type SendJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial' | 'cancelled';

type SendJobRecipient = {
  id: number;
  generated_content_id: number;
  account_name: string;
  persona_name: string | null;
  to_email: string;
  status: string;
  error_message: string | null;
  hubspot_engagement_id: string | null;
};

type SendJobResponse = {
  success: boolean;
  job: {
    id: number;
    status: SendJobStatus;
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    skipped_count: number;
    recipients: SendJobRecipient[];
  };
  recipientCounts: Record<string, number>;
};

type SendJobTrackerProps = {
  jobId: number;
  pollMs?: number;
};

export function SendJobTracker({ jobId, pollMs = 3000 }: SendJobTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<SendJobResponse['job'] | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const terminal = useMemo(
    () => job?.status === 'completed' || job?.status === 'partial' || job?.status === 'failed' || job?.status === 'cancelled',
    [job?.status],
  );

  const fetchStatus = useCallback(async () => {
    const response = await fetch(`/api/email/send-jobs/${jobId}`);
    if (!response.ok) throw new Error('Failed to fetch send job status');
    const payload = await response.json() as SendJobResponse;
    setJob(payload.job);
  }, [jobId]);

  async function refreshNow() {
    setRefreshing(true);
    try {
      await fetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh send job');
    } finally {
      setRefreshing(false);
    }
  }

  async function retryFailed() {
    setRetrying(true);
    try {
      const response = await fetch(`/api/email/send-jobs/${jobId}/retry-failed`, { method: 'POST' });
      const payload = await response.json().catch(() => ({} as { error?: string; resetRecipients?: number }));
      if (!response.ok) throw new Error(payload.error ?? 'Retry failed');
      toast.success(`Reset ${payload.resetRecipients ?? 0} failed recipient(s)`);
      await fetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      try {
        await fetchStatus();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    intervalId = setInterval(() => {
      if (!terminal) void run();
    }, pollMs);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchStatus, pollMs, terminal]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">Loading send job #{jobId}…</CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">Send job not found.</CardContent>
      </Card>
    );
  }

  const retryableCount = job.recipients.filter((recipient) => recipient.status === 'failed' || recipient.status === 'skipped').length;
  const recipients = [...job.recipients].sort((left, right) => {
    const rank = (status: string) => (status === 'failed' ? 0 : status === 'sending' ? 1 : status === 'pending' ? 2 : status === 'sent' ? 3 : 4);
    return rank(left.status) - rank(right.status);
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Send Job #{job.id}</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refreshNow} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Badge variant="outline" className="capitalize">{job.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <div className="rounded-md border p-2">Total: {job.total_recipients}</div>
          <div className="rounded-md border p-2">Sent: {job.sent_count}</div>
          <div className="rounded-md border p-2">Failed: {job.failed_count}</div>
          <div className="rounded-md border p-2">Skipped: {job.skipped_count}</div>
        </div>

        {retryableCount > 0 && (
          <Button variant="outline" size="sm" onClick={retryFailed} disabled={retrying}>
            {retrying ? 'Retrying…' : `Retry Failed Recipients (${retryableCount})`}
          </Button>
        )}

        <div className="space-y-2">
          {recipients.map((recipient) => (
            <div key={recipient.id} className="rounded-md border p-2 text-xs">
              <p className="font-medium">{recipient.account_name} • {recipient.to_email}</p>
              <p className="text-muted-foreground">
                Status: <span className="capitalize">{recipient.status}</span>
                {recipient.hubspot_engagement_id ? ` • HubSpot ${recipient.hubspot_engagement_id}` : ''}
              </p>
              {recipient.error_message && <p className="text-red-600">{recipient.error_message}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
