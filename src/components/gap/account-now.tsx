/**
 * NOW (V2, 2026-10-02; account-first hierarchy UX-04, 2026-10-06): the account read in the order a seller decides.
 *
 *   DECISION   the state line (its hold colour), the inbound line, NEXT with the ONE primary control, the People
 *              Stack with the chosen person first (UX-03), the relationship route, the do-not-contact line
 *   CONTEXT    WHY NOW (checked lines; market and finance chatter never), KNOW, THINK, ASK, the private line, WEDGE,
 *              ASSET, the tools row
 *
 * One column is the PRIMARY desktop design (Casey's display runs at about 820 CSS px); from 1100 px the context
 * sits beside the decision in a second column, DOM order unchanged (WCAG 2.4.3). THE GAP block shows only when the
 * buyer confirmed something; IMPACT only when the buyer named a cost. Seller words only; machine labels live in
 * SOURCES. Server-renderable; the only client pieces are Listen, the stack, the checks and the flags disclosure.
 */
import Link from 'next/link';
import { PendingLink } from '@/components/gap/pending-link';
import type { NowLine, NowView } from '@/lib/gap/context/now';
import { VoicePreviewButton } from '@/components/voice-preview-button';
import { AddToGapButton } from '@/components/gap/add-to-gap-button';
import { BlockedPeople } from '@/components/gap/blocked-people';
import { EmploymentControl } from '@/components/gap/employment-control';
import { OutstandingDraftPanel } from '@/components/gap/outstanding-draft-panel';
import { PeopleStackView, type SetAsidePerson } from '@/components/gap/people-stack';
import { NoteControl } from '@/components/gap/note-control';
import type { PeopleStack } from '@/lib/gap/people/stack';
import type { PursuitState } from '@/lib/gap/pursuit/state';

/**
 * UX-03 (account-first): the pursuit state and the People Stack, when the page loaded them. The header, NEXT and the
 * people read from this one state; the old WHO slot renders only when it is absent (older callers and tests).
 */
export interface NowPursuit {
  state: PursuitState;
  stack: PeopleStack | null;
  hypothesisId: string | null;
  excluded: SetAsidePerson[];
}

const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

const TAG_TONE: Record<NowLine['tag'], string> = {
  'Buyer said': 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
  Checked: 'border-sky-600 text-sky-700 dark:text-sky-400',
  Unverified: 'border-dashed border-[var(--border)] text-[var(--muted-foreground)]',
  'Our read': 'border-[var(--border)] text-[var(--muted-foreground)]',
  Unknown: 'border-[var(--border)] text-[var(--muted-foreground)]',
  Contradicted: 'border-red-600 text-red-700 dark:text-red-400',
};
const GAP_TONE: Record<string, string> = { 'Buyer said': 'text-emerald-700 dark:text-emerald-400', 'Our read': 'text-[var(--muted-foreground)]', Unknown: 'text-amber-700 dark:text-amber-400' };

/** The hold colour of the state line (UX-04): a hold reads as one at a glance. */
const STATE_TONE: Record<string, string> = {
  opted_out: 'text-red-700 dark:text-red-400',
  replied: 'text-sky-800 dark:text-sky-300',
  in_deal: 'text-amber-700 dark:text-amber-400',
  held: 'text-amber-700 dark:text-amber-400',
  follow_up_due: 'text-sky-800 dark:text-sky-300',
  in_motion: 'text-[var(--muted-foreground)]',
  ready: 'text-emerald-700 dark:text-emerald-400',
  choose_person: 'text-[var(--foreground)]',
  research: 'text-[var(--muted-foreground)]',
  idle: 'text-[var(--muted-foreground)]',
};

function Tag({ tag }: { tag: NowLine['tag'] }) {
  return <span className={`inline-block shrink-0 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_TONE[tag]}`}>{tag}</span>;
}

function Line({ l, testId }: { l: NowLine; testId: string }) {
  return (
    <li className="space-y-0.5" data-testid={testId} data-tag={l.tag}>
      <div className="flex items-start gap-2">
        <Tag tag={l.tag} />
        <p className="min-w-0 break-words text-sm">{l.text}</p>
      </div>
      <p className="ml-1 text-xs text-[var(--muted-foreground)]">
        {l.basis}
        {l.cite ? ` · ${l.cite}` : ''}
      </p>
    </li>
  );
}

function Slot({ label, children, testId }: { label: string; children: React.ReactNode; testId: string }) {
  return (
    <section className="space-y-1" data-testid={testId}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</h2>
      {children}
    </section>
  );
}

export function AccountNowView({ v, nextHref, nextLabel, links, mailbox = null, pursuit = null, nextText = null }: { v: NowView; nextHref: string | null; nextLabel: string | null; links: Array<{ label: string; href: string; external?: boolean }>; mailbox?: string | null; pursuit?: NowPursuit | null; nextText?: string | null }) {
  // The state line keeps the entity and buyer type from the brief and takes the pursuit state for the rest.
  const stateLine = pursuit ? [...v.stateLine.split(' · ').slice(0, 2), pursuit.state.stateLine, ...v.stateLine.split(' · ').filter((s) => /^Owner:/.test(s))].join(' · ') : v.stateLine;
  const inbound = pursuit?.state.lastInbound ?? null;
  const tone = pursuit ? STATE_TONE[pursuit.state.state] ?? 'text-[var(--muted-foreground)]' : 'text-[var(--muted-foreground)]';
  // NEXT carries the one primary control; the chosen row in the stack shows no second one (UX-04).
  const primaryInNext = !!(nextHref && nextLabel);
  const buyerSaidSomething = v.gap.some((g) => g.state === 'Buyer said');
  const impactKnown = !/^Impact: unknown/.test(v.impact);
  const lastTouch =
    inbound && inbound.kind !== 'human' && /their reply, below\.$/.test(v.lastTouch)
      ? v.lastTouch.replace(/their reply, below\.$/, 'an automatic notice, below.')
      : inbound && /^No touch on record\.?$/.test(v.lastTouch)
        ? 'No GAP touch on record; the reply below answers an earlier email GAP did not send.'
        : v.lastTouch;

  return (
    <div className="min-[1100px]:grid min-[1100px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] min-[1100px]:items-start min-[1100px]:gap-x-10" data-testid="account-now">
      {/* DECISION: state, NEXT, the people, the route, the flags. */}
      <div className="space-y-4" data-testid="now-decision">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`min-w-0 break-words text-sm font-medium ${tone}`} data-testid="now-state" data-pursuit-state={pursuit?.state.state ?? undefined}>
              {stateLine}
            </p>
            <VoicePreviewButton text={v.listen} label="Listen" className="hidden min-h-11 shrink-0 px-4 md:inline-flex" />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]" data-testid="now-last-touch">
            {lastTouch}
          </p>
          {inbound ? (
            <p className={`text-xs font-medium ${inbound.kind === 'human' ? 'text-sky-800 dark:text-sky-300' : inbound.kind === 'opt_out' ? 'text-red-700 dark:text-red-400' : 'text-[var(--muted-foreground)]'}`} data-testid="now-last-inbound" data-reply-class={inbound.kind}>
              {inbound.label}: {inbound.who}, {day(inbound.at)}{pursuit?.state.replyClass && inbound.kind !== 'human' ? `. ${pursuit.state.replyClass.consequence}` : ''}
            </p>
          ) : v.lastReply ? (
            <p className="text-xs font-medium text-sky-800 dark:text-sky-300" data-testid="now-last-reply">
              {v.lastReply}
            </p>
          ) : null}
          {v.unit ? (
            <p className="text-xs text-amber-700 dark:text-amber-400" data-testid="now-unit">
              {v.unit}
            </p>
          ) : null}
        </div>

        <div className="rounded-md border border-[var(--primary)] px-3 py-2" data-testid="now-next">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Next</h2>
          <p className="text-sm font-medium">{nextText ?? v.next.text}</p>
          {pursuit?.state.blocker && pursuit.state.state !== 'research' && pursuit.state.state !== 'replied' && pursuit.state.state !== 'opted_out' ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400" data-testid="now-blocker">{pursuit.state.blocker}</p>
          ) : null}
          {nextHref && nextLabel ? (
            <PendingLink href={nextHref} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90" data-testid="now-next-control">
              {nextLabel}
            </PendingLink>
          ) : null}
        </div>

        {pursuit?.stack ? (
          <>
            <PeopleStackView accountName={v.name} stack={pursuit.stack} state={pursuit.state} hypothesisId={pursuit.hypothesisId} excluded={pursuit.excluded} primaryInNext={primaryInNext && pursuit.state.coldTouchAllowed} />
            {v.blocked?.length ? <BlockedPeople accountName={v.name} people={v.blocked} /> : null}
          </>
        ) : (
          <Slot label="Who" testId="now-who">
            {v.who ? (
              <div className="text-sm">
                <p className="font-medium">
                  {v.who.name}
                  {v.who.title ? <span className="font-normal text-[var(--muted-foreground)]">, {v.who.title}</span> : null}
                </p>
                {v.who.location ? <p className="text-xs text-[var(--muted-foreground)]" data-testid="now-who-location">{v.who.location}</p> : null}
                {v.who.inHubSpotOnly ? (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400" data-testid="now-who-hubspot-only">
                    In HubSpot, not yet a GAP contact: add them before any touch.
                  </p>
                ) : null}
                {v.who.inHubSpotOnly && v.addToGap && v.addToGap.hubspotContactId === v.who.hubspotContactId ? (
                  <AddToGapButton accountName={v.name} hubspotContactId={v.addToGap.hubspotContactId} name={v.addToGap.name} title={v.addToGap.title} />
                ) : null}
                <p className="text-xs text-[var(--muted-foreground)]">{v.who.why}</p>
                {v.who.role ? (
                  <p className="text-xs text-[var(--muted-foreground)]" data-testid="now-who-role">
                    Role: {v.who.role.label}. {v.who.role.why}
                  </p>
                ) : null}
                {v.who.personaId ? (
                  <EmploymentControl personaId={v.who.personaId} name={v.who.name} title={v.who.title} accountName={v.name} state={v.who.employment ? { label: v.who.employment.label, why: v.who.employment.why } : null} compact />
                ) : v.who.hubspotContactId ? (
                  <EmploymentControl hubspotContactId={v.who.hubspotContactId} name={v.who.name} title={v.who.title} accountName={v.name} compact />
                ) : null}
                {v.who.route ? <p className="text-xs text-[var(--muted-foreground)]">Route: {v.who.route}</p> : null}
                {v.whoUnknown ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-400" data-testid="now-owner-missing">{v.whoUnknown}</p> : null}
                {v.betterFit ? (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400" data-testid="now-better-fit">
                    {v.betterFit}
                  </p>
                ) : null}
                {v.betterFit && v.addToGap && !v.who.inHubSpotOnly ? (
                  <AddToGapButton accountName={v.name} hubspotContactId={v.addToGap.hubspotContactId} name={v.addToGap.name} title={v.addToGap.title} />
                ) : null}
                {v.alternate ? (
                  <p className="mt-1 text-xs" data-testid="now-alternate">
                    Alternate: {v.alternate.name}
                    {v.alternate.title ? `, ${v.alternate.title}` : ''}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-amber-700 dark:text-amber-400">{v.whoUnknown}</p>
                {v.alternate ? (
                  <p className="mt-1 text-xs" data-testid="now-alternate">
                    Sponsor / alternate: {v.alternate.name}
                    {v.alternate.title ? `, ${v.alternate.title}` : ''}
                  </p>
                ) : null}
              </div>
            )}
            {v.blocked?.length ? <BlockedPeople accountName={v.name} people={v.blocked} /> : null}
            {v.historical?.length ? (
              <ul className="mt-2 space-y-1 text-xs" data-testid="now-historical">
                {v.historical.map((h) => (
                  <li key={`${h.name}-${h.personaId ?? ''}`} className="rounded-md border border-dashed border-[var(--border)] px-2 py-1">
                    <span className="font-medium">{h.name}</span>
                    {h.title ? <span className="text-[var(--muted-foreground)]">, {h.title}</span> : null}
                    <span className="text-[var(--muted-foreground)]">. Historical {v.name} contact. Current-employer evidence now points to {h.elsewhere ?? 'another employer'}. Not eligible for {v.name} outreach.</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Slot>
        )}

        {v.outstandingDraft ? <OutstandingDraftPanel recipient={v.outstandingDraft.recipient} name={v.outstandingDraft.name} decisionId={v.outstandingDraft.decisionId} gmailDraftId={v.outstandingDraft.gmailDraftId} createdAt={v.outstandingDraft.createdAt} mailbox={mailbox} /> : null}

        {/* A way in sits with the decision, not at the bottom of the page (UX-04). */}
        {v.relationship ? (
          <Slot label="Relationship" testId="now-relationship">
            <p className="text-sm">{v.relationship}</p>
          </Slot>
        ) : null}
      </div>

      {/* CONTEXT: why now and what we know, after the decision. */}
      <div className="mt-6 space-y-4 min-[1100px]:mt-0" data-testid="now-context">
        {v.whyNow[0] ? (
          <Slot label="Why now" testId="now-why-now">
            <ul className="space-y-2">
              {v.whyNow.map((l) => (
                <Line key={l.id} l={l} testId="now-why-now-line" />
              ))}
            </ul>
          </Slot>
        ) : null}

        {buyerSaidSomething ? (
          <Slot label="The gap" testId="now-gap">
            <p className="text-sm">{v.currentState}</p>
            <p className="text-xs">
              {v.gap.map((g, i) => (
                <span key={g.element}>
                  {i ? ' · ' : ''}
                  {g.element}: <span className={GAP_TONE[g.state]}>{g.state}</span>
                </span>
              ))}
            </p>
          </Slot>
        ) : null}

        {v.know.length ? (
          <Slot label="Know" testId="now-know">
            <ul className="space-y-2">
              {v.know.map((l) => (
                <Line key={l.id} l={l} testId="now-know-line" />
              ))}
            </ul>
          </Slot>
        ) : null}

        {v.think ? (
          <Slot label="Think" testId="now-think">
            <div className="flex items-start gap-2">
              <Tag tag="Our read" />
              <p className="min-w-0 break-words text-sm">{v.think.text}</p>
            </div>
            {v.think.wrongIf ? <p className="ml-1 text-xs text-[var(--muted-foreground)]">Wrong if: {v.think.wrongIf}</p> : null}
          </Slot>
        ) : null}

        {impactKnown ? (
          <Slot label="Impact" testId="now-impact">
            <p className="text-sm">{v.impact}</p>
          </Slot>
        ) : null}

        {v.ask ? (
          <Slot label="Ask" testId="now-ask">
            <p className="text-sm">{v.ask}</p>
          </Slot>
        ) : null}

        {v.private ? (
          <p className="rounded-md border border-dashed border-amber-600 px-3 py-2 text-xs text-amber-800 dark:text-amber-300" data-testid="now-private">
            {v.private}
          </p>
        ) : null}

        {v.wedge ? (
          <Slot label="Wedge" testId="now-wedge">
            <p className="text-sm">{v.wedge}</p>
          </Slot>
        ) : null}

        {v.asset ? (
          <Slot label="Asset" testId="now-asset">
            {v.asset.href ? (
              <Link href={v.asset.href} className="inline-flex min-h-6 items-center text-sm underline">
                {v.asset.label}
              </Link>
            ) : (
              <p className="text-sm">{v.asset.label}</p>
            )}
          </Slot>
        ) : null}

        {links.length ? (
          <nav aria-label="Account tools" className="flex flex-wrap gap-x-2 border-t border-[var(--border)] pt-2 text-sm" data-testid="now-links">
            {links.map((l) =>
              l.external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center px-1 underline">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center px-1 underline">
                  {l.label}
                </Link>
              ),
            )}
            <NoteControl />
          </nav>
        ) : null}
      </div>

      {/* 390: one opaque bottom bar with Listen and Log a touch (44 px each); scroll-padding-bottom keeps focus clear of it. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--background)] px-4 py-2 md:hidden" data-testid="now-bottom-bar" role="toolbar" aria-label="Account actions">
        <VoicePreviewButton text={v.listen} label="Listen" className="min-h-11 px-4" />
        <Link href={`/gap/capture?account=${encodeURIComponent(v.name)}`} className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] px-4 text-sm font-medium" data-testid="now-bottom-log">
          Log a touch
        </Link>
      </div>
    </div>
  );
}
