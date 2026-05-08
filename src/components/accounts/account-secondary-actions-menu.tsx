'use client';

import { useMemo, useState } from 'react';
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
  const handleOpenChange = (open: boolean) => { if (!open) setActive(null); };

  // The three dialogs that need persona views project different fields; building
  // them once avoids re-mapping on every render of the active dialog.
  const sequencePersonas = useMemo(
    () => personas.map((p) => ({ name: p.name, title: p.title, priority: p.priority })),
    [personas],
  );
  const meetingPersonas = useMemo(
    () => personas.map((p) => ({ name: p.name, priority: p.priority })),
    [personas],
  );
  const activityPersonas = useMemo(
    () => personas.map((p) => ({ name: p.name })),
    [personas],
  );

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

      {active === 'compose-outreach' && (
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
          open
          onOpenChange={handleOpenChange}
        />
      )}

      {active === 'generate-sequence' && (
        <OutreachSequenceDialog
          accountName={accountName}
          personas={sequencePersonas}
          campaignSlug={campaignSlug}
          open
          onOpenChange={handleOpenChange}
        />
      )}

      {active === 'find-contacts' && (
        <AgentActionDialog
          request={{ action: 'company_contacts', target: { accountName, company: accountName } }}
          title={`Find More Contacts for ${accountName}`}
          open
          onOpenChange={handleOpenChange}
        />
      )}

      {active === 'build-committee' && (
        <AgentActionDialog
          request={{ action: 'committee_refresh', target: { accountName, company: accountName } }}
          title={`Build Committee for ${accountName}`}
          open
          onOpenChange={handleOpenChange}
        />
      )}

      {active === 'draft-outreach' && (
        <AgentActionDialog
          request={{ action: 'draft_outreach', target: { accountName, company: accountName } }}
          title={`Draft Outreach for ${accountName}`}
          open
          onOpenChange={handleOpenChange}
        />
      )}

      {active === 'book-meeting' && (
        <BookMeetingDialog
          accountName={accountName}
          personas={meetingPersonas}
          calendlyLink={calendlyLink}
          open
          onOpenChange={handleOpenChange}
        />
      )}

      {active === 'log-activity' && (
        <LogActivityDialog
          accountName={accountName}
          personas={activityPersonas}
          open
          onOpenChange={handleOpenChange}
        />
      )}

      {active === 'log-outcome' && (
        <AccountOutcomeLogger
          accountName={accountName}
          sources={outcomeSources}
          open
          onOpenChange={handleOpenChange}
        />
      )}
    </>
  );
}
