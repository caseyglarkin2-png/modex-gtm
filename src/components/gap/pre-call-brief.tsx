/**
 * Pre-call brief (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * What the seller reads before dialling, from `GET /api/gap/call/[personaId]`:
 * the persona and account, the FACT block (observation with cited signals)
 * and the HYPOTHESIS block REUSED from fact-hypothesis-blocks.tsx, the
 * would-prove-wrong list, the last dispositions, the open BIDs and the
 * suggested questions. Pure presentational; reads only the brief contract.
 *
 * Voice: no em dashes, "yards" plural.
 */

import { Badge } from '@/components/ui/badge';
import type { CallBrief } from '@/lib/gap/ui/gap-api-client';
import { FactBlock, HypothesisBlock } from './fact-hypothesis-blocks';
import { HypothesisStatusBadge } from './hypothesis-drawer';
import { formatWhen } from '@/lib/gap/ui/format';

export const BRIEF_LABELS = {
  wouldProveWrong: 'Would prove wrong',
  lastDispositions: 'Last dispositions',
  openBids: 'Open BIDs',
  suggestedQuestions: 'Suggested questions',
} as const;

function words(value: string): string {
  return value.replace(/_/g, ' ');
}

function Heading({ children }: { children: string }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{children}</h3>;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0) : [];
}

export interface PreCallBriefProps {
  brief: CallBrief;
}

export function PreCallBrief({ brief }: PreCallBriefProps) {
  const { persona, account, hypothesis } = brief;
  const personaName = persona?.name?.trim() || persona?.email?.trim() || `persona ${String(persona?.id ?? '')}`;
  const questions = strings(brief.suggestedQuestions);
  const proveWrong = strings(hypothesis?.wouldProveWrong);
  const dispositions = Array.isArray(brief.lastDispositions) ? brief.lastDispositions : [];
  const bids = Array.isArray(brief.openBids) ? brief.openBids : [];

  return (
    <section data-testid="pre-call-brief" className="space-y-4 text-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p data-testid="brief-persona" className="text-lg font-semibold">
            {personaName}
            {persona?.title ? <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">{persona.title}</span> : null}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {persona?.email ?? 'no email'}
            {persona?.phone ? <span className="ml-2">{persona.phone}</span> : null}
            {persona?.personaKey ? <span className="ml-2">{words(persona.personaKey)}</span> : null}
            {persona?.role ? <span className="ml-2">{words(persona.role)}</span> : null}
            {persona?.doNotContact ? (
              <Badge data-testid="brief-do-not-contact" variant="destructive" className="ml-2">
                do not contact
              </Badge>
            ) : null}
          </p>
          <p data-testid="brief-account" className="mt-1">
            {account?.name}
            {account?.tier ? <span className="ml-2 text-xs text-[var(--muted-foreground)]">tier {account.tier}</span> : null}
            {account?.vertical ? <span className="ml-2 text-xs text-[var(--muted-foreground)]">{words(account.vertical)}</span> : null}
          </p>
        </div>
        {hypothesis ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{words(hypothesis.problemFamily)}</Badge>
            <HypothesisStatusBadge status={hypothesis.status} />
          </div>
        ) : null}
      </header>

      {hypothesis ? (
        <>
          <FactBlock observation={hypothesis.observation ?? ''} signals={Array.isArray(hypothesis.signals) ? hypothesis.signals : []} />
          <HypothesisBlock
            problemHypothesis={hypothesis.problemHypothesis ?? ''}
            rootCauseHypotheses={strings(hypothesis.rootCauseHypotheses)}
            impactHypotheses={strings(hypothesis.impactHypotheses)}
            whyNow={hypothesis.whyNow}
            falsificationQuestions={strings(hypothesis.falsificationQuestions)}
            whatANoMeans={hypothesis.whatANoMeans}
            confidence={typeof hypothesis.confidence === 'number' ? hypothesis.confidence : 0}
          />
        </>
      ) : (
        <p data-testid="brief-no-hypothesis" className="italic text-[var(--muted-foreground)]">
          No active hypothesis for this persona. Record what you learn; a hypothesis can be drafted from it.
        </p>
      )}

      <div data-testid="brief-prove-wrong" className="rounded-md border border-[var(--border)] p-3">
        <Heading>{BRIEF_LABELS.wouldProveWrong}</Heading>
        {proveWrong.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {proveWrong.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 italic text-[var(--muted-foreground)]">Nothing named yet</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div data-testid="brief-dispositions" className="rounded-md border border-[var(--border)] p-3">
          <Heading>{BRIEF_LABELS.lastDispositions}</Heading>
          {dispositions.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {dispositions.map((row) => (
                <li key={row.id} className="flex flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{words(String(row.responseClass))}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {String(row.channel)} {formatWhen(row.createdAt, true)}
                    </span>
                    {row.humanConfirmed ? null : <Badge variant="warning">unconfirmed</Badge>}
                  </span>
                  {row.buyerLanguage ? <q className="text-[var(--muted-foreground)]">{row.buyerLanguage}</q> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 italic text-[var(--muted-foreground)]">No prior disposition</p>
          )}
        </div>

        <div data-testid="brief-bids" className="rounded-md border border-[var(--border)] p-3">
          <Heading>{BRIEF_LABELS.openBids}</Heading>
          {bids.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {bids.map((bid) => (
                <li key={bid.id} className="flex flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{words(String(bid.type))}</Badge>
                    {bid.humanConfirmed ? null : <Badge variant="warning">unconfirmed</Badge>}
                  </span>
                  <q>{bid.rawBuyerLanguage}</q>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 italic text-[var(--muted-foreground)]">No buyer input yet</p>
          )}
        </div>
      </div>

      <div data-testid="brief-questions" className="rounded-md border border-[var(--border)] p-3">
        <Heading>{BRIEF_LABELS.suggestedQuestions}</Heading>
        {questions.length > 0 ? (
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 italic text-[var(--muted-foreground)]">No questions suggested</p>
        )}
      </div>
    </section>
  );
}
