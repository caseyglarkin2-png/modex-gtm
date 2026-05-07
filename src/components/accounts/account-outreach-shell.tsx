'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { FileText, Mail, RefreshCw, Send, Sparkles } from 'lucide-react';
import { canDirectSendAsset } from '@/lib/generated-content/asset-send-contract';
import { parseAssetProvenanceSummary, resolveAccountAssetSelection } from '@/lib/generated-content/asset-selection';
import { readSourceBackedContractFromMetadata } from '@/lib/source-backed/attribution';
import type { ContentQualityResult } from '@/lib/content-quality';
import type { AssetSendRecipient } from '@/components/email/asset-send-dialog';
import { buildAccountComposePayload } from '@/lib/email/compose-contract';
import { readApiResponse } from '@/lib/api-response';
import { recordWorkflowMetric } from '@/lib/agent-actions/telemetry';
import { SendJobTracker } from '@/components/generated-content/send-job-tracker';
import { SourceAttributionPanel } from '@/components/source-backed/source-attribution-panel';

type AccountOutreachShellAsset = {
  id: number;
  content: string;
  content_type: string;
  version: number;
  created_at: Date | string;
  provider_used?: string | null;
  version_metadata?: unknown;
  quality?: ContentQualityResult | null;
};

type AccountOutreachRecipientSet = {
  key: string;
  label: string;
  description: string;
  count: number;
  recipientIds: number[];
  recommended?: boolean;
};

type AccountOutreachShellProps = {
  accountName: string;
  assets: AccountOutreachShellAsset[];
  recipients: AssetSendRecipient[];
  recipientSets?: AccountOutreachRecipientSet[];
  initialSelectedRecipientIds?: number[];
  defaultRecipientSetKey?: string | null;
  recommendedAngle?: string;
  whyNow?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  approvalGateEnabled?: boolean;
};

type ComposeVariant = 'one_pager_asset' | 'email_draft';

function buildDefaultDraft(accountName: string, recommendedAngle?: string, whyNow?: string) {
  return {
    subject: `built this with ${accountName} in mind`,
    openingLine: `Wanted to share a quick note because ${accountName} looks like a strong fit for a tighter gate-to-dock operating motion.`,
    body: recommendedAngle || whyNow || `The working hypothesis is that throughput pressure is showing up as manual coordination, avoidable yard variance, and inconsistent dock flow.`,
    ctaLine: `If useful, I can send the short operator version.`,
  };
}

function arraysEqual(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function parseCcInput(value: string) {
  return Array.from(new Set(
    value
      .split(/[\n,;]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  ));
}

function serializeCc(values: string[]) {
  return values.join(', ');
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AccountOutreachShell({
  accountName,
  assets,
  recipients,
  recipientSets = [],
  initialSelectedRecipientIds,
  defaultRecipientSetKey,
  recommendedAngle,
  whyNow,
  trigger,
  open: controlledOpen,
  onOpenChange,
  approvalGateEnabled = false,
}: AccountOutreachShellProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const showTrigger = trigger !== undefined || controlledOpen === undefined;
  const assetSelection = useMemo(() => resolveAccountAssetSelection<AccountOutreachShellAsset>(assets), [assets]);
  const sendableAssets = useMemo(
    () => assets
      .filter((asset) => canDirectSendAsset(asset.content_type))
      .sort((left, right) => right.version - left.version),
    [assets],
  );
  const defaultDraft = useMemo(
    () => buildDefaultDraft(accountName, recommendedAngle, whyNow),
    [accountName, recommendedAngle, whyNow],
  );
  const preferredRecipientSet = useMemo(
    () => recipientSets.find((set) => set.key === defaultRecipientSetKey)
      ?? recipientSets.find((set) => set.recommended)
      ?? null,
    [defaultRecipientSetKey, recipientSets],
  );
  const defaultSelectedRecipientIds = useMemo(
    () => initialSelectedRecipientIds?.length
      ? initialSelectedRecipientIds
      : preferredRecipientSet?.recipientIds.length
        ? preferredRecipientSet.recipientIds
        : recipients.map((recipient) => recipient.id),
    [initialSelectedRecipientIds, preferredRecipientSet, recipients],
  );
  const defaultVariant: ComposeVariant = sendableAssets.length > 0 ? 'one_pager_asset' : 'email_draft';

  const [variant, setVariant] = useState<ComposeVariant>(defaultVariant);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(assetSelection.fallbackAsset?.id ?? null);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>(defaultSelectedRecipientIds);
  const [selectedRecipientSetKey, setSelectedRecipientSetKey] = useState<string | null>(preferredRecipientSet?.key ?? null);
  const [subject, setSubject] = useState('');
  const [openingLine, setOpeningLine] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [ctaLine, setCtaLine] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [activeSendJobId, setActiveSendJobId] = useState<number | null>(null);
  const [lastSendResult, setLastSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
    skipped?: Array<{ to: string; reason: string }>;
  } | null>(null);

  const selectedAsset = sendableAssets.find((asset) => asset.id === selectedAssetId)
    ?? assetSelection.fallbackAsset
    ?? null;
  const selectedAssetProvenance = selectedAsset
    ? parseAssetProvenanceSummary(selectedAsset.version_metadata)
    : null;

  const resetState = () => {
    const assetDefault = assetSelection.recommendedAsset ?? assetSelection.latestSendableAsset ?? assetSelection.latestAsset ?? null;
    setVariant(defaultVariant);
    setSelectedAssetId(assetDefault?.id ?? null);
    setSelectedRecipientIds(defaultSelectedRecipientIds);
    setSelectedRecipientSetKey(preferredRecipientSet?.key ?? null);
    setSubject(
      defaultVariant === 'one_pager_asset'
        ? `yard network scorecard for ${accountName}`
        : defaultDraft.subject,
    );
    setOpeningLine(
      defaultVariant === 'one_pager_asset'
        ? `Wanted to share the short operator version I’d use with ${accountName}.`
        : defaultDraft.openingLine,
    );
    setDraftBody(defaultDraft.body);
    setCtaLine(defaultVariant === 'one_pager_asset' ? defaultDraft.ctaLine : defaultDraft.ctaLine);
    setCcInput('');
    setLastSendResult(null);
    setActiveSendJobId(null);
  };

  useEffect(() => {
    if (!open) return;
    resetState();
    void recordWorkflowMetric('send_from_account_rate', {
      accountName,
      action: 'account_outreach_shell_open',
      status: defaultVariant,
      value: 1,
    });
  }, [accountName, defaultVariant, open, preferredRecipientSet?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (variant === 'one_pager_asset') {
      setSubject((current) => current || `yard network scorecard for ${accountName}`);
      setOpeningLine((current) => current || `Wanted to share the short operator version I’d use with ${accountName}.`);
      setCtaLine((current) => current || defaultDraft.ctaLine);
      return;
    }

    setSubject((current) => current || defaultDraft.subject);
    setOpeningLine((current) => current || defaultDraft.openingLine);
    setDraftBody((current) => current || defaultDraft.body);
    setCtaLine((current) => current || defaultDraft.ctaLine);
  }, [accountName, defaultDraft, variant]);

  const payload = useMemo(() => {
    if (variant === 'one_pager_asset') {
      if (!selectedAsset) return null;
      return buildAccountComposePayload({
        variant: 'one_pager_asset',
        accountName,
        subject,
        openingLine,
        ctaLine,
        asset: {
          id: selectedAsset.id,
          generatedContentId: selectedAsset.id,
          version: selectedAsset.version,
          content: selectedAsset.content,
          contentType: selectedAsset.content_type,
          providerUsed: selectedAsset.provider_used,
        },
        recipients,
        selectedRecipientIds,
        recipientSetKey: selectedRecipientSetKey,
      });
    }

    return buildAccountComposePayload({
      variant: 'email_draft',
      accountName,
      subject,
      openingLine,
      body: draftBody,
      ctaLine,
      recipients,
      selectedRecipientIds,
      recipientSetKey: selectedRecipientSetKey,
    });
  }, [accountName, ctaLine, draftBody, openingLine, recipients, selectedAsset, selectedRecipientIds, selectedRecipientSetKey, subject, variant]);

  const selectedRecipients = recipients.filter((recipient) => selectedRecipientIds.includes(recipient.id));
  const ccList = useMemo(() => parseCcInput(ccInput), [ccInput]);
  const selectedRecipientEmails = useMemo(
    () => new Set(selectedRecipients.map((recipient) => recipient.email.toLowerCase())),
    [selectedRecipients],
  );
  const qualifiedCcCandidates = useMemo(
    () => recipients
      .filter((recipient) => !selectedRecipientIds.includes(recipient.id))
      .filter((recipient) => Boolean(recipient.email))
      .filter((recipient) => {
        if (!recipient.readiness) return false;
        if (recipient.readiness.stale) return false;
        return recipient.readiness.tier !== 'low';
      })
      .map((recipient) => ({
        email: recipient.email,
        name: recipient.name,
      }))
      .filter((candidate) => !ccList.includes(candidate.email.toLowerCase())),
    [ccList, recipients, selectedRecipientIds],
  );

  function applyRecipientSet(recipientSet: AccountOutreachRecipientSet | null) {
    if (!recipientSet) {
      setSelectedRecipientIds(recipients.map((recipient) => recipient.id));
      setSelectedRecipientSetKey(null);
      return;
    }
    setSelectedRecipientIds(recipientSet.recipientIds);
    setSelectedRecipientSetKey(recipientSet.key);
  }

  function updateRecipientSelection(nextIds: number[]) {
    setSelectedRecipientIds(nextIds);
    const matchingSet = recipientSets.find((set) => arraysEqual(set.recipientIds, nextIds));
    setSelectedRecipientSetKey(matchingSet?.key ?? 'manual');
  }

  function addCcEmail(email: string) {
    const next = Array.from(new Set([...ccList, email.toLowerCase()]));
    setCcInput(serializeCc(next));
  }

  function removeCcEmail(email: string) {
    const normalized = email.toLowerCase();
    setCcInput(serializeCc(ccList.filter((entry) => entry !== normalized)));
  }

  async function handleDraftFromIntel() {
    setIsDrafting(true);
    try {
      const response = await fetch('/api/agent-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft_outreach',
          refresh: true,
          target: {
            accountName,
            company: accountName,
          },
        }),
      });
      const payload = await readApiResponse<{
        summary?: string;
        error?: string;
        data?: {
          draft?: {
            subject?: string;
            body?: string;
            draft?: { subject?: string; body?: string };
          };
        };
      }>(response);
      if (!response.ok && !payload.data?.draft) {
        throw new Error(payload.error ?? payload.summary ?? 'Live draft failed');
      }
      const draft = payload.data?.draft?.draft ?? payload.data?.draft;
      if (draft?.subject) setSubject(draft.subject);
      if (draft?.body) setDraftBody(draft.body);
      if (!draft?.subject && !draft?.body) {
        throw new Error('No draft content came back from live intel.');
      }
      toast.success(payload.summary ?? 'Draft refreshed from live intel');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Live draft failed');
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleSend() {
    if (!payload) {
      toast.error('Select an asset or draft before sending');
      return;
    }
    if (payload.recipients.length === 0) {
      toast.error('Select at least one recipient');
      return;
    }
    const invalidCc = ccList.find((email) => !isValidEmail(email));
    if (invalidCc) {
      toast.error(`Invalid CC email: ${invalidCc}`);
      return;
    }

    setIsSending(true);
    try {
      const shouldQueueAsync = payload.recipients.length > 1;

      if (shouldQueueAsync) {
        const response = await fetch('/api/email/send-bulk-async', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestedBy: 'Casey',
            workflowMetadata: payload.workflowMetadata,
            items: [{
              generatedContentId: payload.generatedContentId,
              accountName: payload.accountName,
              cc: ccList,
              subject: payload.subject,
              bodyHtml: payload.bodyHtml,
              recipients: payload.recipients,
            }],
          }),
        });
        const result = await readApiResponse<{
          success?: boolean;
          error?: string;
          job?: { id: number; status: string; total_recipients: number };
        }>(response);
        if (!response.ok || !result.job) {
          throw new Error(result.error ?? 'Failed to queue send job');
        }
        setActiveSendJobId(result.job.id);
        setLastSendResult(null);
        void recordWorkflowMetric('account_send_job_enqueue_rate', {
          accountName,
          action: 'account_outreach_shell',
          status: variant,
          value: payload.recipients.length,
          count: payload.recipients.length,
        });
        toast.success(`Queued send job #${result.job.id} for ${payload.recipients.length} recipients`);
      } else {
        const response = await fetch('/api/email/send-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountName: payload.accountName,
            recipients: payload.recipients,
            cc: ccList,
            subject: payload.subject,
            bodyHtml: payload.bodyHtml,
            generatedContentId: payload.generatedContentId,
            workflowMetadata: payload.workflowMetadata,
          }),
        });
        const result = await readApiResponse<{
          success?: boolean;
          sent: number;
          failed: number;
          total: number;
          skipped?: Array<{ to: string; reason: string }>;
          error?: string;
          message?: string;
        }>(response);
        if (!response.ok) {
          throw new Error(result.message ?? result.error ?? 'Send failed');
        }
        setLastSendResult(result);
        void recordWorkflowMetric('preview_to_send_rate', {
          accountName,
          action: 'account_outreach_shell',
          status: variant,
          value: result.sent,
          count: result.total,
        });
        const ccDescriptor = ccList.length > 0 ? `, ${ccList.length} CC'd` : '';
        toast.success(`Sent to ${result.sent} recipient(s)${ccDescriptor}. Source-backed lineage saved with this account's evidence.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Send failed');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <SheetTrigger asChild>
          {trigger ?? (
            <Button size="sm" className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              <Send className="h-3.5 w-3.5" />
              Compose Outreach
            </Button>
          )}
        </SheetTrigger>
      ) : null}
      <SheetContent side="right" className="w-full max-w-4xl overflow-y-auto p-0 sm:max-w-4xl">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>{accountName} · Outreach Shell</SheetTitle>
            <SheetDescription>
              Pick the asset or draft, tune recipients, edit the message, preview the exact send payload, and send without leaving the account page.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={variant === 'one_pager_asset' ? 'default' : 'outline'}
                onClick={() => setVariant('one_pager_asset')}
                disabled={sendableAssets.length === 0}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                One-Pager Asset
              </Button>
              <Button
                type="button"
                size="sm"
                variant={variant === 'email_draft' ? 'default' : 'outline'}
                onClick={() => setVariant('email_draft')}
              >
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Email Draft
              </Button>
              {variant === 'email_draft' ? (
                <Button type="button" size="sm" variant="outline" onClick={() => void handleDraftFromIntel()} disabled={isDrafting}>
                  <Sparkles className={`mr-1.5 h-3.5 w-3.5 ${isDrafting ? 'animate-pulse' : ''}`} />
                  {isDrafting ? 'Refreshing Draft...' : 'Draft From Intel'}
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="ghost" onClick={resetState}>
                Reset
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                {variant === 'one_pager_asset' ? (
                  <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label htmlFor="asset-version" className="text-sm font-medium">Asset</Label>
                      {assetSelection.recommendedAsset ? <Badge>Recommended</Badge> : null}
                      {selectedAssetProvenance?.usedLiveIntel ? <Badge variant="outline">Live intel</Badge> : null}
                      {selectedAssetProvenance?.freshnessLabel ? <Badge variant="secondary">{selectedAssetProvenance.freshnessLabel}</Badge> : null}
                      {(() => {
                        const parsed = readSourceBackedContractFromMetadata(selectedAsset?.version_metadata);
                        if (!parsed.contract) {
                          return (
                            <Badge
                              variant="outline"
                              title="No source-backed citation contract on this asset. Drafts ship with attached evidence when generated through the source-backed pipeline."
                            >
                              unsourced
                            </Badge>
                          );
                        }
                        const { citation_count, citation_threshold } = parsed.contract;
                        const met = citation_count >= citation_threshold;
                        return (
                          <Badge
                            variant={met ? 'secondary' : 'outline'}
                            title={`Cites ${citation_count} of ${citation_threshold} required source(s).`}
                          >
                            {met ? '✓ ' : ''}{citation_count}/{citation_threshold} sources cited
                          </Badge>
                        );
                      })()}
                    </div>
                    <select
                      id="asset-version"
                      value={selectedAsset?.id ?? ''}
                      onChange={(event) => setSelectedAssetId(Number(event.target.value))}
                      className="h-10 w-full rounded-md border border-[var(--border)] bg-background px-3 text-sm"
                    >
                      {sendableAssets.map((asset) => {
                        const parsed = readSourceBackedContractFromMetadata(asset.version_metadata);
                        const citationLabel = parsed.contract
                          ? ` · ${parsed.contract.citation_count}/${parsed.contract.citation_threshold} cited`
                          : ' · unsourced';
                        return (
                          <option key={asset.id} value={asset.id}>
                            v{asset.version} · {asset.content_type.replaceAll('_', ' ')}{citationLabel}
                          </option>
                        );
                      })}
                    </select>
                    {selectedAssetProvenance ? (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Signals used: {selectedAssetProvenance.signalCount} · Contacts used: {selectedAssetProvenance.recommendedContactCount} · Scope: {selectedAssetProvenance.scopedAccountNames.join(', ') || accountName}
                      </p>
                    ) : null}
                    <SourceAttributionPanel
                      title="Asset source attribution"
                      versionMetadata={selectedAsset?.version_metadata}
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <p className="text-sm font-medium">Draft Mode</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Use the shell for a lighter account email while keeping the same recipient and telemetry contract.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="compose-subject">Subject</Label>
                  <Input id="compose-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compose-opening">Opening Paragraph</Label>
                  <Textarea id="compose-opening" value={openingLine} onChange={(event) => setOpeningLine(event.target.value)} rows={4} />
                </div>
                {variant === 'email_draft' ? (
                  <div className="space-y-2">
                    <Label htmlFor="compose-body">Main Body</Label>
                    <Textarea id="compose-body" value={draftBody} onChange={(event) => setDraftBody(event.target.value)} rows={8} />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="compose-cta">CTA / Closing</Label>
                  <Textarea id="compose-cta" value={ctaLine} onChange={(event) => setCtaLine(event.target.value)} rows={3} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Recipients</p>
                    <Badge variant="outline">{selectedRecipientIds.length} selected</Badge>
                  </div>
                  {recipientSets.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recipientSets.map((recipientSet) => (
                        <Button
                          key={recipientSet.key}
                          type="button"
                          size="sm"
                          variant={selectedRecipientSetKey === recipientSet.key ? 'default' : 'outline'}
                          onClick={() => applyRecipientSet(recipientSet)}
                        >
                          {recipientSet.label}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedRecipientSetKey === 'manual' ? 'default' : 'outline'}
                        onClick={() => {
                          updateRecipientSelection([]);
                        }}
                      >
                        Manual
                      </Button>
                    </div>
                  ) : null}
                  <div className="mt-3 space-y-2">
                    {recipients.map((recipient) => (
                      <label key={recipient.id} className="flex items-start gap-2 rounded-md border border-[var(--border)] p-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedRecipientIds.includes(recipient.id)}
                          onChange={(event) => {
                            const nextIds = event.target.checked
                              ? [...selectedRecipientIds, recipient.id]
                              : selectedRecipientIds.filter((id) => id !== recipient.id);
                            updateRecipientSelection(nextIds);
                          }}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium">{recipient.name}</span>
                          <span className="ml-2 text-[var(--muted-foreground)]">{recipient.email}</span>
                          {recipient.title ? <span className="ml-2 text-[var(--muted-foreground)]">({recipient.title})</span> : null}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--accent)]/20 p-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Qualified CC</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Same-account contacts with a verified email and recent activity. Click one to add it as CC, or type any address below.
                    </p>
                    {qualifiedCcCandidates.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {qualifiedCcCandidates.slice(0, 6).map((candidate) => (
                          <Button
                            key={`cc-${candidate.email}`}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addCcEmail(candidate.email)}
                          >
                            Add {candidate.name}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="compose-cc" className="text-xs">CC emails (optional)</Label>
                      <Input
                        id="compose-cc"
                        value={ccInput}
                        onChange={(event) => setCcInput(event.target.value)}
                        placeholder="ops@account.com, leader@account.com"
                      />
                    </div>
                    {ccList.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ccList.map((email) => (
                          <Badge key={`cc-pill-${email}`} variant={selectedRecipientEmails.has(email) ? 'secondary' : 'outline'}>
                            {email}
                            <button
                              type="button"
                              className="ml-1 text-[10px] font-semibold"
                              onClick={() => removeCcEmail(email)}
                            >
                              x
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] p-4">
                  <p className="text-sm font-medium">Preview</p>
                  <div className="mt-3 max-h-[420px] overflow-y-auto rounded-md border bg-slate-50 p-4">
                    {payload ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: payload.previewHtml }}
                      />
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)]">Select an asset or draft to build a preview.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Pre-send summary</p>
                <Badge
                  variant={approvalGateEnabled ? 'outline' : 'secondary'}
                  title={approvalGateEnabled
                    ? 'Generated drafts must be approved in the queue before they can ship.'
                    : 'Sends publish immediately; no approval review required.'}
                >
                  {approvalGateEnabled ? 'Approval required' : 'Sends publish immediately'}
                </Badge>
              </div>
              <p className="mt-1 text-[var(--muted-foreground)]">
                Variant: {variant === 'one_pager_asset' ? 'One-pager asset' : 'Email draft'} · Recipients: {selectedRecipients.length} · CC: {ccList.length} · Recipient set: {selectedRecipientSetKey ?? 'manual'}
              </p>
              {payload?.generatedContentId ? (
                <p className="mt-1 text-[var(--muted-foreground)]">
                  Generated content linkage: #{payload.generatedContentId}
                </p>
              ) : null}
              {variant === 'one_pager_asset' && selectedAsset && !readSourceBackedContractFromMetadata(selectedAsset.version_metadata).contract ? (
                <p
                  className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900"
                  data-testid="unsourced-send-note"
                >
                  No source citations on this asset — this draft will ship as-is.
                </p>
              ) : null}
            </div>

            {lastSendResult ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4 text-sm">
                <p className="font-medium">
                  Send result: {lastSendResult.sent} sent, {lastSendResult.failed} failed, {lastSendResult.total} total.
                </p>
                {(lastSendResult.skipped?.length ?? 0) > 0 ? (
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    Skipped: {lastSendResult.skipped?.map((item) => `${item.to} (${item.reason})`).join(', ')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {activeSendJobId ? (
              <SendJobTracker jobId={activeSendJobId} pollMs={5000} title={`Account Page Send Job #${activeSendJobId}`} />
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => void handleSend()} disabled={isSending || !payload || payload.recipients.length === 0}>
              {isSending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {payload?.recipients.length ?? 0} Recipient{(payload?.recipients.length ?? 0) === 1 ? '' : 's'}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
