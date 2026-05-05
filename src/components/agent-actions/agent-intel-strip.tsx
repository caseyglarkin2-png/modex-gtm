'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, RefreshCw, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentActionDialog } from '@/components/agent-actions/agent-action-dialog';
import type { AgentActionCard, AgentActionResult } from '@/lib/agent-actions/types';
import { readApiResponse } from '@/lib/api-response';
import type { AssetSendRecipient } from '@/components/email/asset-send-dialog';

type AgentIntelStripProps = {
  accountName: string;
  initialResult: AgentActionResult | null;
  recipients?: AssetSendRecipient[];
};

function safeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getCard(result: AgentActionResult | null, title: string): AgentActionCard | null {
  return result?.cards.find((entry) => entry.title === title) ?? null;
}

function getSourceCount(result: AgentActionResult | null) {
  if (!result) return 0;
  const decisionMakersPayload = (result.data.salesAgent as Record<string, unknown> | undefined)?.decisionMakers as Record<string, unknown> | undefined;
  const decisionMakers = Array.isArray(decisionMakersPayload?.decision_makers) ? decisionMakersPayload.decision_makers.length : 0;
  return [
    result.cards.length,
    Array.isArray(result.data.salesContacts) ? result.data.salesContacts.length : 0,
    decisionMakers,
  ].reduce((sum, value) => sum + value, 0);
}

function getConfidence(result: AgentActionResult | null) {
  if (!result || result.status === 'error') return 'low';
  const sourceCount = getSourceCount(result);
  if (result.status === 'ok' && sourceCount >= 8) return 'high';
  if (result.status === 'ok' || sourceCount >= 4) return 'medium';
  return 'low';
}

function extractChangeSignals(previous: AgentActionResult | null, next: AgentActionResult) {
  if (!previous) return [] as string[];

  const changes: string[] = [];

  if (previous.summary !== next.summary) {
    changes.push('research summary updated');
  }

  const cardTitles = ['Contact Coverage', 'Committee Coverage', 'Buyer Map', 'Proof / Signals'];
  for (const title of cardTitles) {
    const previousBody = safeString(getCard(previous, title)?.body);
    const nextBody = safeString(getCard(next, title)?.body);
    if (previousBody && nextBody && previousBody !== nextBody) {
      changes.push(`${title.toLowerCase()} changed`);
    }
  }

  const previousContacts = Array.isArray(previous.data.salesContacts) ? previous.data.salesContacts.length : 0;
  const nextContacts = Array.isArray(next.data.salesContacts) ? next.data.salesContacts.length : 0;
  if (previousContacts !== nextContacts) {
    changes.push(`contact coverage ${nextContacts > previousContacts ? 'expanded' : 'shifted'}`);
  }

  const previousNextAction = previous.nextActions[0] ?? '';
  const nextNextAction = next.nextActions[0] ?? '';
  if (previousNextAction && nextNextAction && previousNextAction !== nextNextAction) {
    changes.push('recommended next move changed');
  }

  return Array.from(new Set(changes)).slice(0, 3);
}

export function summarizeIntelChange(previous: AgentActionResult | null, next: AgentActionResult) {
  if (!previous) return '';
  const changes = extractChangeSignals(previous, next);
  if (changes.length === 0) return '';
  return `Changed since last refresh: ${changes.join(' · ')}.`;
}

function IntelCard({
  label,
  body,
  tone = 'default',
}: {
  label: string;
  body: string;
  tone?: 'default' | 'success' | 'warning';
}) {
  const borderTone = tone === 'warning'
    ? 'border-amber-200 bg-amber-50/70'
    : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50/60'
      : 'border-[var(--border)] bg-[var(--background)]/80';

  return (
    <div className={`rounded-xl border p-4 ${borderTone}`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-sm leading-6">{body}</p>
    </div>
  );
}

export function AgentIntelStrip({ accountName, initialResult, recipients = [] }: AgentIntelStripProps) {
  const [result, setResult] = useState<AgentActionResult | null>(initialResult);
  const [previousResult, setPreviousResult] = useState<AgentActionResult | null>(null);
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
        setPreviousResult(result);
        setResult(payload);
      }
    } finally {
      setRefreshing(false);
    }
  }, [accountName, result]);

  useEffect(() => {
    if (initialResult?.freshness.stale) {
      void refresh(true);
    }
  }, [initialResult?.freshness.stale, refresh]);

  const recommendation = useMemo(() => result?.nextActions[0] ?? 'Refresh intel to get the next best move.', [result]);
  const changeSummary = useMemo(() => (result ? summarizeIntelChange(previousResult, result) : ''), [previousResult, result]);
  const confidence = useMemo(() => getConfidence(result), [result]);
  const sourceCount = useMemo(() => getSourceCount(result), [result]);
  const researchCard = getCard(result, 'Research Summary');
  const coverageCard = getCard(result, 'Contact Coverage');
  const committeeCard = getCard(result, 'Committee Coverage');
  const buyerMapCard = getCard(result, 'Buyer Map');

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Agent Intel</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              No live account intel is cached yet. Pull research, contacts, and decision support into one view.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void refresh(true)} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Intel
          </Button>
        </div>
      </div>
    );
  }

  const degraded = result.status !== 'ok' || sourceCount === 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)]/20 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            <p className="text-sm font-medium">Agent Intel</p>
            <Badge variant="outline">{result.provider}</Badge>
            <Badge variant={result.freshness.stale ? 'secondary' : 'default'}>
              {result.freshness.stale ? 'stale' : result.freshness.source}
            </Badge>
            <Badge variant={confidence === 'high' ? 'default' : 'secondary'}>{confidence} confidence</Badge>
            <Badge variant="outline">{sourceCount} sources</Badge>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Next Best Move</p>
            <p className="mt-1 text-base font-semibold text-[var(--foreground)]">{recommendation}</p>
            <p className="mt-2 max-w-4xl text-sm text-[var(--muted-foreground)]">{result.summary}</p>
          </div>
          {changeSummary ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {changeSummary}
            </div>
          ) : null}
          {degraded ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {result.status === 'partial'
                ? 'Some sidecar inputs are partial. The recommendation is still usable, but verify committee and contact coverage before broad outreach.'
                : 'This account has thin live signal right now. Treat the intel as directional and keep discovering coverage.'}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <AgentActionDialog
            request={{ action: 'account_research', target: { accountName, company: accountName } }}
            title={`Research ${accountName}`}
            recipients={recipients}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Research Brief
              </Button>
            }
          />
          <AgentActionDialog
            request={{ action: 'company_contacts', target: { accountName, company: accountName } }}
            title={`Find More Contacts for ${accountName}`}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Find More Contacts
              </Button>
            }
          />
          <AgentActionDialog
            request={{ action: 'committee_refresh', target: { accountName, company: accountName } }}
            title={`Build Committee for ${accountName}`}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Build Committee
              </Button>
            }
          />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void refresh(true)} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Intel
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <IntelCard
          label="Research Summary"
          body={safeString(researchCard?.body) || 'No concise research summary is available yet.'}
          tone={researchCard?.tone ?? 'default'}
        />
        <IntelCard
          label="Contact Coverage"
          body={safeString(coverageCard?.body) || 'No contact coverage summary is available yet.'}
          tone={coverageCard?.tone ?? 'warning'}
        />
        <IntelCard
          label="Committee Coverage"
          body={safeString(committeeCard?.body) || 'Committee coverage has not been built yet.'}
          tone={committeeCard?.tone ?? 'warning'}
        />
        <IntelCard
          label="Buyer Map"
          body={safeString(buyerMapCard?.body) || 'No buyer map signal is available yet.'}
          tone={buyerMapCard?.tone ?? 'warning'}
        />
      </div>
    </div>
  );
}
