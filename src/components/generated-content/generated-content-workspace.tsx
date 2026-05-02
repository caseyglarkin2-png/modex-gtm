'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GeneratedContentGrid, type QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';
import type { WorkspaceRecipient } from '@/lib/generated-content/queries';
import { filterGeneratedContentCards } from '@/lib/generated-content/workspace-filters';
import { BulkPreviewDialog, type BulkPreviewItem } from '@/components/generated-content/bulk-preview-dialog';
import { SendJobTracker } from '@/components/generated-content/send-job-tracker';

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
  const statusFilter = searchParams.get('status') ?? 'all';
  const sentFilter = searchParams.get('sent') ?? 'all';
  const query = searchParams.get('q') ?? '';

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

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  };

  const filteredCards = useMemo(
    () => filterGeneratedContentCards(cards, {
      account: accountFilter,
      campaign: campaignFilter,
      provider: providerFilter,
      status: statusFilter,
      sent: sentFilter,
      query,
    }),
    [accountFilter, campaignFilter, cards, providerFilter, query, sentFilter, statusFilter],
  );

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
      pendingJobs: card.pending_jobs,
      processingJobs: card.processing_jobs,
      content: latest?.content ?? '',
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
        latestVersion: item.latestVersion,
        pendingJobs: item.pendingJobs,
        processingJobs: item.processingJobs,
        content: item.content,
        recipients: item.recipients,
      })),
    [selectableItems],
  );

  const allSelected = selectableItems.length > 0
    && selectableItems.filter((item) => !item.disabled).every((item) => selectedAccounts[item.accountName]);

  return (
    <div className="space-y-4">
      {activeSendJobId && <SendJobTracker jobId={activeSendJobId} />}

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
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

        <Input
          placeholder="Search accounts/campaigns"
          value={query}
          onChange={(event) => setParam('q', event.target.value)}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>{filteredCards.length} account card(s) visible</p>
        <div className="flex items-center gap-2">
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
            disabled={selectableItems.filter((item) => !item.disabled).length === 0}
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
            onClick={() => router.replace(pathname)}
            disabled={searchParams.toString().length === 0}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border p-3 text-xs md:grid-cols-2 lg:grid-cols-3">
        {selectableItems.map((item) => (
          <label key={item.accountName} className={`flex items-center gap-2 ${item.disabled ? 'text-muted-foreground' : ''}`}>
            <input
              type="checkbox"
              checked={item.selected}
              disabled={item.disabled}
              onChange={(event) => setSelectedAccounts((prev) => ({
                ...prev,
                [item.accountName]: event.target.checked,
              }))}
            />
            <span>
              {item.accountName} ({item.recipients.length} recipients)
              {item.disabled ? ' • no recipients' : ''}
            </span>
          </label>
        ))}
      </div>

      <GeneratedContentGrid cards={filteredCards} recipientsByAccount={recipientsByAccount} />
    </div>
  );
}
