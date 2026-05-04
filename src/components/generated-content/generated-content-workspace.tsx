'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GeneratedContentGrid, type QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';
import type { WorkspaceRecipient } from '@/lib/generated-content/queries';
import { filterGeneratedContentCards } from '@/lib/generated-content/workspace-filters';
import { BulkPreviewDialog, type BulkPreviewItem } from '@/components/generated-content/bulk-preview-dialog';
import { SendJobTracker } from '@/components/generated-content/send-job-tracker';
import { buildRegenerationPromptContext, buildSignalToContentMapping } from '@/lib/revops/engagement-learning';
import { toast } from 'sonner';
import { Sparkles, X } from 'lucide-react';

type GeneratedContentWorkspaceProps = {
  cards: QueueGeneratedAccountCard[];
  recipientsByAccount: Record<string, WorkspaceRecipient[]>;
};

export function GeneratedContentWorkspace({ cards, recipientsByAccount }: GeneratedContentWorkspaceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, boolean>>({});
  const [activeSendJobId, setActiveSendJobId] = useState<number | null>(null);

  const accountFilter = searchParams.get('account') ?? 'all';
  const campaignFilter = searchParams.get('campaign') ?? 'all';
  const providerFilter = searchParams.get('provider') ?? 'all';
  const infographicTypeFilter = searchParams.get('infographicType') ?? 'all';
  const stageIntentFilter = searchParams.get('stageIntent') ?? 'all';
  const statusFilter = searchParams.get('status') ?? 'all';
  const sentFilter = searchParams.get('sent') ?? 'all';
  const checklistFilter = searchParams.get('checklist') ?? 'all';
  const query = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(query);
  const regenAccount = searchParams.get('regenAccount') ?? '';
  const regenSourceKind = searchParams.get('regenSourceKind') ?? '';
  const regenSourceId = searchParams.get('regenSourceId') ?? '';
  const regenSignalKind = searchParams.get('regenSignalKind') ?? '';
  const regenContextRaw = searchParams.get('regenContext') ?? '';
  const regenCampaignId = Number.parseInt(searchParams.get('regenCampaignId') ?? '', 10);
  const regenGeneratedContentId = Number.parseInt(searchParams.get('regenGeneratedContentId') ?? '', 10);
  const [regenerationContext, setRegenerationContext] = useState(regenContextRaw);
  const [regenerating, setRegenerating] = useState(false);
  const [selectionScrollTop, setSelectionScrollTop] = useState(0);

  const accountOptions = useMemo(
    () => cards.map((card) => card.account_name).sort((left, right) => left.localeCompare(right)),
    [cards],
  );
  const campaignOptions = useMemo(
    () => Array.from(new Set(cards.flatMap((card) => card.campaign_names))).sort((left, right) => left.localeCompare(right)),
    [cards],
  );
  const providerOptions = useMemo(
    () => Array.from(new Set(cards.flatMap((card) => card.versions.map((version) => version.provider_used ?? 'unknown'))))
      .sort((left, right) => left.localeCompare(right)),
    [cards],
  );
  const infographicTypeOptions = useMemo(
    () => Array.from(new Set(cards.flatMap((card) => card.versions.map((version) => version.infographic_type ?? 'cold_hook'))))
      .sort((left, right) => left.localeCompare(right)),
    [cards],
  );
  const stageIntentOptions = useMemo(
    () => Array.from(new Set(cards.flatMap((card) => card.versions.map((version) => version.stage_intent ?? 'cold'))))
      .sort((left, right) => left.localeCompare(right)),
    [cards],
  );

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  };

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const normalized = searchInput.trim();
    if (normalized === query) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (!normalized) next.delete('q');
      else next.set('q', normalized);
      router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pathname, query, router, searchInput, searchParams]);

  const clearParam = (key: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(key);
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  };

  const clearRegenerationParams = () => {
    const next = new URLSearchParams(searchParams.toString());
    ['regenAccount', 'regenSourceKind', 'regenSourceId', 'regenSignalKind', 'regenContext', 'regenCampaignId', 'regenGeneratedContentId']
      .forEach((key) => next.delete(key));
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  };

  const filteredCards = useMemo(
    () => filterGeneratedContentCards(cards, {
      account: accountFilter,
      campaign: campaignFilter,
        provider: providerFilter,
        infographicType: infographicTypeFilter,
        stageIntent: stageIntentFilter,
        status: statusFilter,
      sent: sentFilter,
      checklist: checklistFilter,
      query,
    }),
    [accountFilter, campaignFilter, cards, checklistFilter, infographicTypeFilter, providerFilter, query, sentFilter, stageIntentFilter, statusFilter],
  );

  const regenerationPrompt = useMemo(() => {
    if (!regenAccount || !regenSourceKind || !regenSourceId || !regenerationContext.trim()) return null;
    const mapping = buildSignalToContentMapping({
      sourceKind: regenSourceKind,
      sourceId: regenSourceId,
      accountName: regenAccount,
      campaignId: Number.isInteger(regenCampaignId) ? regenCampaignId : null,
      generatedContentId: Number.isInteger(regenGeneratedContentId) ? regenGeneratedContentId : null,
      signalContext: regenerationContext.trim(),
    });
    return buildRegenerationPromptContext(mapping);
  }, [regenAccount, regenCampaignId, regenGeneratedContentId, regenSourceId, regenSourceKind, regenerationContext]);

  const selectableItems = useMemo(() => filteredCards.map((card) => {
    const latest = card.versions[0];
    const recipients = recipientsByAccount[card.account_name] ?? [];
    return {
      accountName: card.account_name,
      selected: selectedAccounts[card.account_name] ?? false,
      disabled: !latest || recipients.length === 0,
      recipients,
      latestVersion: latest?.version ?? card.latest_version,
      version: latest?.version ?? card.latest_version,
      generatedContentId: latest?.id ?? 0,
      providerUsed: latest?.provider_used,
      campaignType: latest?.campaign_type,
      infographicType: latest?.infographic_type,
      stageIntent: latest?.stage_intent,
      sequencePosition: latest?.sequence_position,
      bundleId: latest?.bundle_id,
      pendingJobs: card.pending_jobs,
      processingJobs: card.processing_jobs,
      content: latest?.content ?? '',
      checklist: latest?.checklist,
      checklistCompletedItemIds: latest?.checklist_completed_item_ids ?? [],
    };
  }), [filteredCards, recipientsByAccount, selectedAccounts]);

  const selectedPreviewItems = useMemo<BulkPreviewItem[]>(
    () => selectableItems
      .filter((item) => item.selected && !item.disabled && item.generatedContentId > 0)
      .map((item) => ({
        accountName: item.accountName,
        generatedContentId: item.generatedContentId,
        version: item.version,
        providerUsed: item.providerUsed,
        campaignType: item.campaignType,
        infographicType: item.infographicType,
        stageIntent: item.stageIntent,
        sequencePosition: item.sequencePosition,
        bundleId: item.bundleId,
        latestVersion: item.latestVersion,
        pendingJobs: item.pendingJobs,
        processingJobs: item.processingJobs,
        content: item.content,
        checklist: item.checklist,
        checklistCompletedItemIds: item.checklistCompletedItemIds,
        recipients: item.recipients,
      })),
    [selectableItems],
  );

  const allSelected = selectableItems.length > 0
    && selectableItems.filter((item) => !item.disabled).every((item) => selectedAccounts[item.accountName]);
  const selectableCount = selectableItems.filter((item) => !item.disabled).length;
  const selectedCount = selectedPreviewItems.length;
  const selectedRecipientCount = selectedPreviewItems.reduce((sum, item) => sum + item.recipients.length, 0);
  const selectedGuardCount = selectedPreviewItems.filter((item) => item.pendingJobs > 0 || item.processingJobs > 0 || item.version < item.latestVersion).length;
  const selectionRowHeight = 28;
  const selectionViewportHeight = 176;
  const virtualWindow = useMemo(() => {
    const overscan = 8;
    const startIndex = Math.max(0, Math.floor(selectionScrollTop / selectionRowHeight) - overscan);
    const visibleCount = Math.ceil(selectionViewportHeight / selectionRowHeight) + overscan * 2;
    const endIndex = Math.min(selectableItems.length, startIndex + visibleCount);
    return {
      startIndex,
      totalHeight: selectableItems.length * selectionRowHeight,
      offsetTop: startIndex * selectionRowHeight,
      items: selectableItems.slice(startIndex, endIndex),
    };
  }, [selectableItems, selectionScrollTop]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    if (accountFilter !== 'all') filters.push({ key: 'account', label: `Account: ${accountFilter}` });
    if (campaignFilter !== 'all') filters.push({ key: 'campaign', label: `Campaign: ${campaignFilter}` });
    if (providerFilter !== 'all') filters.push({ key: 'provider', label: `Provider: ${providerFilter}` });
    if (infographicTypeFilter !== 'all') filters.push({ key: 'infographicType', label: `Infographic: ${infographicTypeFilter.replaceAll('_', ' ')}` });
    if (stageIntentFilter !== 'all') filters.push({ key: 'stageIntent', label: `Stage: ${stageIntentFilter}` });
    if (statusFilter !== 'all') filters.push({ key: 'status', label: `Status: ${statusFilter}` });
    if (sentFilter !== 'all') filters.push({ key: 'sent', label: `Send: ${sentFilter}` });
    if (checklistFilter !== 'all') filters.push({ key: 'checklist', label: `Checklist: ${checklistFilter}` });
    if (query.trim().length > 0) filters.push({ key: 'q', label: `Search: ${query}` });
    return filters;
  }, [
    accountFilter,
    campaignFilter,
    checklistFilter,
    infographicTypeFilter,
    providerFilter,
    query,
    sentFilter,
    stageIntentFilter,
    statusFilter,
  ]);

  async function regenerateFromSignal() {
    if (!regenAccount || !regenSourceKind || !regenSourceId || !regenerationPrompt) return;
    setRegenerating(true);
    try {
      const response = await fetch('/api/ai/one-pager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: regenAccount,
          regeneration: {
            sourceKind: regenSourceKind,
            sourceId: regenSourceId,
            signalKind: regenSignalKind || 'unknown',
            context: regenerationContext,
            campaignId: Number.isInteger(regenCampaignId) ? regenCampaignId : null,
            generatedContentId: Number.isInteger(regenGeneratedContentId) ? regenGeneratedContentId : null,
          },
        }),
      });
      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(payload.error ?? 'Regeneration failed');
      toast.success('Regeneration queued from signal context');
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {activeSendJobId && <SendJobTracker jobId={activeSendJobId} />}
      {regenerationPrompt ? (
        <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50/30 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-blue-700" />
            {regenerationPrompt.headline}
          </p>
          <p className="text-xs text-muted-foreground">
            Source {regenSourceKind}:{regenSourceId} for {regenAccount}.
          </p>
          <textarea
            className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            value={regenerationContext}
            onChange={(event) => setRegenerationContext(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Button size="sm" onClick={regenerateFromSignal} disabled={regenerating || !regenerationContext.trim()}>
              {regenerating ? 'Regenerating...' : 'Regenerate from Signal'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(regenerationPrompt.prompt)}
            >
              Copy Prompt Context
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearRegenerationParams}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-9">
        <Select value={accountFilter} onValueChange={(value) => setParam('account', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accountOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={campaignFilter} onValueChange={(value) => setParam('campaign', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaignOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={providerFilter} onValueChange={(value) => setParam('provider', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providerOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={infographicTypeFilter} onValueChange={(value) => setParam('infographicType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Infographic Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Type</SelectItem>
            {infographicTypeOptions.map((option) => (
              <SelectItem key={option} value={option}>{option.replaceAll('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stageIntentFilter} onValueChange={(value) => setParam('stageIntent', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Stage Intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Stage</SelectItem>
            {stageIntentOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setParam('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sentFilter} onValueChange={(value) => setParam('sent', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Send State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Send State</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="unsent">Unsent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={checklistFilter} onValueChange={(value) => setParam('checklist', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Checklist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Checklist</SelectItem>
            <SelectItem value="complete">Checklist Complete</SelectItem>
            <SelectItem value="incomplete">Checklist Incomplete</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search accounts/campaigns"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
          <p className="text-xs font-medium text-muted-foreground">Active filters</p>
          {activeFilters.map((filter) => (
            <button
              type="button"
              key={filter.key}
              onClick={() => {
                if (filter.key === 'q') setSearchInput('');
                clearParam(filter.key);
              }}
              className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-foreground hover:bg-muted"
              aria-label={`Clear ${filter.label}`}
            >
              {filter.label}
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="sticky top-14 z-20 rounded-md border bg-background/90 p-2 backdrop-blur md:top-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>{filteredCards.length} account card(s) visible</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedAccounts(() => {
                if (allSelected) return {};
                const next: Record<string, boolean> = {};
                selectableItems
                .filter((item) => !item.disabled)
                .forEach((item) => {
                  next[item.accountName] = true;
                });
              return next;
            })}
            disabled={selectableCount === 0}
          >
            {allSelected ? 'Clear Selection' : 'Select All Visible'}
          </Button>
          {selectedPreviewItems.length > 0 && (
            <BulkPreviewDialog
              items={selectedPreviewItems}
              onJobCreated={(jobId) => setActiveSendJobId(jobId)}
            />
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchInput('');
              router.replace(pathname);
            }}
            disabled={searchParams.toString().length === 0}
          >
            Clear Filters
          </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border bg-muted/10 p-3 text-xs md:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Selectable Accounts</p>
          <p className="text-sm font-semibold text-foreground">{selectableCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Selected Accounts</p>
          <p className="text-sm font-semibold text-foreground">{selectedCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Selected Recipients</p>
          <p className="text-sm font-semibold text-foreground">{selectedRecipientCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Items Requiring Review</p>
          <p className="text-sm font-semibold text-amber-700">{selectedGuardCount}</p>
        </div>
      </div>

      {filteredCards.length > 0 ? (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-xs font-medium text-muted-foreground">Bulk selection</p>
          <div
            className="max-h-44 overflow-y-auto rounded border bg-background text-xs"
            style={{ height: selectionViewportHeight }}
            onScroll={(event) => setSelectionScrollTop(event.currentTarget.scrollTop)}
          >
            <div style={{ height: virtualWindow.totalHeight, position: 'relative' }}>
              <div style={{ position: 'absolute', top: virtualWindow.offsetTop, left: 0, right: 0 }}>
                {virtualWindow.items.map((item) => (
                  <label
                    key={item.accountName}
                    className={`flex h-7 items-center gap-2 border-b px-2 last:border-b-0 ${item.disabled ? 'text-muted-foreground' : ''}`}
                    title={item.accountName}
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      disabled={item.disabled}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onChange={(event) => setSelectedAccounts((prev) => ({
                        ...prev,
                        [item.accountName]: event.target.checked,
                      }))}
                    />
                    <span className="truncate">
                      {item.accountName} ({item.recipients.length} recipients)
                      {item.disabled ? ' • no recipients' : ''}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm font-medium">No content matches these filters</p>
          <p className="mt-1 text-xs text-muted-foreground">Clear filters or broaden the account/campaign scope.</p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchInput('');
              router.replace(pathname);
            }}
            disabled={searchParams.toString().length === 0}
          >
            Clear Filters
          </Button>
        </div>
      )}

      <GeneratedContentGrid cards={filteredCards} recipientsByAccount={recipientsByAccount} />
    </div>
  );
}
