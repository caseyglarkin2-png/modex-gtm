'use client';

/* ═══════════════════════════════════════════════════════════════
   Allentown Tour - Command Center · intelligence + action layer (5b)
   The surface that DRIVES the tour fill: the Next Moves queue (the
   hero), the tour-fill goal meter, the per-person engagement heat,
   the committee-coverage meter, and the next-to-invite panel.

   Native to the existing terminal aesthetic - JetBrains Mono data,
   the source/provenance chip idiom, the dark operator console. No new
   visual language; these read as the brain talking inside the console.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import type {
  CampaignIntel,
  NextMove,
  EngagementHeat,
  NextBestAction,
  CommitteeCoverage,
  InviteCandidate,
  Temperature,
} from '@/lib/campaigns/campaign-intel';
import { Ico } from './primitives';

/* ─── temperature color key (shared across the layer) ───────────── */
export const TEMP_META: Record<Temperature, { label: string; cls: string }> = {
  replied: { label: 'Replied', cls: 'temp-replied' },
  warm: { label: 'Warm', cls: 'temp-warm' },
  sent: { label: 'Sent', cls: 'temp-sent' },
  cooling: { label: 'Cooling', cls: 'temp-cooling' },
  staged: { label: 'Staged', cls: 'temp-staged' },
};

const MOVE_KIND_ICON: Record<NextMove['kind'], React.ReactNode> = {
  person: <Ico.mail />,
  committee: <Ico.target />,
  invite: <Ico.pin />,
};

/* ─── Leverage pip - a compact 0..100 strength read ─────────────── */
function LeveragePip({ value }: { value: number }) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * 5);
  return (
    <span className="cc-lev" title={`Leverage ${value}/100`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={'cc-lev-pip' + (i < filled ? ' on' : '')} />
      ))}
      <span className="cc-lev-num">{value}</span>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   1 · NEXT MOVES - the hero
   ════════════════════════════════════════════════════════════════ */
export function NextMoves({ moves }: { moves: NextMove[] }) {
  return (
    <section className="cc-moves">
      <div className="cc-moves-head">
        <span className="lbl">
          <Ico.bolt /> Next moves
        </span>
        <span className="sub">Highest-leverage first · ranked to fill the tour</span>
      </div>
      {moves.length === 0 ? (
        <div className="cc-moves-empty">
          No moves yet. The ledger is still populating for this campaign.
        </div>
      ) : (
        <ol className="cc-moves-list">
          {moves.map((m, i) => (
            <li
              key={`${m.kind}-${m.refId}-${i}`}
              className={'cc-move' + (i === 0 ? ' is-top' : '') + ' kind-' + m.kind}
              style={{ animationDelay: `${Math.min(i, 12) * 38}ms` }}
            >
              <a className="cc-move-link" href={m.targetHref}>
                <span className="cc-move-ico">{MOVE_KIND_ICON[m.kind]}</span>
                <span className="cc-move-body">
                  <span className="cc-move-verb">{m.verb}</span>
                  <span className="cc-move-why">{m.why}</span>
                </span>
                <span className="cc-move-right">
                  <LeveragePip value={m.leverage} />
                  <span className="cc-move-go">
                    <Ico.arrow />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   2 · TOUR-FILL GOAL - the north-star meter
   ════════════════════════════════════════════════════════════════ */
export function TourGoal({ funnel }: { funnel: CampaignIntel['funnel'] }) {
  const { target, confirmed, warm, invited, staged, toSource, pct } = funnel;
  const seg = (n: number) => `${(n / target) * 100}%`;
  return (
    <section className="cc-goal">
      <div className="cc-goal-head">
        <span className="lbl">
          <Ico.target /> Tour fill
        </span>
        <span className="cc-goal-count">
          <b>{confirmed + warm}</b>
          <span className="of">warm or better of {target}</span>
        </span>
      </div>
      <div className="cc-goal-bar" role="img" aria-label={`${Math.round(pct * 100)}% to target`}>
        <span className="seg confirmed" style={{ width: seg(confirmed) }} />
        <span className="seg warm" style={{ width: seg(warm) }} />
        <span className="seg invited" style={{ width: seg(invited) }} />
        <span className="seg staged" style={{ width: seg(staged) }} />
      </div>
      <div className="cc-goal-legend">
        <span className="lg"><i className="dot confirmed" />Confirmed {confirmed}</span>
        <span className="lg"><i className="dot warm" />Warm {warm}</span>
        <span className="lg"><i className="dot invited" />Invited {invited}</span>
        <span className="lg"><i className="dot staged" />Staged {staged}</span>
        <span className="lg gap"><i className="dot gap" />Source {toSource} more</span>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   3 · ENGAGEMENT HEAT - inline per-person dot + next action
   ════════════════════════════════════════════════════════════════ */
export function HeatDot({ heat }: { heat: EngagementHeat }) {
  const meta = TEMP_META[heat.temp];
  return (
    <span className={'cc-heat ' + meta.cls} title={`${meta.label} · ${heat.why}`}>
      <span className="cc-heat-dot" />
      {meta.label}
    </span>
  );
}

export function PersonAction({ action }: { action: NextBestAction }) {
  return (
    <span className="cc-person-action" title={action.detail}>
      <Ico.arrow /> {action.verb}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   4 · COMMITTEE COVERAGE - meter on the account rows
   ════════════════════════════════════════════════════════════════ */
const ROLE_SHORT: Record<string, string> = {
  'economic buyer': 'Econ buyer',
  'regional P&L owner': 'Regional P&L',
  practitioner: 'DC ops',
  'corporate supply chain': 'Corp supply chain',
};

export function CommitteeMeter({
  coverage,
  accountName,
}: {
  coverage: CommitteeCoverage;
  accountName: string;
}) {
  const filled = coverage.coveredRoles.length;
  const total = coverage.targetRoles.length;
  return (
    <div className="cc-cov">
      <div className="cc-cov-track">
        {coverage.targetRoles.map((r) => {
          const covered = coverage.coveredRoles.includes(r);
          return (
            <span
              key={r}
              className={'cc-cov-cell' + (covered ? ' on' : '')}
              title={`${ROLE_SHORT[r] || r}${covered ? ' · covered' : ' · missing'}`}
            />
          );
        })}
      </div>
      <span className="cc-cov-label">
        Committee {filled}/{total}
      </span>
      {coverage.missingRoles.length > 0 && (
        <a
          className="cc-cov-source"
          href={`/discovery?q=${encodeURIComponent(accountName)}`}
          onClick={(e) => e.stopPropagation()}
          title={`Missing ${coverage.missingRoles.map((r) => ROLE_SHORT[r] || r).join(', ')}`}
        >
          <Ico.hand /> Source {coverage.missingRoles.map((r) => ROLE_SHORT[r] || r).join(', ')}
        </a>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   5 · NEXT TO INVITE - ranked zero-contact corridor accounts
   ════════════════════════════════════════════════════════════════ */
export function NextToInvite({ invites }: { invites: InviteCandidate[] }) {
  return (
    <section className="cc-invite">
      <div className="cc-invite-head">
        <span className="lbl">
          <Ico.pin /> Next to invite
        </span>
        <span className="sub">Closest open accounts with no committee yet</span>
      </div>
      {invites.length === 0 ? (
        <div className="cc-invite-empty">
          No open corridor accounts surfaced. Every nearby prospect already has a contact.
        </div>
      ) : (
        <div className="cc-invite-list">
          {invites.map((c) => (
            <a
              key={c.name}
              className="cc-invite-row"
              href={`/discovery?q=${encodeURIComponent(c.name)}`}
            >
              <span className={'cc-invite-tier t' + c.tier}>{c.tier}</span>
              <span className="cc-invite-body">
                <span className="nm">{c.name}</span>
                <span className="reason">{c.reason}</span>
              </span>
              <span className="cc-invite-dist">
                {c.distanceMi} mi
                <span className="cs">{c.cityState}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
