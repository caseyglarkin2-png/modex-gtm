'use client';

/* ═══════════════════════════════════════════════════════════════
   Allentown Tour — Command Center · interactive client console
   Receives the server-fetched, adapted view as props. Owns all
   selection / filter / draft / override state.
   ═══════════════════════════════════════════════════════════════ */

import React, { useMemo, useState } from 'react';
import type { CommandCenterView, ViewAccount, ViewContact } from '@/lib/campaigns/canonical-view';
import type { Corridor, ProspectRow } from '@/lib/discovery/types';
import type { CampaignIntel } from '@/lib/campaigns/campaign-intel';
import type { CampaignAccountInput } from '@/lib/campaigns/account-match';
import { Funnel, SourceHealth } from './primitives';
import { AccountRow, ContactDetail, AccountDetail } from './spine';
import { CampaignMap } from './campaign-map';
import { InvitedPeople } from './invited-people';
import { NextMoves, TourGoal, NextToInvite } from './intel';

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" aria-label="YardFlow">
      <path d="M4 24 C8 24, 10 21, 14 17" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M14 30 C14 24, 14 21, 14 17" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M14 17 C18 13, 22 13, 28 18" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="4" cy="24" r="2.5" fill="#00B4FF" />
      <circle cx="14" cy="30" r="2.5" fill="#00B4FF" />
      <circle cx="28" cy="18" r="2.5" fill="#00B4FF" />
      <circle cx="14" cy="17" r="3" fill="#00B4FF" />
    </svg>
  );
}

const STAGE_PILLS: Array<[string, string]> = [
  ['all', 'All'],
  ['replied', 'Replied'],
  ['opened', 'Opened'],
  ['sent', 'Sent'],
  ['draft', 'Draft'],
  ['booked', 'Booked'],
];

export function CommandCenter({
  view,
  prospects,
  corridors,
  intel,
}: {
  view: CommandCenterView;
  prospects: ProspectRow[];
  corridors: Corridor[];
  intel: CampaignIntel;
}) {
  const { accounts, contacts, funnel, sourceHealth, liveSite } = view;

  // The campaign's accounts as the matcher expects them (id/name/domain).
  const campaignAccounts = useMemo<CampaignAccountInput[]>(
    () => accounts.map((a) => ({ id: a.id, name: a.name, domain: a.domain })),
    [accounts],
  );

  const contactById = useMemo(() => {
    const m = new Map(contacts.map((c) => [c.id, c]));
    return (id: string) => m.get(id);
  }, [contacts]);
  const accountById = useMemo(() => {
    const m = new Map(accounts.map((a) => [a.id, a]));
    return (id: string) => m.get(id);
  }, [accounts]);

  const firstAcct = accounts[0]?.id ?? '';
  const [selectedAcctId, setSelectedAcctId] = useState<string>(firstAcct);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(
    firstAcct ? { [firstAcct]: true } : {},
  );
  const [stageFilter, setStageFilter] = useState('all');
  const [acctFilter, setAcctFilter] = useState('all');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [draftState, setDraftState] = useState<
    Record<string, { subject?: string; body?: string; approved?: boolean }>
  >({});
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const attentionCount = accounts.filter((a) => a.attention).length;

  function matchesStage(a: ViewAccount): boolean {
    if (stageFilter === 'all') return true;
    if (stageFilter === 'contacts' || stageFilter === 'drafts') return true;
    if (a.stage === stageFilter) return true;
    return a.committee.some((id) => contactById(id)?.engagement === stageFilter);
  }

  const visibleAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (acctFilter !== 'all' && a.id !== acctFilter) return false;
      if (attentionOnly && !a.attention) return false;
      if (!matchesStage(a)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, stageFilter, acctFilter, attentionOnly]);

  function toggleOpen(id: string) {
    setOpenIds((p) => ({ ...p, [id]: !p[id] }));
  }
  function selectContact(id: string) {
    const c = contactById(id);
    setSelectedContactId(id);
    if (c) setSelectedAcctId(c.accId);
  }
  function selectAccount(id: string) {
    setSelectedAcctId(id);
    setSelectedContactId(null);
  }
  function pickMapAccount(id: string) {
    selectAccount(id);
    setOpenIds((p) => ({ ...p, [id]: true }));
  }
  function onDraftChange(cid: string, field: 'subject' | 'body', val: string) {
    setDraftState((p) => ({ ...p, [cid]: { ...p[cid], [field]: val } }));
  }
  function onApprove(cid: string) {
    setDraftState((p) => ({ ...p, [cid]: { ...p[cid], approved: true } }));
  }
  function onOverride(key: string, val: boolean) {
    setOverrides((p) => ({ ...p, [key]: val }));
  }

  const selContact: ViewContact | undefined = selectedContactId
    ? contactById(selectedContactId)
    : undefined;
  const selAccount: ViewAccount | undefined = accountById(selectedAcctId);

  return (
    <div className="cc-app">
      {/* ─── TOP STRIP ─── */}
      <div className="cc-top">
        <div className="cc-top-head">
          <div className="cc-brand">
            <span className="cc-brand-mark">
              <BrandMark />
            </span>
            <span className="cc-brand-text">
              <span className="wm">
                Yard<span className="flow">Flow</span>
              </span>
              <span className="by">by FreightRoll</span>
            </span>
          </div>
          <div className="cc-campaign">
            <span className="eyebrow">Campaign · command center</span>
            <span className="name">Allentown Tour</span>
          </div>
          <div className="cc-livesite">
            <span className="op-pulse" style={{ marginRight: '2px' }}>
              <span />
            </span>
            <span>
              <span className="lbl">Live site</span>
              <br />
              <span className="val">
                {liveSite.name} · <span className="city">{liveSite.city}</span>
              </span>
            </span>
          </div>
        </div>

        <div className="cc-funnel-wrap">
          <Funnel data={funnel} activeStage={stageFilter} onPick={setStageFilter} />
          <SourceHealth health={sourceHealth} />
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="cc-body">
        <div className="cc-spine-col">
          <TourGoal funnel={intel.funnel} />
          <NextMoves moves={intel.moves} />
          <InvitedPeople
            contacts={contacts}
            accountById={accountById}
            selectedContactId={selectedContactId}
            onSelectContact={selectContact}
            heatByPersonId={intel.heatByPersonId}
            actionByPersonId={intel.actionByPersonId}
          />
          <div className="cc-filters">
            <div className="cc-stage-pills">
              {STAGE_PILLS.map((s) => (
                <span
                  key={s[0]}
                  className={'cc-stage-pill' + (stageFilter === s[0] ? ' is-active' : '')}
                  onClick={() => setStageFilter(s[0])}
                >
                  {s[1]}
                </span>
              ))}
            </div>
            <select
              className="cc-select"
              value={acctFilter}
              onChange={(e) => setAcctFilter(e.target.value)}
            >
              <option value="all">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span
              className={'cc-toggle' + (attentionOnly ? ' is-on' : '')}
              onClick={() => setAttentionOnly((v) => !v)}
            >
              <span className="sw" />
              Needs attention <span className="att-count">{attentionCount}</span>
            </span>
          </div>

          <div className="cc-spine">
            {visibleAccounts.length === 0 && (
              <div className="cc-spine-empty">No accounts match this filter.</div>
            )}
            {visibleAccounts.map((a) => (
              <AccountRow
                key={a.id}
                acct={a}
                open={!!openIds[a.id]}
                selectedAcctId={selectedAcctId}
                selectedContactId={selectedContactId}
                contactById={contactById}
                coverage={intel.coverageByAccountId[a.id]}
                onToggle={() => toggleOpen(a.id)}
                onSelectAccount={selectAccount}
                onSelectContact={selectContact}
              />
            ))}
          </div>
        </div>

        {/* ─── RIGHT RAIL ─── */}
        <div className="cc-rail-col">
          <CampaignMap
            prospects={prospects}
            corridors={corridors}
            accounts={campaignAccounts}
            selectedAcctId={selectedAcctId}
            onPick={pickMapAccount}
          />
          <NextToInvite invites={intel.invites} />
          <div className="cc-rail">
            {selContact ? (
              <ContactDetail
                contact={selContact}
                accountById={accountById}
                draftState={draftState}
                onDraftChange={onDraftChange}
                onApprove={onApprove}
                overrides={overrides}
                onOverride={onOverride}
              />
            ) : selAccount ? (
              <AccountDetail
                acct={selAccount}
                contactById={contactById}
                selectedContactId={selectedContactId}
                onSelectContact={selectContact}
                overrides={overrides}
                onOverride={onOverride}
              />
            ) : (
              <div className="cc-rail-inner">
                <div className="cc-spine-empty">Select an account to see detail.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
