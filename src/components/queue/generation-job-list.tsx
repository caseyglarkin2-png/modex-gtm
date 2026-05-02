'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export interface GenerationJobRow {
  id: number;
  account_name: string;
  campaign_id?: number;
  persona_name?: string;
  content_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider_used?: string;
  error_message?: string;
  ai_error_type?: string;
  retry_count: number;
  created_at: string;
  completed_at?: string;
  campaign_name?: string;
}

interface GenerationJobListProps {
  jobs: GenerationJobRow[];
  onRetry?: (jobId: number) => Promise<void>;
}

export function GenerationJobList({ jobs, onRetry }: GenerationJobListProps) {
  const [displayJobs, setDisplayJobs] = useState<GenerationJobRow[]>(jobs);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  useEffect(() => {
    setDisplayJobs(jobs);
  }, [jobs]);

  const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const retryViaApi = async (jobId: number) => {
    const response = await fetch(`/api/ai/generation-jobs/${jobId}/retry`, { method: 'POST' });
    const payload = await response.json().catch(() => ({} as { error?: string }));
    if (!response.ok) {
      throw new Error(payload.error ?? 'Retry failed');
    }
  };

  const handleRetry = async (jobId: number) => {
    setRetryingId(jobId);
    try {
      if (onRetry) {
        await onRetry(jobId);
      } else {
        await retryViaApi(jobId);
      }
      setDisplayJobs((prev) => prev.map((job) => (
        job.id === jobId
          ? { ...job, status: 'pending', error_message: undefined }
          : job
      )));
      toast.success('Retry queued');
    } catch (err) {
      toast.error(`Retry failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRetryingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Zap className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  if (displayJobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No generation jobs to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {displayJobs.map((job) => (
        <Card key={job.id} className={job.status === 'failed' ? 'border-red-200' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">
                  <Link href={`/accounts/${slugify(job.account_name)}`} className="hover:underline">
                    {job.account_name}
                  </Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {job.campaign_name && `Campaign: ${job.campaign_name}`}
                  {job.persona_name && ` • Persona: ${job.persona_name}`}
                </p>
              </div>
              {statusBadge(job.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium capitalize">{job.status}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Provider:</span>
                <p className="font-medium">{job.provider_used || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Retries:</span>
                <p className="font-medium">{job.retry_count}/3</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{new Date(job.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {job.error_message && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-900">Error:</p>
                <p className="text-xs text-red-700">{job.error_message.slice(0, 200)}</p>
                {job.ai_error_type && <p className="mt-1 text-xs text-red-600">Type: {job.ai_error_type}</p>}
              </div>
            )}

            {job.status === 'completed' && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/accounts/${slugify(job.account_name)}`}>
                  View & Send
                </Link>
              </Button>
            )}

            {job.status === 'failed' && job.retry_count < 3 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleRetry(job.id)}
                disabled={retryingId === job.id}
              >
                {retryingId === job.id ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Generation
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
