'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { readApiResponse } from '@/lib/api-response';
import type { AgentActionRequest, AgentActionResult, AgentActionTarget, AgentActionType } from '@/lib/agent-actions/types';
import { EmailComposer } from '@/components/email/composer';
import { OnePagerDialog } from '@/components/ai/one-pager-preview';
import type { AssetSendRecipient } from '@/components/email/asset-send-dialog';
import { recordWorkflowEvent } from '@/lib/agent-actions/telemetry';
import { beginRefreshDiagnostic, endRefreshDiagnostic } from '@/lib/refresh-diagnostics';
import { SourceAttributionPanel } from '@/components/source-backed/source-attribution-panel';
import { useControllableOpen } from '@/lib/use-controllable-open';
import type { SourceBackedContractV1 } from '@/lib/source-backed/attribution';

type AgentActionDialogRequest = Omit<AgentActionRequest, 'refresh' | 'depth'> & {
  refresh?: boolean;
  depth?: AgentActionRequest['depth'];
};

type AgentActionDialogProps = {
  request: AgentActionDialogRequest;
  title?: string;
  trigger?: React.ReactNode;
  autoLoad?: boolean;
  onResult?: (result: AgentActionResult) => void;
  recipients?: AssetSendRecipient[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type SuggestedContact = {
  name: string;
  email?: string;
  title?: string;
  source: string;
  recommended?: boolean;
};

type DraftShape = {
  subject?: string;
  body?: string;
};

type ResearchBrief = {
  recommendation: string;
  whyNow: string[];
  bestAngle: string;
  proof: string[];
  risks: string[];
};

type CommitteeSummary = {
  count: number;
  decisionMaker?: string;
  members: SuggestedContact[];
};

function toneVariant(tone: string | undefined): 'default' | 'secondary' | 'destructive' {
  if (tone === 'warning' || tone === 'partial') return 'secondary';
  if (tone === 'error') return 'destructive';
  return 'default';
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function extractRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(Boolean) as Array<Record<string, unknown>> : [];
}

function summarizeChange(previous: AgentActionResult | null, next: AgentActionResult) {
  if (!previous) return '';
  if (previous.summary !== next.summary) return 'Updated with fresh signal changes.';
  const previousContacts = extractSuggestedContacts(previous).length;
  const nextContacts = extractSuggestedContacts(next).length;
  if (previousContacts !== nextContacts) {
    const delta = nextContacts - previousContacts;
    return delta > 0 ? `${delta} more live contacts surfaced.` : `${Math.abs(delta)} fewer live contacts surfaced.`;
  }
  return 'Refreshed with no major visible changes.';
}

function getAccountName(result: AgentActionResult | null, request: AgentActionDialogRequest) {
  return safeString(result?.data.account && (result.data.account as Record<string, unknown>).name)
    || request.target.accountName
    || request.target.company
    || '';
}

function getSourceCount(result: AgentActionResult | null) {
  if (!result) return 0;
  const research = result.data.research as Record<string, unknown> | undefined;
  const news = extractRecords(research?.news);
  const contacts = extractSuggestedContacts(result);
  const committee = extractCommittee(result);
  return news.length + contacts.length + committee.count;
}

function getConfidenceLabel(result: AgentActionResult | null): 'high' | 'medium' | 'low' {
  if (!result || result.status === 'error') return 'low';
  const sourceCount = getSourceCount(result);
  if (result.status === 'ok' && sourceCount >= 4) return 'high';
  if (result.status === 'ok' || sourceCount >= 2) return 'medium';
  return 'low';
}

function extractDraft(result: AgentActionResult): DraftShape | null {
  const draft = result.data.draft as
    | { subject?: string; body?: string; draft?: string | { subject?: string; body?: string } }
    | undefined;
  if (!draft) return null;
  if (draft.subject || draft.body) return { subject: draft.subject, body: draft.body };
  if (typeof draft.draft === 'string') return { body: draft.draft };
  if (draft.draft?.subject || draft.draft?.body) return { subject: draft.draft.subject, body: draft.draft.body };
  return null;
}

function extractSourceAttribution(result: AgentActionResult): SourceBackedContractV1 | null {
  const data = result.data as Record<string, unknown>;
  const candidate = data.sourceAttribution ?? data.attribution ?? null;
  if (!candidate || typeof candidate !== 'object') return null;
  const contract = candidate as Record<string, unknown>;
  if (contract.contract !== 'source_backed_contract_v1') return null;
  return contract as unknown as SourceBackedContractV1;
}

function extractSuggestedContacts(result: AgentActionResult): SuggestedContact[] {
  const data = result.data as Record<string, unknown>;
  const pools = [
    extractRecords(data.contacts),
    extractRecords(data.salesContacts),
    extractRecords(data.decisionMakers),
    extractRecords((data.salesAgent as Record<string, unknown> | undefined)?.decisionMakers && ((data.salesAgent as Record<string, unknown>).decisionMakers as Record<string, unknown>).decision_makers),
  ].flat();

  const seen = new Set<string>();
  return pools
    .map((item, index) => ({
      name: safeString(item.name) || safeString(item.full_name) || safeString(item.first_name),
      email: safeString(item.email) || undefined,
      title: safeString(item.title) || safeString(item.job_title) || undefined,
      source: safeString(item.source) || (index === 0 ? result.provider : 'sidecar'),
      recommended: index === 0,
    }))
    .filter((contact) => contact.name || contact.email)
    .filter((contact) => {
      const key = (contact.email ?? contact.name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function extractResearchBrief(result: AgentActionResult): ResearchBrief {
  const data = result.data as Record<string, unknown>;
  const account = (data.account ?? {}) as Record<string, unknown>;
  const workbench = (data.workbench ?? {}) as Record<string, unknown>;
  const company = ((workbench.company ?? {}) as Record<string, unknown>);
  const research = (data.research ?? {}) as Record<string, unknown>;
  const news = extractRecords(research.news);
  const suggestedContacts = extractSuggestedContacts(result);
  const whyNow = [
    safeString(result.summary),
    safeString(account.whyNow),
    safeString(account.primoAngle),
  ].filter(Boolean);
  const risks = [
    !safeString(account.whyNow) ? 'Why-now signal still needs operator confirmation.' : '',
    suggestedContacts.length === 0 ? 'No live contacts found yet.' : '',
    result.status === 'partial' ? 'Sidecar response is partial; verify before broad outreach.' : '',
  ].filter(Boolean);

  return {
    recommendation: suggestedContacts.length > 0 ? 'Pursue now' : 'Needs more proof',
    whyNow,
    bestAngle: safeString(account.primoAngle)
      || safeString((data.salesAgent as Record<string, unknown> | undefined)?.accountAnalysis && (((data.salesAgent as Record<string, unknown>).accountAnalysis as Record<string, unknown>).analysis as Record<string, unknown> | undefined)?.pain_points && 'Operational variance and throughput standardization'),
    proof: [
      safeString(company.description),
      ...news.slice(0, 3).map((item) => safeString(item.title) || safeString(item.headline)),
    ].filter(Boolean),
    risks,
  };
}

function extractCommittee(result: AgentActionResult): CommitteeSummary {
  const data = result.data as Record<string, unknown>;
  const committee = ((data.committee ?? data) as Record<string, unknown>);
  const members = extractRecords(committee.members).map((member, index) => ({
    name: safeString(member.name) || safeString(member.email),
    email: safeString(member.email) || undefined,
    title: safeString(member.title) || undefined,
    source: 'committee',
    recommended: index === 0,
  }));
  return {
    count: typeof committee.member_count === 'number' ? committee.member_count : members.length,
    decisionMaker: safeString(committee.decision_maker) || undefined,
    members,
  };
}

function buildActionLabel(action: AgentActionType) {
  switch (action) {
    case 'account_research':
      return 'Research Brief';
    case 'company_contacts':
    case 'prospect_discover':
      return 'Contact Finder';
    case 'committee_refresh':
      return 'Committee View';
    case 'draft_outreach':
      return 'Draft Preview';
    case 'content_context':
      return 'Account Intel';
    default:
      return action.replace(/_/g, ' ');
  }
}

function buildLoadingCopy(action: AgentActionType) {
  switch (action) {
    case 'account_research':
    case 'content_context':
      return 'Pulling live research, signals, and recommended angle...';
    case 'company_contacts':
    case 'prospect_discover':
      return 'Looking for the best next people to contact...';
    case 'draft_outreach':
      return 'Drafting outreach and preparing the fastest next step...';
    case 'committee_refresh':
      return 'Checking committee coverage and buyer-map gaps...';
    default:
      return 'Running live agent action...';
  }
}

function buildRefreshLabel(action: AgentActionType) {
  switch (action) {
    case 'account_research':
    case 'content_context':
      return 'Refresh Intel';
    case 'draft_outreach':
      return 'Regenerate Draft';
    default:
      return 'Refresh Result';
  }
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="ml-1 font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function Section({
  title,
  description,
  tone = 'default',
  children,
}: {
  title: string;
  description?: string;
  tone?: 'default' | 'success' | 'warning';
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--background)]/80 p-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{title}</p>
        <Badge variant={toneVariant(tone)}>{tone}</Badge>
      </div>
      {description ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted-foreground)]">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 text-cyan-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactFinderView({
  result,
  selectedKey,
  onSelect,
}: {
  result: AgentActionResult;
  selectedKey: string | null;
  onSelect: (contact: SuggestedContact) => void;
}) {
  const contacts = extractSuggestedContacts(result);
  if (contacts.length === 0) {
    return (
      <Section title="Contact Finder" tone="warning" description="No good matches yet, but the next best action is still available.">
        <p className="text-sm text-[var(--muted-foreground)]">No people were surfaced for this account right now. Try refreshing research or building committee coverage.</p>
      </Section>
    );
  }

  return (
    <Section title="Contact Finder" tone="success" description="Pick the next person to move into draft or enrichment.">
      <div className="space-y-2">
        {contacts.map((contact) => {
          const key = (contact.email ?? contact.name).toLowerCase();
          const selected = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${selected ? 'border-cyan-600 bg-cyan-50/60' : 'border-[var(--border)] hover:bg-[var(--muted)]/40'}`}
              onClick={() => onSelect(contact)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{contact.name || contact.email}</p>
                {contact.recommended ? <Badge variant="default">recommended</Badge> : null}
                <Badge variant="outline">{contact.source}</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{contact.title || 'Title not available'}</p>
              {contact.email ? <p className="mt-1 text-xs font-mono text-[var(--muted-foreground)]">{contact.email}</p> : null}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function DraftPreviewView({ draft }: { draft: DraftShape | null }) {
  return (
    <Section title="Draft Preview" tone={draft ? 'success' : 'warning'} description="Review the message first, then hand off into composer.">
      {draft ? (
        <div className="space-y-4">
          {draft.subject ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Subject</p>
              <p className="mt-1 text-sm font-medium">{draft.subject}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Body</p>
            <div className="mt-1 rounded-lg bg-[var(--muted)]/40 p-3 text-sm whitespace-pre-wrap">{draft.body}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">No draft body came back from the provider yet.</p>
      )}
    </Section>
  );
}

function ResearchBriefView({ result }: { result: AgentActionResult }) {
  const brief = extractResearchBrief(result);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
      <Section title="Recommendation" tone={brief.recommendation === 'Pursue now' ? 'success' : 'warning'} description="This is the operator decision this brief is trying to support.">
        <p className="text-lg font-semibold">{brief.recommendation}</p>
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Best angle</p>
          <p className="mt-1 text-sm">{brief.bestAngle || 'Angle still needs operator judgment from the available proof.'}</p>
        </div>
      </Section>
      <Section title="Why Now" description="Short reasons to act now, not an exhaustive payload dump.">
        <BulletList items={brief.whyNow} empty="No strong why-now signal was surfaced yet." />
      </Section>
      <Section title="Proof / Signals" description="Use this to justify the angle, not to reread the payload." tone={brief.proof.length > 0 ? 'success' : 'warning'}>
        <BulletList items={brief.proof} empty="No proof snippets were extracted yet." />
      </Section>
      <Section title="Risks / Gaps" tone={brief.risks.length > 0 ? 'warning' : 'success'} description="Things the operator should know before acting fast.">
        <BulletList items={brief.risks} empty="No material operator risk surfaced from this pass." />
      </Section>
    </div>
  );
}

function CommitteeView({ result }: { result: AgentActionResult }) {
  const committee = extractCommittee(result);
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Section title="Coverage" tone={committee.count > 0 ? 'success' : 'warning'} description="Do we have enough buyer coverage to send with confidence?">
        <div className="space-y-2">
          <p className="text-3xl font-semibold">{committee.count}</p>
          <p className="text-sm text-[var(--muted-foreground)]">committee members surfaced</p>
          <p className="text-sm">{committee.decisionMaker ? `Likely decision maker: ${committee.decisionMaker}` : 'No clear decision maker identified yet.'}</p>
        </div>
      </Section>
      <Section title="Suggested People" tone={committee.members.length > 0 ? 'success' : 'warning'} description="Promote the strongest person into draft or keep discovering coverage.">
        <BulletList
          items={committee.members.map((member) => `${member.name}${member.title ? ` — ${member.title}` : ''}`)}
          empty="No committee members were returned. Use Find More Contacts next."
        />
      </Section>
    </div>
  );
}

function GenericView({ result }: { result: AgentActionResult }) {
  return (
    <div className="grid gap-3">
      {result.cards.map((entry) => (
        <Section key={`${entry.title}-${entry.body.slice(0, 20)}`} title={entry.title} tone={entry.tone ?? 'default'}>
          <p className="text-sm whitespace-pre-wrap break-words text-[var(--muted-foreground)]">{entry.body}</p>
        </Section>
      ))}
    </div>
  );
}

export function AgentActionDialog({
  request,
  title,
  trigger,
  autoLoad = true,
  onResult,
  recipients = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AgentActionDialogProps) {
  const { open, setOpen } = useControllableOpen(controlledOpen, controlledOnOpenChange);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [result, setResult] = useState<AgentActionResult | null>(null);
  const [previousResult, setPreviousResult] = useState<AgentActionResult | null>(null);
  const [activeRequest, setActiveRequest] = useState<AgentActionDialogRequest>(request);
  const [selectedContactKey, setSelectedContactKey] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [onePagerOpen, setOnePagerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string>('');
  const runInFlightRef = useRef(false);
  const lastRunStartMsRef = useRef(0);
  const runCooldownMs = 1000;

  useEffect(() => {
    setActiveRequest(request);
    setLoaded(false);
  }, [request]);

  const run = useCallback(async (nextRequest?: AgentActionDialogRequest, refresh = false, trigger = 'manual') => {
    const effectiveRequest = nextRequest ?? activeRequest;
    const now = Date.now();
    if (runInFlightRef.current) return;
    if (now - lastRunStartMsRef.current < runCooldownMs) return;

    runInFlightRef.current = true;
    lastRunStartMsRef.current = now;
    setLoading(true);
    setErrorMessage(null);
    setRunStatus(`Running ${buildActionLabel(effectiveRequest.action).toLowerCase()}...`);
    const session = beginRefreshDiagnostic({
      surface: 'agent-action-dialog',
      trigger,
      metadata: {
        action: effectiveRequest.action,
        accountName: effectiveRequest.target.accountName,
        refresh,
      },
    });
    try {
      const response = await fetch('/api/agent-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...effectiveRequest,
          refresh,
          depth: effectiveRequest.depth ?? 'quick',
        }),
      });
      const payload = await readApiResponse<AgentActionResult & { error?: string }>(response);
      if (!response.ok && !payload.summary) {
        throw new Error(payload.error ?? 'Agent action failed');
      }
      setResult((previous) => {
        setPreviousResult(previous);
        return payload as AgentActionResult;
      });
      setActiveRequest(effectiveRequest);
      setLoaded(true);
      setRunStatus(
        `Updated ${buildActionLabel(effectiveRequest.action).toLowerCase()} · ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`,
      );
      endRefreshDiagnostic(session, {
        status: 'success',
        metadata: {
          action: effectiveRequest.action,
          accountName: effectiveRequest.target.accountName,
          refresh,
          provider: (payload as AgentActionResult).provider,
        },
      });
      onResult?.(payload as AgentActionResult);
      const firstContact = extractSuggestedContacts(payload as AgentActionResult)[0];
      setSelectedContactKey(firstContact ? (firstContact.email ?? firstContact.name).toLowerCase() : null);
      void recordWorkflowEvent({
        event: 'agent_result_loaded',
        action: effectiveRequest.action,
        accountName: effectiveRequest.target.accountName,
        provider: (payload as AgentActionResult).provider,
        status: (payload as AgentActionResult).status,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent action failed';
      setErrorMessage(message);
      setRunStatus(`Last run failed: ${message}`);
      toast.error(message);
      endRefreshDiagnostic(session, {
        status: 'error',
        reason: message,
        metadata: {
          action: effectiveRequest.action,
          accountName: effectiveRequest.target.accountName,
          refresh,
        },
      });
      void recordWorkflowEvent({
        event: 'agent_result_failed',
        action: effectiveRequest.action,
        accountName: effectiveRequest.target.accountName,
        message,
      });
    } finally {
      runInFlightRef.current = false;
      setLoading(false);
    }
  }, [activeRequest, onResult]);

  useEffect(() => {
    if (open) {
      void recordWorkflowEvent({
        event: 'agent_dialog_opened',
        action: activeRequest.action,
        accountName: activeRequest.target.accountName,
      });
    }
  }, [activeRequest.action, activeRequest.target.accountName, open]);

  useEffect(() => {
    if (open && autoLoad && !loaded && !loading) {
      void run(undefined, false, 'autoload');
    }
  }, [autoLoad, loaded, loading, open, run]);

  const accountName = getAccountName(result, activeRequest);
  const contacts = result ? extractSuggestedContacts(result) : [];
  const selectedContact = contacts.find((contact) => (contact.email ?? contact.name).toLowerCase() === selectedContactKey) ?? contacts[0] ?? null;
  const draft = result ? extractDraft(result) : null;
  const sourceAttribution = result ? extractSourceAttribution(result) : null;
  const changeSummary = result ? summarizeChange(previousResult, result) : '';
  const sourceCount = getSourceCount(result);
  const confidence = getConfidenceLabel(result);
  const degraded = result ? result.status !== 'ok' || sourceCount === 0 : Boolean(errorMessage);
  const refreshLabel = useMemo(() => buildRefreshLabel(activeRequest.action), [activeRequest.action]);

  const runReplacementAction = useCallback((action: AgentActionType, target?: Partial<AgentActionTarget>) => {
    const nextRequest: AgentActionDialogRequest = {
      action,
      target: {
        accountName,
        company: accountName,
        ...activeRequest.target,
        ...target,
      },
      refresh: true,
    };
    void run(nextRequest, true, 'replacement-action');
  }, [accountName, activeRequest.target, run]);

  const openComposer = useCallback((contact?: SuggestedContact | null) => {
    setComposeOpen(true);
    void recordWorkflowEvent({
      event: 'agent_handoff_composer',
      action: activeRequest.action,
      accountName,
      email: contact?.email,
    });
  }, [accountName, activeRequest.action]);

  const openOnePager = useCallback(() => {
    setOnePagerOpen(true);
    void recordWorkflowEvent({
      event: 'agent_handoff_one_pager',
      action: activeRequest.action,
      accountName,
    });
  }, [accountName, activeRequest.action]);

  const renderView = () => {
    if (!result) return null;
    switch (activeRequest.action) {
      case 'account_research':
      case 'content_context':
        return <ResearchBriefView result={result} />;
      case 'company_contacts':
      case 'prospect_discover':
        return <ContactFinderView result={result} selectedKey={selectedContactKey} onSelect={(contact) => setSelectedContactKey((contact.email ?? contact.name).toLowerCase())} />;
      case 'committee_refresh':
        return <CommitteeView result={result} />;
      case 'draft_outreach':
        return <DraftPreviewView draft={draft} />;
      default:
        return <GenericView result={result} />;
    }
  };

  return (
      <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-hidden p-0">
        <div className="flex h-full max-h-[88vh] flex-col">
          <DialogHeader className="shrink-0 border-b border-[var(--border)] px-6 py-5">
            <div className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                <DialogTitle>{title ?? buildActionLabel(activeRequest.action)}</DialogTitle>
                <Badge variant={toneVariant(result?.status)}>{result?.status ?? 'pending'}</Badge>
                {result ? <Badge variant="outline">{result.provider}</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {accountName || 'Agent workflow'} · {buildActionLabel(activeRequest.action)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <MetricPill label="Freshness" value={result ? `${result.freshness.source}${result.freshness.stale ? ' / stale' : ''}` : 'loading'} />
                <MetricPill label="Confidence" value={confidence} />
                <MetricPill label="Sources" value={String(sourceCount)} />
              </div>
              {changeSummary ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {changeSummary}
                </div>
              ) : null}
              {runStatus ? (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{runStatus}</p>
              ) : null}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-5">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {buildLoadingCopy(activeRequest.action)}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="h-24 rounded-lg bg-[var(--muted)]/60" />
                    <div className="h-24 rounded-lg bg-[var(--muted)]/60" />
                    <div className="h-32 rounded-lg bg-[var(--muted)]/60 md:col-span-2" />
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <Section title="Summary" tone={result.status === 'ok' ? 'success' : result.status === 'partial' ? 'warning' : 'default'} description="Lead with the recommendation, not the payload.">
                  <p className="text-sm">{result.summary}</p>
                </Section>

                {degraded ? (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">This run is usable, but not fully clean.</p>
                      <p className="mt-1 text-amber-800">
                        {result.status === 'partial'
                          ? 'One or more sidecar sources came back partial. Use the recommendation, but verify coverage before broad outreach.'
                          : sourceCount === 0
                            ? 'The workflow completed without much supporting signal. Treat this as a starting point, not a finished answer.'
                            : 'Agent output needs operator review before you rely on it heavily.'}
                      </p>
                    </div>
                  </div>
                ) : null}

                {renderView()}
                {(activeRequest.action === 'draft_outreach' || activeRequest.action === 'content_context') ? (
                  <SourceAttributionPanel attribution={sourceAttribution} versionMetadata={result?.data.version_metadata} />
                ) : null}

                {activeRequest.action === 'draft_outreach' && draft?.body ? (
                  <EmailComposer
                    accountName={accountName}
                    personaName={selectedContact?.name}
                    personaEmail={selectedContact?.email}
                    initialSubject={draft.subject}
                    initialBody={draft.body}
                    open={composeOpen}
                    onOpenChange={setComposeOpen}
                  />
                ) : null}

                {(activeRequest.action === 'account_research' || activeRequest.action === 'content_context') ? (
                  <OnePagerDialog
                    accountName={accountName}
                    recipients={recipients}
                    open={onePagerOpen}
                    onOpenChange={setOnePagerOpen}
                  />
                ) : null}

                <details
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)]/80 p-4"
                  onToggle={(event) => {
                    const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
                    if (nextOpen) {
                      void recordWorkflowEvent({
                        event: 'agent_raw_view_opened',
                        action: activeRequest.action,
                        accountName,
                      });
                    }
                  }}
                >
                  <summary className="cursor-pointer text-sm font-medium">View raw payload</summary>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[var(--muted)]/30 p-3 text-xs text-[var(--muted-foreground)]">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            ) : errorMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">This agent action hit a degraded state.</p>
                    <p className="mt-1">{errorMessage}</p>
                    <p className="mt-2 text-amber-800">
                      You can retry, switch to another action, or keep working manually without losing the account context.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] px-5 py-6 text-sm text-[var(--muted-foreground)]">
                Open the workflow to load live intel, contacts, or a draft for this account.
              </div>
            )}
          </div>

          <Separator />
          <div className="shrink-0 bg-[var(--background)] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(activeRequest.action === 'account_research' || activeRequest.action === 'content_context') ? (
                  <>
                    <Button size="sm" className="gap-1.5" onClick={openOnePager}>
                      <Wand2 className="h-3.5 w-3.5" />
                      Generate With Intel
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runReplacementAction('company_contacts')}>
                      <Users className="h-3.5 w-3.5" />
                      Find More Contacts
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runReplacementAction('draft_outreach', { email: selectedContact?.email })}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Draft
                    </Button>
                  </>
                ) : null}

                {(activeRequest.action === 'company_contacts' || activeRequest.action === 'prospect_discover') ? (
                  <>
                    <Button size="sm" className="gap-1.5" onClick={() => openComposer(selectedContact)} disabled={!selectedContact?.email}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in Composer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => runReplacementAction('contact_enrich', { email: selectedContact?.email })}
                      disabled={!selectedContact?.email}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Enrich Selected
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runReplacementAction('committee_refresh')}>
                      <Users className="h-3.5 w-3.5" />
                      Build Committee
                    </Button>
                    {selectedContact?.email ? (
                      <EmailComposer
                        accountName={accountName}
                        personaName={selectedContact.name}
                        personaEmail={selectedContact.email}
                        open={composeOpen}
                        onOpenChange={setComposeOpen}
                      />
                    ) : null}
                  </>
                ) : null}

                {activeRequest.action === 'draft_outreach' ? (
                  <>
                    <Button size="sm" className="gap-1.5" onClick={() => openComposer(selectedContact)} disabled={!draft?.body}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in Composer
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void run(undefined, true, 'draft-regenerate')}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </Button>
                  </>
                ) : null}

                {activeRequest.action === 'committee_refresh' ? (
                  <>
                    <Button size="sm" className="gap-1.5" onClick={() => runReplacementAction('company_contacts')}>
                      <Users className="h-3.5 w-3.5" />
                      Continue Discovery
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runReplacementAction('draft_outreach', { email: selectedContact?.email })}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Draft to Best Contact
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void run(undefined, true, 'footer-refresh')} disabled={loading}>
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {refreshLabel}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
