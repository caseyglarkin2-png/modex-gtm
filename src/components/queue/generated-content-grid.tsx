'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssetSendDialog, type AssetSendRecipient } from '@/components/email/asset-send-dialog';
import { GeneratedContentPreviewDialog } from '@/components/generated-content/generated-content-preview-dialog';
import { ContentDiffDialog } from '@/components/generated-content/content-diff-dialog';
import { toast } from 'sonner';
import { MoreHorizontal, Send, Upload } from 'lucide-react';
import type { ContentQualityResult } from '@/lib/content-quality';
import { COLD_OUTBOUND_PROMPT_POLICY_VERSION, DEFAULT_CTA_MODE } from '@/lib/revops/cold-outbound-policy';

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
  campaign_type?: string;
  quality: ContentQualityResult;
  checklist?: {
    complete: boolean;
    requiredComplete: number;
    requiredTotal: number;
    missingRequired: string[];
  };
  checklist_completed_item_ids?: string[];
  infographic_type?: string;
  stage_intent?: string;
  bundle_id?: string | null;
  sequence_position?: number | null;
  contract?: {
    complete: boolean;
    qualityScore: number;
  };
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
  recipientsByAccount: Record<string, AssetSendRecipient[]>;
}

function qualityBadgeTone(score: number) {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800';
  if (score >= 60) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function buildTrendPoints(values: number[]): string {
  if (values.length === 0) return '';
  const width = 96;
  const height = 28;
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (Math.max(0, Math.min(100, value)) / 100) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

export function GeneratedContentGrid({ cards, recipientsByAccount }: GeneratedContentGridProps) {
  const [selectedByAccount, setSelectedByAccount] = useState<Record<string, number>>(() =>
    Object.fromEntries(cards.map((card) => [card.account_name, card.versions[0]?.id ?? 0])),
  );
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [sendStatusByKey, setSendStatusByKey] = useState<Record<string, string>>({});
  const [previewOpenForId, setPreviewOpenForId] = useState<number | null>(null);
  const [diffOpenForId, setDiffOpenForId] = useState<number | null>(null);

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

  async function publishBundle(bundleId: string) {
    setPublishingId(-1);
    try {
      const response = await fetch(`/api/revops/infographic-bundles/${encodeURIComponent(bundleId)}/publish`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Bundle publish failed');
      toast.success('Published infographic bundle');
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bundle publish failed');
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
        const previousVersion = card.versions.find((version) => version.version === selected.version - 1)
          ?? card.versions.find((version) => version.id !== selected.id);

        return (
          <Card key={card.account_name}>
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  <Link
                    href={`/accounts/${card.account_slug}`}
                    className="inline-block max-w-[240px] truncate hover:underline"
                    title={card.account_name}
                  >
                    {card.account_name}
                  </Link>
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {card.processing_jobs > 0 && <Badge className="bg-blue-100 text-blue-800">Processing {card.processing_jobs}</Badge>}
                  {card.pending_jobs > 0 && <Badge variant="secondary">Pending {card.pending_jobs}</Badge>}
                  <Badge className={qualityBadgeTone(selected.quality.score)}>
                    Quality {selected.quality.score}
                  </Badge>
                  {selected.contract ? (
                    <Badge variant={selected.contract.complete ? 'default' : 'outline'}>
                      Contract {selected.contract.complete ? `Ready ${selected.contract.qualityScore}` : `Incomplete ${selected.contract.qualityScore}`}
                    </Badge>
                  ) : null}
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
                <div className="rounded-md border p-2">Type: {selected.infographic_type?.replaceAll('_', ' ') ?? 'cold_hook'}</div>
                <div className="rounded-md border p-2">Stage: {selected.stage_intent ?? 'cold'}</div>
                {selected.bundle_id ? (
                  <div className="rounded-md border p-2">Bundle: {selected.bundle_id}#{selected.sequence_position ?? '-'}</div>
                ) : null}
                  <div className="col-span-2 rounded-md border p-2" title={card.campaign_names.join(', ')}>
                    Campaigns: {card.campaign_names.length > 0 ? card.campaign_names.join(', ') : 'None'}
                  </div>
                  <div className="col-span-2 rounded-md border p-2">
                    QA Advisory: {selected.checklist?.requiredComplete ?? 0}/{selected.checklist?.requiredTotal ?? 0} required
                    {selected.checklist?.complete ? ' clear' : ' present'}
                  </div>
                </div>

              <details className="rounded-md border p-2 text-xs">
                <summary className="cursor-pointer font-medium text-foreground">
                  Quality Breakdown
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
                  <div className="rounded-md border p-2">Clarity: {selected.quality.scores.clarity}</div>
                  <div className="rounded-md border p-2">Personalization: {selected.quality.scores.personalization}</div>
                  <div className="rounded-md border p-2">CTA Strength: {selected.quality.scores.cta_strength}</div>
                  <div className="rounded-md border p-2">Compliance Risk: {selected.quality.scores.compliance_risk}</div>
                  <div className="rounded-md border p-2">Deliverability Risk: {selected.quality.scores.deliverability_risk}</div>
                  <div className="rounded-md border p-2">Flags: {selected.quality.flags.length > 0 ? selected.quality.flags.join(', ') : 'none'}</div>
                </div>
                {selected.quality.fixes.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                    {selected.quality.fixes.map((fix) => (
                      <li key={fix}>{fix}</li>
                    ))}
                  </ul>
                ) : null}
              </details>

              <div className="rounded-md border p-2 text-xs">
                <p className="font-medium text-foreground">Quality Trend (v1..v{card.latest_version})</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <svg viewBox="0 0 96 28" className="h-7 w-full max-w-[220px]" role="img" aria-label="Quality trend sparkline">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      points={buildTrendPoints([...card.versions].sort((a, b) => a.version - b.version).map((v) => v.quality.score))}
                    />
                  </svg>
                  <span className="text-muted-foreground">
                    Latest {selected.quality.score}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <GeneratedContentPreviewDialog
                  accountName={card.account_name}
                  version={selected.version}
                  content={selected.content}
                  providerUsed={selected.provider_used}
                  generatedContentId={selected.id}
                  contentType="one_pager"
                  campaignType={selected.campaign_type}
                  checklistCompletedItemIds={selected.checklist_completed_item_ids}
                  recipients={recipients}
                  promptPolicyVersion={COLD_OUTBOUND_PROMPT_POLICY_VERSION}
                  ctaMode={DEFAULT_CTA_MODE}
                  open={previewOpenForId === selected.id}
                  onOpenChange={(open) => setPreviewOpenForId(open ? selected.id : null)}
                  trigger={null}
                />
                {previousVersion ? (
                  <ContentDiffDialog
                    accountName={card.account_name}
                    oldVersion={previousVersion.version}
                    oldContent={previousVersion.content}
                    newVersion={selected.version}
                    newContent={selected.content}
                    open={diffOpenForId === selected.id}
                    onOpenChange={(open) => setDiffOpenForId(open ? selected.id : null)}
                    trigger={null}
                  />
                ) : null}

                <AssetSendDialog
                  accountName={card.account_name}
                  generatedContentId={selected.id}
                    generatedContent={{
                      account_name: card.account_name,
                      content: selected.content,
                      version: selected.version,
                      provider_used: selected.provider_used ?? undefined,
                      quality: selected.quality,
                      campaign_type: selected.campaign_type,
                      checklist: selected.checklist,
                      checklist_completed_item_ids: selected.checklist_completed_item_ids,
                      prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
                      cta_mode: DEFAULT_CTA_MODE,
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Open review actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setPreviewOpenForId(selected.id)}>
                      Review Preview
                    </DropdownMenuItem>
                    {previousVersion ? (
                      <DropdownMenuItem onSelect={() => setDiffOpenForId(selected.id)}>
                        Review Diff
                      </DropdownMenuItem>
                    ) : null}
                    {!selected.is_published ? (
                      <DropdownMenuItem
                        onSelect={() => publishVersion(selected.id)}
                        disabled={publishingId === selected.id}
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        {publishingId === selected.id ? 'Publishing...' : 'Publish Version'}
                      </DropdownMenuItem>
                    ) : null}
                    {selected.bundle_id ? (
                      <DropdownMenuItem
                        onSelect={() => publishBundle(selected.bundle_id!)}
                        disabled={publishingId === -1}
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        {publishingId === -1 ? 'Publishing Bundle...' : 'Publish Bundle'}
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
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
