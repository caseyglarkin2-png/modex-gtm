'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { readApiResponse } from '@/lib/api-response';
import type { AgentActionRequest, AgentActionResult } from '@/lib/agent-actions/types';

type AgentActionDialogRequest = Omit<AgentActionRequest, 'refresh' | 'depth'> & {
  refresh?: boolean;
  depth?: AgentActionRequest['depth'];
};

type AgentActionDialogProps = {
  request: AgentActionDialogRequest;
  title?: string;
  trigger: React.ReactNode;
  autoLoad?: boolean;
  onResult?: (result: AgentActionResult) => void;
};

function extractDraft(result: AgentActionResult): { subject?: string; body?: string } | null {
  const draft = result.data.draft as
    | { subject?: string; body?: string; draft?: string | { subject?: string; body?: string } }
    | undefined;
  if (!draft) return null;
  if (draft.subject || draft.body) return { subject: draft.subject, body: draft.body };
  if (typeof draft.draft === 'string') return { body: draft.draft };
  if (draft.draft?.subject || draft.draft?.body) return { subject: draft.draft.subject, body: draft.draft.body };
  return null;
}

function toneVariant(tone: string | undefined): 'default' | 'secondary' | 'destructive' {
  if (tone === 'warning') return 'secondary';
  if (tone === 'error') return 'destructive';
  return 'default';
}

export function AgentActionDialog({
  request,
  title,
  trigger,
  autoLoad = true,
  onResult,
}: AgentActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentActionResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  const run = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          refresh,
          depth: request.depth ?? 'quick',
        }),
      });
      const payload = await readApiResponse<AgentActionResult & { error?: string }>(response);
      if (!response.ok && !payload.summary) {
        throw new Error(payload.error ?? 'Agent action failed');
      }
      setResult(payload as AgentActionResult);
      setLoaded(true);
      onResult?.(payload as AgentActionResult);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Agent action failed');
    } finally {
      setLoading(false);
    }
  }, [onResult, request]);

  useEffect(() => {
    if (open && autoLoad && !loaded && !loading) {
      void run();
    }
  }, [autoLoad, loaded, loading, open, run]);

  const draft = useMemo(() => (result ? extractDraft(result) : null), [result]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            {title ?? request.action.replace(/_/g, ' ')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={toneVariant(result?.status)}>{result?.status ?? 'pending'}</Badge>
            {result ? <Badge variant="outline">{result.provider}</Badge> : null}
            {result ? <Badge variant="outline">{result.freshness.source}</Badge> : null}
            {result?.freshness.stale ? <Badge variant="secondary">stale</Badge> : null}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 rounded-lg border p-6 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Running live agent action...
            </div>
          ) : null}

          {result ? (
            <>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
                <p className="mt-2 text-sm">{result.summary}</p>
              </div>

              <div className="grid gap-3">
                {result.cards.map((entry) => (
                  <div key={`${entry.title}-${entry.body.slice(0, 16)}`} className="rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{entry.title}</p>
                      {entry.tone ? <Badge variant={toneVariant(entry.tone)}>{entry.tone}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words">{entry.body}</p>
                  </div>
                ))}
              </div>

              {draft ? (
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Draft Preview</p>
                  {draft.subject ? <p className="mt-2 text-sm font-medium">{draft.subject}</p> : null}
                  {draft.body ? <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words">{draft.body}</p> : null}
                </div>
              ) : null}

              {result.nextActions.length > 0 ? (
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Next Actions</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.nextActions.map((action) => (
                      <Badge key={action} variant="outline">{action}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void run(true)} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
