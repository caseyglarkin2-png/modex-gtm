'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnePageSendDialog, type Recipient } from '@/components/email/one-pager-send-dialog';
import { toast } from 'sonner';
import { Send, Upload } from 'lucide-react';

export interface QueueGeneratedVersion {
  id: number;
  version: number;
  provider_used: string | null;
  external_send_count: number;
  is_published: boolean;
  content: string;
  created_at: string;
  campaign_id?: number;
  campaign_name?: string;
}

export interface QueueGeneratedAccountCard {
  account_name: string;
  account_slug: string;
  latest_version: number;
  pending_jobs: number;
  processing_jobs: number;
  campaign_names: string[];
  versions: QueueGeneratedVersion[];
}

interface GeneratedContentGridProps {
  cards: QueueGeneratedAccountCard[];
  recipientsByAccount: Record<string, Recipient[]>;
}

export function GeneratedContentGrid({ cards, recipientsByAccount }: GeneratedContentGridProps) {
  const [selectedByAccount, setSelectedByAccount] = useState<Record<string, number>>(() =>
    Object.fromEntries(cards.map((card) => [card.account_name, card.versions[0]?.id ?? 0])),
  );
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [sendStatusByKey, setSendStatusByKey] = useState<Record<string, string>>({});

  const selectedVersionMap = useMemo(() => {
    const entries = cards.map((card) => {
      const selectedId = selectedByAccount[card.account_name] ?? card.versions[0]?.id;
      const selectedVersion = card.versions.find((version) => version.id === selectedId) ?? card.versions[0];
      return [card.account_name, selectedVersion] as const;
    });
    return Object.fromEntries(entries);
  }, [cards, selectedByAccount]);

  async function publishVersion(versionId: number) {
    setPublishingId(versionId);
    try {
      const response = await fetch(`/api/ai/generated-content/${versionId}/publish`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Publish failed');
      toast.success('Published version');
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publish failed');
    } finally {
      setPublishingId(null);
    }
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No generated one-pagers yet. Queue a batch to populate this grid.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map((card) => {
        const selected = selectedVersionMap[card.account_name];
        if (!selected) return null;

        const key = `${card.account_name}:${selected.id}`;
        const recipients = recipientsByAccount[card.account_name] ?? [];

        return (
          <Card key={card.account_name}>
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  <Link href={`/accounts/${card.account_slug}`} className="hover:underline">
                    {card.account_name}
                  </Link>
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {card.processing_jobs > 0 && <Badge className="bg-blue-100 text-blue-800">Processing {card.processing_jobs}</Badge>}
                  {card.pending_jobs > 0 && <Badge variant="secondary">Pending {card.pending_jobs}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Version</p>
                <Select
                  value={selected.id.toString()}
                  onValueChange={(value) => setSelectedByAccount((prev) => ({ ...prev, [card.account_name]: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {card.versions.map((version) => (
                      <SelectItem key={version.id} value={version.id.toString()}>
                        v{version.version} {version.is_published ? '(Published)' : '(Draft)'}{version.external_send_count > 0 ? ` • ${version.external_send_count} sent` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="rounded-md border p-2">Provider: {selected.provider_used ?? 'unknown'}</div>
                <div className="rounded-md border p-2">Recipients: {recipients.length}</div>
                <div className="rounded-md border p-2">Created: {new Date(selected.created_at).toLocaleDateString()}</div>
                <div className="rounded-md border p-2">External sends: {selected.external_send_count}</div>
                <div className="col-span-2 rounded-md border p-2">
                  Campaigns: {card.campaign_names.length > 0 ? card.campaign_names.join(', ') : 'None'}
                </div>
              </div>

              <div className="flex gap-2">
                {!selected.is_published && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => publishVersion(selected.id)}
                    disabled={publishingId === selected.id}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {publishingId === selected.id ? 'Publishing...' : 'Publish'}
                  </Button>
                )}

                <OnePageSendDialog
                  accountName={card.account_name}
                  generatedContentId={selected.id}
                  generatedContent={{
                    account_name: card.account_name,
                    content: selected.content,
                    version: selected.version,
                    provider_used: selected.provider_used ?? undefined,
                  }}
                  queueState={{
                    latestVersion: card.latest_version,
                    pendingJobs: card.pending_jobs,
                    processingJobs: card.processing_jobs,
                  }}
                  recipients={recipients}
                  onSuccess={(result) => {
                    setSendStatusByKey((prev) => ({
                      ...prev,
                      [key]: `${result.sent} sent / ${result.failed} failed`,
                    }));
                  }}
                  trigger={(
                    <Button size="sm" className="flex-1" disabled={recipients.length === 0}>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Preview & Send
                    </Button>
                  )}
                />
              </div>

              {sendStatusByKey[key] && (
                <p className="text-xs text-muted-foreground">Last send: {sendStatusByKey[key]}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
