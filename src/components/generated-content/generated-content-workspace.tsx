'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GeneratedContentGrid, type QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';
import type { WorkspaceRecipient } from '@/lib/generated-content/queries';

type GeneratedContentWorkspaceProps = {
  cards: QueueGeneratedAccountCard[];
  recipientsByAccount: Record<string, WorkspaceRecipient[]>;
};

export function GeneratedContentWorkspace({ cards, recipientsByAccount }: GeneratedContentWorkspaceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const filteredCards = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    return cards.filter((card) => {
      const latest = card.versions[0];
      if (!latest) return false;

      const accountMatch = accountFilter === 'all' || card.account_name === accountFilter;
      const campaignMatch = campaignFilter === 'all' || card.campaign_names.includes(campaignFilter);
      const providerMatch = providerFilter === 'all' || (latest.provider_used ?? 'unknown') === providerFilter;
      const statusMatch = statusFilter === 'all'
        || (statusFilter === 'published' && latest.is_published)
        || (statusFilter === 'draft' && !latest.is_published);
      const sentMatch = sentFilter === 'all'
        || (sentFilter === 'sent' && latest.external_send_count > 0)
        || (sentFilter === 'unsent' && latest.external_send_count === 0);
      const textMatch = !loweredQuery
        || card.account_name.toLowerCase().includes(loweredQuery)
        || card.campaign_names.some((name) => name.toLowerCase().includes(loweredQuery));

      return accountMatch && campaignMatch && providerMatch && statusMatch && sentMatch && textMatch;
    });
  }, [accountFilter, campaignFilter, cards, providerFilter, query, sentFilter, statusFilter]);

  return (
    <div className="space-y-4">
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.replace(pathname)}
          disabled={searchParams.toString().length === 0}
        >
          Clear Filters
        </Button>
      </div>

      <GeneratedContentGrid cards={filteredCards} recipientsByAccount={recipientsByAccount} />
    </div>
  );
}
