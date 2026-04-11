'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Building2, ExternalLink, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { moveAccountToStage, syncAccountDeal } from './actions';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, nextPipelineStage, type PipelineStage } from '@/lib/pipeline';

export interface PipelineAccountCard {
  name: string;
  slug: string;
  stage: PipelineStage;
  priorityBand: string;
  priorityScore: number;
  outreachStatus: string;
  meetingStatus: string;
  owner: string;
  lastActivity: string | null;
  lastEmailAt: string | null;
  hubspotDealId: string | null;
}

export function PipelineBoard({ accounts }: { accounts: PipelineAccountCard[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-6">
      {PIPELINE_STAGES.map((stage) => {
        const items = accounts.filter((account) => account.stage === stage);
        return (
          <div key={stage} className="space-y-3 rounded-xl border bg-card/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{PIPELINE_STAGE_LABELS[stage]}</p>
                <p className="text-xs text-muted-foreground">{items.length} account{items.length === 1 ? '' : 's'}</p>
              </div>
              <Badge variant="outline">{items.length}</Badge>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  No accounts here yet.
                </div>
              ) : (
                items.map((account) => <PipelineCard key={account.name} account={account} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PipelineCard({ account }: { account: PipelineAccountCard }) {
  const [moving, startMoving] = useTransition();
  const [syncing, startSyncing] = useTransition();
  const nextStage = nextPipelineStage(account.stage);

  return (
    <div className="rounded-lg border bg-background p-3 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{account.name}</p>
          <p className="text-xs text-muted-foreground">Owner {account.owner || 'Casey'}</p>
        </div>
        <Badge variant={account.priorityBand === 'A' ? 'default' : 'secondary'}>{account.priorityBand || 'D'}</Badge>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Score {account.priorityScore}</p>
        <p>Outreach: {account.outreachStatus || 'Not started'}</p>
        <p>Meeting: {account.meetingStatus || 'No meeting'}</p>
        {account.lastActivity ? <p>Last activity: {new Date(account.lastActivity).toLocaleDateString()}</p> : null}
        {account.lastEmailAt ? <p>Last email: {new Date(account.lastEmailAt).toLocaleDateString()}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/accounts/${account.slug}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Open
          </Button>
        </Link>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={moving || account.stage === 'closed'}
          onClick={() => {
            startMoving(async () => {
              const result = await moveAccountToStage(account.name, nextStage);
              if (result.success) {
                toast.success(`${account.name} moved to ${PIPELINE_STAGE_LABELS[nextStage]}`);
              } else {
                toast.error(result.error ?? 'Stage update failed');
              }
            });
          }}
        >
          {moving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          Advance
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          disabled={syncing}
          onClick={() => {
            startSyncing(async () => {
              const result = await syncAccountDeal(account.name);
              if (result.success) {
                toast.success(result.dealId ? 'HubSpot deal synced' : 'No HubSpot deal created');
              } else {
                toast.error(result.error ?? 'Deal sync failed');
              }
            });
          }}
        >
          {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
          {account.hubspotDealId ? 'Update Deal' : 'Sync Deal'}
        </Button>
      </div>

      {account.hubspotDealId ? (
        <p className="text-[10px] text-emerald-600">HubSpot deal linked: {account.hubspotDealId}</p>
      ) : null}
    </div>
  );
}
