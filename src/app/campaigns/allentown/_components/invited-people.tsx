'use client';

/* ═══════════════════════════════════════════════════════════════
   Allentown Tour — Command Center · invited people
   The 7 people we staged for this campaign, surfaced as a first-class
   section (not buried in the account spine). Each shows name, title,
   account, the draft subject, and the engagement state from the
   ledger (drafted / sent / opened / replied), rendered with the same
   Contacted / In-CRM badge idiom the /discovery worklist uses.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import type { ViewAccount, ViewContact } from '@/lib/campaigns/canonical-view';
import type { EngagementHeat, NextBestAction } from '@/lib/campaigns/campaign-intel';
import { Avatar, Ico } from './primitives';
import { HeatDot, PersonAction } from './intel';

/**
 * Mirror the /discovery worklist badge language (outline pill, stage-tinted).
 * draft -> "Drafted" (staged, nothing sent yet); sent/opened/replied light up
 * when sends fire. This is the engagement truth for each invited person.
 */
const ENGAGEMENT_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Drafted', cls: 'eng-draft' },
  sent: { label: 'Sent', cls: 'eng-sent' },
  opened: { label: 'Opened', cls: 'eng-opened' },
  replied: { label: 'Replied', cls: 'eng-replied' },
};

function EngagementBadge({ engagement }: { engagement: string }) {
  const b = ENGAGEMENT_BADGE[engagement] ?? ENGAGEMENT_BADGE.draft;
  return (
    <span className={'cc-people-badge ' + b.cls}>
      <span className="pt" />
      {b.label}
    </span>
  );
}

export function InvitedPeople({
  contacts,
  accountById,
  selectedContactId,
  onSelectContact,
  heatByPersonId,
  actionByPersonId,
}: {
  contacts: ViewContact[];
  accountById: (id: string) => ViewAccount | undefined;
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
  heatByPersonId: Record<string, EngagementHeat>;
  actionByPersonId: Record<string, NextBestAction>;
}) {
  const sentCount = contacts.filter((c) => c.engagement !== 'draft').length;

  return (
    <section className="cc-people">
      <div className="cc-people-head">
        <span className="lbl">
          <Ico.mail /> Invited people
        </span>
        <span className="sub">
          {contacts.length} staged · {sentCount} contacted
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="cc-people-empty">
          No people staged yet. The canonical view returned an empty roster for this campaign.
        </div>
      ) : (
        <div className="cc-people-grid">
          {contacts.map((c) => {
            const acct = accountById(c.accId);
            const selected = selectedContactId === c.id;
            const heat = heatByPersonId[c.id];
            const action = actionByPersonId[c.id];
            return (
              <button
                type="button"
                key={c.id}
                className={'cc-person' + (selected ? ' is-selected' : '')}
                onClick={() => onSelectContact(c.id)}
              >
                <Avatar contact={c} selected={selected} />
                <span className="cc-person-body">
                  <span className="cc-person-top">
                    <span className="nm">{c.name}</span>
                    {heat ? <HeatDot heat={heat} /> : <EngagementBadge engagement={c.engagement} />}
                  </span>
                  <span className="ti">{c.title.v && c.title.v !== '—' ? c.title.v : c.role}</span>
                  <span className="acct">{acct ? acct.name : c.accId}</span>
                  {action ? (
                    <PersonAction action={action} />
                  ) : (
                    c.draft.subject && (
                      <span className="subj" title={c.draft.subject}>
                        <Ico.mail /> {c.draft.subject}
                      </span>
                    )
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
