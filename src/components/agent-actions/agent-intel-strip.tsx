'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
import type { AgentActionResult } from '@/lib/agent-actions/types';
import { readApiResponse } from '@/lib/api-response';

type AgentIntelStripProps = {
  accountName: string;
  initialResult: AgentActionResult | null;
};

export function AgentIntelStrip({ accountName, initialResult }: AgentIntelStripProps) {
  const [result, setResult] = useState<AgentActionResult | null>(initialResult);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (force = false) => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/agent-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'content_context',
          refresh: force,
          target: { accountName, company: accountName },
        }),
      });
      const payload = await readApiResponse<AgentActionResult>(response);
      if (response.ok) {
        setResult(payload);
      }
    } finally {
      setRefreshing(false);
    }
  }, [accountName]);

  useEffect(() => {
    if (initialResult?.freshness.stale) {
      void refresh(true);
    }
  }, [initialResult?.freshness.stale, refresh]);

  if (!result) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-600" />
          <p className="text-sm font-medium">Agent Intel</p>
          <Badge variant="outline">{result.provider}</Badge>
          <Badge variant={result.freshness.stale ? 'secondary' : 'default'}>
            {result.freshness.stale ? 'stale' : result.freshness.source}
          </Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void refresh(true)} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Intel
        </Button>
      </div>
      <p className="mt-2 text-sm">{result.summary}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-4">
        {result.cards.slice(0, 4).map((entry) => (
          <div key={`${entry.title}-${entry.body.slice(0, 16)}`} className="rounded-md border bg-background/80 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{entry.title}</p>
            <p className="mt-2 text-xs text-muted-foreground line-clamp-4">{entry.body}</p>
          </div>
        ))}
      </div>
      {result.nextActions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.nextActions.map((action) => (
            <Badge key={action} variant="outline">{action}</Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
