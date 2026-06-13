'use client';

/* ═══════════════════════════════════════════════════════════════
   Allentown Tour — Command Center · spine + rail (TSX port)
   AccountRow, SignalLine, Committee, DetailRail (contact + account),
   ConflictBlock, DraftEditor, EventTimeline, WebActivity.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import type {
  ViewAccount,
  ViewContact,
  ViewConflict,
  ViewSignal,
  ViewWeb,
  ViewNextStep,
  ViewEvent,
  ViewFact,
} from '@/lib/campaigns/canonical-view';
import type { CommitteeCoverage } from '@/lib/campaigns/campaign-intel';
import {
  SOURCES,
  SourceChip,
  StageChip,
  Avatar,
  Ico,
  srcIcon,
  hexA,
} from './primitives';
import { CommitteeMeter } from './intel';

type ContactLookup = (id: string) => ViewContact | undefined;
type AccountLookup = (id: string) => ViewAccount | undefined;

interface DraftFieldState {
  subject?: string;
  body?: string;
  approved?: boolean;
}
type DraftState = Record<string, DraftFieldState>;
type Overrides = Record<string, boolean>;

/* ─── Unified signal line (collapsed account) ───────────────────── */
function SignalLine({ signals }: { signals: ViewSignal[] }) {
  return (
    <div className="cc-signal-line">
      <span className="lead">
        <Ico.merge /> Unified signal
      </span>
      {signals.length === 0 && (
        <span className="empty">No reconciled signals yet — ledger still populating</span>
      )}
      {signals.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="pipe">/</span>}
          <span className="cc-sig">
            <span className="sv">{s.label}</span>
            <SourceChip code={s.src} />
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Firmographics grid (expanded) ─────────────────────────────── */
function FirmoGrid({ acct }: { acct: ViewAccount }) {
  const rows: Array<[string, ViewFact]> = [
    ['Industry', acct.industry],
    ['Revenue', acct.revenue],
    ['Employees', acct.employees],
    ['HQ', acct.hq],
    ['Segment', acct.dcs],
    ['TAM tier', acct.footprint],
  ];
  return (
    <div className="cc-firmo-grid">
      {rows.map((r) => {
        const conf = r[1].conflict;
        return (
          <div className={'cc-firmo-cell' + (conf ? ' conflicted' : '')} key={r[0]}>
            <span className="k">{r[0]}</span>
            <span className="v">
              <span className="vv">{r[1].v}</span>
              {conf ? (
                <span className="conflict-flag" title="Sources disagree">
                  <Ico.warn /> 2 src
                </span>
              ) : (
                <SourceChip code={r[1].src} />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Next-action card ──────────────────────────────────────────── */
function NextActionCard({ step }: { step: ViewNextStep }) {
  const overdue = /overdue/i.test(step.due);
  const cls = step.priority === 'med' ? 'med' : step.priority;
  return (
    <div className={'cc-next ' + cls}>
      <div className="cc-next-head">
        <span className="lbl">
          <Ico.target /> Next action
        </span>
        <span className={'due' + (overdue ? ' overdue' : '')}>{step.due}</span>
      </div>
      <div className="cc-next-do">{step.do}</div>
      <div className="cc-next-foot">
        <span className="cc-next-owner">
          <span className={'av-mini' + (step.owner === 'Auto' ? ' auto' : '')}>
            {step.owner === 'Auto' ? '⚙' : step.owner.slice(0, 1)}
          </span>
          {step.owner}
        </span>
      </div>
    </div>
  );
}

/* ─── Event timeline — stage derived from this stream ───────────── */
function EventTimeline({ events }: { events: ViewEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="cc-web-empty">
        <b>No events yet.</b> The event ledger is still populating for this person.
      </div>
    );
  }
  return (
    <div className="cc-timeline">
      <div className="cc-tl-rail" />
      {events.map((e, i) => (
        <div className="cc-tl-row" key={i}>
          <span className={'cc-tl-dot' + (e.strong ? ' strong' : '')} />
          <span className="cc-tl-body">
            <span className="tt">{e.t}</span>
            {e.detail && <span className="dt">{e.detail}</span>}
          </span>
          <span className="cc-tl-when">{e.when}</span>
          <SourceChip code={e.src} />
        </div>
      ))}
    </div>
  );
}

/* ─── Signal breakdown (expanded) ───────────────────────────────── */
function SignalBreak({ signals }: { signals: ViewSignal[] }) {
  if (signals.length === 0) {
    return (
      <div className="cc-sig-empty">
        No reconciled signals yet. As email, web, and CRM events land they fuse here.
      </div>
    );
  }
  return (
    <div className="cc-sig-break">
      {signals.map((s, i) => {
        const color = (SOURCES[s.src.split('+')[0]] || SOURCES.ICP).color;
        return (
          <div className="cc-sig-row" key={i}>
            <span className="sig-ico" style={{ background: hexA(color, 0.12), color }}>
              {srcIcon(s.src)}
            </span>
            <span className="sig-body">
              <div className="sig-label">{s.label}</div>
              {s.detail && <div className="sig-detail">{s.detail}</div>}
            </span>
            <SourceChip code={s.src} />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Account row ───────────────────────────────────────────────── */
export function AccountRow({
  acct,
  open,
  selectedAcctId,
  selectedContactId,
  contactById,
  coverage,
  onToggle,
  onSelectAccount,
  onSelectContact,
}: {
  acct: ViewAccount;
  open: boolean;
  selectedAcctId: string;
  selectedContactId: string | null;
  contactById: ContactLookup;
  coverage?: CommitteeCoverage;
  onToggle: () => void;
  onSelectAccount: (id: string) => void;
  onSelectContact: (id: string) => void;
}) {
  const committee = acct.committee
    .map((id) => contactById(id))
    .filter((c): c is ViewContact => !!c);
  const isSel = selectedAcctId === acct.id && !selectedContactId;
  const tamIn = acct.tam === 'in';
  return (
    <div
      className={
        'cc-acct' +
        (open ? ' is-open' : '') +
        (isSel ? ' is-selected' : '') +
        (acct.attention ? ' attention' : '')
      }
    >
      <div className="cc-acct-head" onClick={onToggle}>
        <div className={'cc-rank' + (acct.icp === 1 ? ' r1' : '')}>
          <span className="hash">#</span>
          <span className="num">{acct.icp}</span>
        </div>

        <div className="cc-acct-id">
          <div className="cc-acct-name-row">
            <span
              className="cc-acct-name"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAccount(acct.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              {acct.name}
            </span>
            <span className="cc-acct-domain">{acct.domain}</span>
            <span className={'cc-tam' + (tamIn ? '' : ' review')}>
              <Ico.check /> TAM · {acct.tam}
            </span>
            {acct.attention && (
              <span className="cc-attention-flag" title={acct.attentionReason}>
                <Ico.warn /> Needs attention
              </span>
            )}
          </div>
          <div className="cc-firmo">
            <span className="em">{acct.industry.v}</span>
            <span className="div">·</span>
            <span>{acct.revenue.v}</span>
            <span className="div">·</span>
            <span>{acct.employees.v} emp</span>
            {acct.hq.v && acct.hq.v !== '—' && (
              <>
                <span className="div">·</span>
                <span>{acct.hq.v}</span>
              </>
            )}
          </div>
        </div>

        <div className="cc-acct-right">
          <StageChip stage={acct.stage} />
          <div className="cc-committee-chips">
            {committee.map((c) => (
              <span className="av" key={c.id}>
                <Avatar
                  contact={c}
                  selected={selectedContactId === c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectContact(c.id);
                  }}
                />
              </span>
            ))}
            <span className="cc-chev" style={{ marginLeft: '8px' }}>
              <Ico.chevron />
            </span>
          </div>
        </div>
      </div>

      {!open && (
        <div className="cc-acct-undercard">
          <SignalLine signals={acct.signals} />
          {coverage && <CommitteeMeter coverage={coverage} accountName={acct.name} />}
        </div>
      )}

      {open && (
        <div className="cc-acct-body">
          <div>
            <div className="cc-panel-label">
              Firmographics <span className="ln" />
            </div>
            <FirmoGrid acct={acct} />
            <div className="cc-panel-label" style={{ marginTop: '14px' }}>
              Why this account <span className="ln" />
            </div>
            <div className="cc-why">
              <span className="ql">&ldquo;</span>
              <div className="wt">{acct.why || 'No reason captured yet.'}</div>
            </div>
          </div>
          <div>
            <div className="cc-panel-label">
              Unified signal · reconciled <span className="ln" />
            </div>
            <SignalBreak signals={acct.signals} />
            <div className="cc-panel-label" style={{ marginTop: '14px' }}>
              Buying committee <span className="ln" />
            </div>
            {coverage && (
              <div style={{ marginBottom: '10px' }}>
                <CommitteeMeter coverage={coverage} accountName={acct.name} />
              </div>
            )}
            <div className="cc-committee">
              {committee.length === 0 && (
                <div className="cc-sig-empty">No committee members resolved yet.</div>
              )}
              {committee.map((c) => (
                <div
                  key={c.id}
                  className={'cc-contact-card' + (selectedContactId === c.id ? ' is-selected' : '')}
                  onClick={() => onSelectContact(c.id)}
                >
                  <Avatar contact={c} selected={selectedContactId === c.id} />
                  <span className="cc-body2">
                    <span className="nm">
                      {c.name} <StageChip stage={c.engagement} />
                    </span>
                    <span className="ti">{c.title.v}</span>
                    <span className="role">{c.role}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Conflict block — generalized, with rule + human override ───── */
export function ConflictBlock({
  conflict,
  overridden,
  onOverride,
}: {
  conflict: ViewConflict;
  overridden: boolean;
  onOverride?: (key: string, val: boolean) => void;
}) {
  const top = overridden ? conflict.loser : conflict.winner;
  const bottom = overridden ? conflict.winner : conflict.loser;
  const otherLabel = SOURCES[conflict.loser.src]?.label || conflict.loser.src;
  const autoLabel = SOURCES[conflict.winner.src]?.label || conflict.winner.src;
  return (
    <div className="cc-conflict">
      <div className="cc-conflict-head">
        <span className="ic">
          <Ico.warn />
        </span>
        <span className="t">Sources disagree</span>
        <span className="field">field: {(conflict.field || 'value').toLowerCase()}</span>
      </div>
      <div className="cc-conflict-opt loser">
        <span className="badge">
          <SourceChip code={bottom.src} />
        </span>
        <span className="cbody">
          <div className="cval">{bottom.v}</div>
          <div className="cnote">{bottom.note}</div>
        </span>
      </div>
      <div className="cc-conflict-opt winner">
        <span className="badge">
          <SourceChip code={top.src} />
        </span>
        <span className="cbody">
          <div className="cval">{top.v}</div>
          <div className="cnote">{top.note}</div>
        </span>
        <span className="verdict">
          <span className={'cc-won' + (overridden ? ' human' : '')}>
            {overridden ? (
              <>
                <Ico.hand /> You
              </>
            ) : (
              <>
                <Ico.check /> Won
              </>
            )}
          </span>
        </span>
      </div>
      <div className="cc-conflict-rule">
        <span className="rk">{overridden ? 'Override' : 'Rule'}</span>
        <span className={'rv' + (overridden ? ' over' : '')}>
          {overridden ? 'Human pick · ranks above automated rules' : conflict.rule}
        </span>
        {onOverride && (
          <span
            className={'cc-override-btn' + (overridden ? ' is-over' : '')}
            onClick={() => onOverride(conflict.key, !overridden)}
          >
            {overridden ? 'Revert to ' + autoLabel : 'Use ' + otherLabel}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Draft editor ──────────────────────────────────────────────── */
function DraftEditor({
  contact,
  draftState,
  onChange,
  onApprove,
}: {
  contact: ViewContact;
  draftState: DraftState;
  onChange: (cid: string, field: 'subject' | 'body', val: string) => void;
  onApprove: (cid: string) => void;
}) {
  const d = contact.draft;
  const st = draftState[contact.id] || {};
  const subject = st.subject != null ? st.subject : d.subject;
  const body = st.body != null ? st.body : d.body;
  const approved = !!st.approved;
  const hasBody = body.trim().length > 0;

  return (
    <div className="cc-draft">
      <div className="cc-draft-head">
        <span className="t">
          <Ico.mail /> Proposed email
          <StageChip stage={d.status} />
        </span>
      </div>
      {approved && (
        <div className="cc-approved-banner">
          <Ico.check /> Approved — queued to send from {SOURCES.GM.label}
        </div>
      )}
      <div className="cc-draft-body">
        <div className="cc-draft-field">
          <div className="dl">Subject</div>
          <input
            className="cc-draft-input"
            value={subject}
            onChange={(e) => onChange(contact.id, 'subject', e.target.value)}
          />
        </div>
        <div className="cc-draft-field">
          <div className="dl">Body</div>
          {hasBody ? (
            <textarea
              className="cc-draft-textarea"
              value={body}
              onChange={(e) => onChange(contact.id, 'body', e.target.value)}
            />
          ) : (
            <div className="cc-draft-empty">
              Draft body not yet synced to the ledger. The subject line is staged; the modex engine
              authors the body at send time.
            </div>
          )}
        </div>
      </div>
      <div className="cc-draft-foot">
        <span className="cc-draft-src">
          drafted from <SourceChip code={d.src} />
        </span>
        {approved ? (
          <button className="cc-btn cc-btn--success" disabled>
            <Ico.check /> Approved
          </button>
        ) : (
          <button className="cc-btn cc-btn--primary" onClick={() => onApprove(contact.id)}>
            <Ico.check /> {d.status === 'draft' ? 'Approve & queue' : 'Approve'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Web activity — PostHog pageviews on yardflow.ai ───────────── */
function WebActivity({ web, scope }: { web: ViewWeb | null; scope: 'contact' | 'account' }) {
  if (!web) {
    return (
      <div className="cc-web">
        <div className="cc-web-head">
          <span className="dom">
            <span className="glob">
              <Ico.globe />
            </span>
            yardflow.ai
          </span>
          <SourceChip code="PH" />
        </div>
        <div className="cc-web-empty">
          <b>No identified pageviews.</b> Anonymous yardflow.ai traffic in PostHog has not matched to
          this {scope === 'account' ? 'account' : 'person'} yet — a Gmail click or form fill will
          resolve it.
        </div>
      </div>
    );
  }
  return (
    <div className="cc-web">
      <div className="cc-web-head">
        <span className="dom">
          <span className="glob">
            <Ico.globe />
          </span>
          yardflow.ai
        </span>
        <span className="ses">
          {web.sessions} sessions
          {scope === 'account' && web.identified ? ' · ' + web.identified + ' identified' : ''} ·{' '}
          {web.lastSeen}
        </span>
        <SourceChip code="PH" />
      </div>
      {web.match && (
        <div className="cc-web-match">
          <Ico.merge /> matched: {web.match}
        </div>
      )}
      {web.pages.length > 0 && (
        <div className="cc-web-rows">
          {web.pages.map((p, i) => (
            <div className={'cc-web-row' + (p.hot ? ' hot' : '')} key={i}>
              <span className="cc-web-path">{p.path}</span>
              <span className="cc-web-meta">
                <span className="views">
                  {p.views} {p.views === 1 ? 'view' : 'views'}
                </span>
                {p.dwell && <span className="dwell">{p.dwell}</span>}
              </span>
              <span className="cc-web-when">{p.when}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Detail rail (contact mode) ────────────────────────────────── */
export function ContactDetail({
  contact,
  accountById,
  draftState,
  onDraftChange,
  onApprove,
  overrides,
  onOverride,
}: {
  contact: ViewContact;
  accountById: AccountLookup;
  draftState: DraftState;
  onDraftChange: (cid: string, field: 'subject' | 'body', val: string) => void;
  onApprove: (cid: string) => void;
  overrides: Overrides;
  onOverride: (key: string, val: boolean) => void;
}) {
  const acct = accountById(contact.accId);
  return (
    <div className="cc-rail-inner">
      <div className="cc-rail-head">
        <Avatar contact={contact} size="lg" />
        <div className="meta">
          <div className="nm">{contact.name}</div>
          <div className="role-line">
            {contact.role}
            {acct ? ` · ${acct.name}` : ''}
          </div>
        </div>
        <StageChip stage={contact.engagement} />
      </div>

      {contact.nextStep && <NextActionCard step={contact.nextStep} />}

      {contact.titleConflict ? (
        <ConflictBlock
          conflict={contact.titleConflict}
          overridden={!!overrides[contact.titleConflict.key]}
          onOverride={onOverride}
        />
      ) : (
        <div className="cc-fact-row">
          <span className="fk">Title</span>
          <span className="fv">
            {contact.title.v} <SourceChip code={contact.title.src} />
            {contact.title.verified && (
              <span className="cc-won" style={{ fontSize: '8.5px' }}>
                <Ico.check /> verified
              </span>
            )}
          </span>
        </div>
      )}

      <div>
        <div className="cc-panel-label">
          Why this person <span className="ln" />
        </div>
        <div className="cc-why">
          <span className="ql">&ldquo;</span>
          <div className="wt">{contact.why || 'No reason captured yet.'}</div>
        </div>
      </div>

      <div>
        <div className="cc-panel-label">
          Web activity <span className="ln" />
        </div>
        <WebActivity web={contact.web} scope="contact" />
      </div>

      <div>
        <div className="cc-panel-label">
          Timeline · stage derived from events <span className="ln" />
        </div>
        <EventTimeline events={contact.events} />
      </div>

      <DraftEditor
        contact={contact}
        draftState={draftState}
        onChange={onDraftChange}
        onApprove={onApprove}
      />
    </div>
  );
}

/* ─── Detail rail (account mode) ────────────────────────────────── */
export function AccountDetail({
  acct,
  contactById,
  selectedContactId,
  onSelectContact,
  overrides,
  onOverride,
}: {
  acct: ViewAccount;
  contactById: ContactLookup;
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
  overrides: Overrides;
  onOverride: (key: string, val: boolean) => void;
}) {
  const committee = acct.committee
    .map((id) => contactById(id))
    .filter((c): c is ViewContact => !!c);
  return (
    <div className="cc-rail-inner">
      <div className="cc-rail-head">
        <div className={'cc-rank' + (acct.icp === 1 ? ' r1' : '')} style={{ width: '38px', height: '38px' }}>
          <span className="hash">#</span>
          <span className="num">{acct.icp}</span>
        </div>
        <div className="meta">
          <div className="nm">{acct.name}</div>
          <div className="role-line">
            {acct.domain} · TAM {acct.tam}
          </div>
        </div>
        <StageChip stage={acct.stage} />
      </div>

      {acct.nextAction && <NextActionCard step={acct.nextAction} />}

      {acct.attention && (
        <div className="cc-eng-card draft" style={{ borderColor: 'rgba(255,176,0,0.3)' }}>
          <div className="cc-eng-head">
            <span className="cc-attention-flag">
              <Ico.warn /> Why it is flagged
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#FFD27A' }}>{acct.attentionReason}</div>
        </div>
      )}

      <div>
        <div className="cc-panel-label">
          Firmographics <span className="ln" />
        </div>
        <FirmoGrid acct={acct} />
      </div>

      {acct.conflicts.map((c) => (
        <ConflictBlock
          key={c.key}
          conflict={c}
          overridden={!!overrides[c.key]}
          onOverride={onOverride}
        />
      ))}

      <div>
        <div className="cc-panel-label">
          Why this account <span className="ln" />
        </div>
        <div className="cc-why">
          <span className="ql">&ldquo;</span>
          <div className="wt">{acct.why || 'No reason captured yet.'}</div>
        </div>
      </div>

      <div>
        <div className="cc-panel-label">
          Unified signal · reconciled <span className="ln" />
        </div>
        <SignalBreak signals={acct.signals} />
      </div>

      <div>
        <div className="cc-panel-label">
          Web activity · yardflow.ai <span className="ln" />
        </div>
        <WebActivity web={acct.web} scope="account" />
      </div>

      <div>
        <div className="cc-panel-label">
          Buying committee <span className="ln" />
        </div>
        <div className="cc-committee">
          {committee.length === 0 && (
            <div className="cc-sig-empty">No committee members resolved yet.</div>
          )}
          {committee.map((c) => (
            <div
              key={c.id}
              className={'cc-contact-card' + (selectedContactId === c.id ? ' is-selected' : '')}
              onClick={() => onSelectContact(c.id)}
            >
              <Avatar contact={c} selected={selectedContactId === c.id} />
              <span className="cc-body2">
                <span className="nm">
                  {c.name} <StageChip stage={c.engagement} />
                </span>
                <span className="ti">{c.title.v}</span>
                <span className="role">{c.role}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
