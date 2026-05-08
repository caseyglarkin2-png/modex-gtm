'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Activity, Calendar, ChevronDown, ExternalLink, Inbox, MoreHorizontal, Plus, Users } from 'lucide-react';
import { AgentActionDialog } from '@/components/agent-actions/agent-action-dialog';
import { AccountOutreachShell } from '@/components/accounts/account-outreach-shell';
import { OutreachSequenceDialog } from '@/components/ai/outreach-sequence';
import { BookMeetingDialog } from '@/components/book-meeting-dialog';
import { LogActivityDialog } from '@/components/log-activity-dialog';
import { AccountOutcomeLogger } from '@/components/accounts/account-outcome-logger';
import type { AssetSendRecipient } from '@/components/email/asset-send-dialog';
import type { ComponentProps } from 'react';

type ActionId =
  | 'find-contacts'
  | 'build-committee'
  | 'draft-outreach'
  | 'compose-outreach'
  | 'generate-sequence'
  | 'book-meeting'
  | 'log-activity'
  | 'log-outcome';

type RecipientSet = ComponentProps<typeof AccountOutreachShell>['recipientSets'] extends infer T
  ? Exclude<T, undefined>
  : never;

type AccountOutcomeSources = ComponentProps<typeof AccountOutcomeLogger>['sources'];

interface AccountSecondaryActionsMenuProps {
  accountName: string;
  personas: Array<{ name: string; title?: string; priority: string }>;
  recipients: AssetSendRecipient[];
  generatedAssets: ComponentProps<typeof AccountOutreachShell>['assets'];
  recipientSets?: RecipientSet;
  initialSelectedRecipientIds?: number[];
  defaultRecipientSetKey?: string | null;
  recommendedAngle?: string;
  whyNow?: string;
  approvalGateEnabled: boolean;
  campaignSlug?: string;
  outcomeSources: AccountOutcomeSources;
  calendlyLink?: string;
}

export function AccountSecondaryActionsMenu({
  accountName,
  personas,
  recipients,
  generatedAssets,
  recipientSets,
  initialSelectedRecipientIds,
  defaultRecipientSetKey,
  recommendedAngle,
  whyNow,
  approvalGateEnabled,
  campaignSlug,
  outcomeSources,
  calendlyLink,
}: AccountSecondaryActionsMenuProps) {
  const [active, setActive] = useState<ActionId | null>(null);
  const close = () => setActive(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <MoreHorizontal className="h-3.5 w-3.5" />
            More actions
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Compose</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setActive('compose-outreach')}>
            <Activity className="mr-2 h-3.5 w-3.5" /> Compose outreach
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActive('generate-sequence')}>
            <Activity className="mr-2 h-3.5 w-3.5" /> Generate 4-step sequence
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActive('draft-outreach')}>
            <ExternalLink className="mr-2 h-3.5 w-3.5" /> Draft outreach (agent)
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Find people</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setActive('find-contacts')}>
            <Inbox className="mr-2 h-3.5 w-3.5" /> Find more contacts
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActive('build-committee')}>
            <Users className="mr-2 h-3.5 w-3.5" /> Build committee
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Track</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setActive('book-meeting')}>
            <Calendar className="mr-2 h-3.5 w-3.5" /> Book meeting
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActive('log-activity')}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Log activity
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActive('log-outcome')}>
            <Activity className="mr-2 h-3.5 w-3.5" /> Log outcome
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountOutreachShell
        accountName={accountName}
        assets={generatedAssets}
        recipients={recipients}
        recipientSets={recipientSets}
        initialSelectedRecipientIds={initialSelectedRecipientIds}
        defaultRecipientSetKey={defaultRecipientSetKey}
        recommendedAngle={recommendedAngle}
        whyNow={whyNow}
        approvalGateEnabled={approvalGateEnabled}
        open={active === 'compose-outreach'}
        onOpenChange={(open) => { if (!open) close(); }}
      />

      <OutreachSequenceDialog
        accountName={accountName}
        personas={personas.map((p) => ({ name: p.name, title: p.title, priority: p.priority }))}
        campaignSlug={campaignSlug}
        open={active === 'generate-sequence'}
        onOpenChange={(open) => { if (!open) close(); }}
      />

      <AgentActionDialog
        request={{ action: 'company_contacts', target: { accountName, company: accountName } }}
        title={`Find More Contacts for ${accountName}`}
        open={active === 'find-contacts'}
        onOpenChange={(open) => { if (!open) close(); }}
      />

      <AgentActionDialog
        request={{ action: 'committee_refresh', target: { accountName, company: accountName } }}
        title={`Build Committee for ${accountName}`}
        open={active === 'build-committee'}
        onOpenChange={(open) => { if (!open) close(); }}
      />

      <AgentActionDialog
        request={{ action: 'draft_outreach', target: { accountName, company: accountName } }}
        title={`Draft Outreach for ${accountName}`}
        open={active === 'draft-outreach'}
        onOpenChange={(open) => { if (!open) close(); }}
      />

      <BookMeetingDialog
        accountName={accountName}
        personas={personas.map((p) => ({ name: p.name, priority: p.priority }))}
        calendlyLink={calendlyLink}
        hideTrigger
        open={active === 'book-meeting'}
        onOpenChange={(open) => { if (!open) close(); }}
      />

      <LogActivityDialog
        accountName={accountName}
        personas={personas.map((p) => ({ name: p.name }))}
        hideTrigger
        open={active === 'log-activity'}
        onOpenChange={(open) => { if (!open) close(); }}
      />

      <AccountOutcomeLogger
        accountName={accountName}
        sources={outcomeSources}
        open={active === 'log-outcome'}
        onOpenChange={(open) => { if (!open) close(); }}
      />
    </>
  );
}
