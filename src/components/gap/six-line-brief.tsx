/**
 * The six-line brief at the top of every action pack (Phase 2 E1):
 * KNOW / THINK / LEARN / WHY YOU / HISTORY / WRONG IF. Stacked rows at phone
 * width (no horizontal scroll), a label column from sm up. WHY YOU is edited
 * in place (the human-owned PersonaAngle). Voice: no em dashes.
 */
import type { SixLineBrief } from '@/lib/gap/execution/six-line-brief';
import { AngleLine } from './account-motion-panel';

const STATE_CLASS: Record<SixLineBrief['historyState'], string> = {
  clear: '',
  caution: 'text-amber-700 dark:text-amber-400',
  blocked: 'text-[var(--destructive)]',
};

function Row({ label, testId, children }: { label: string; testId: string; children: React.ReactNode }) {
  return (
    <div data-testid={testId} className="grid grid-cols-1 gap-0.5 border-t border-[var(--border)] py-2 first:border-t-0 sm:grid-cols-[6rem_1fr] sm:gap-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function SixLineBriefView({ brief, personaId, accountName }: { brief: SixLineBrief; personaId: number | null; accountName: string }) {
  const k = brief.know;
  return (
    <section data-testid="six-line-brief" aria-label={`Brief for ${accountName}`} className="rounded-md border-2 border-[var(--primary)] p-3 text-sm">
      <dl>
        <Row label="Know" testId="brief-know">
          {k.fact ? (
            <>
              <p>
                {k.fact.title}
                {k.fact.publishedAt ? ` (${new Date(k.fact.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })})` : ''}{' '}
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">✓ verified</span>
                {k.supporting > 0 ? <span className="text-xs text-[var(--muted-foreground)]"> + {k.supporting} supporting</span> : null}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">&ldquo;{k.fact.quote}&rdquo;</p>
            </>
          ) : (
            <p className="text-[var(--destructive)]">{k.reason}</p>
          )}
        </Row>
        <Row label="Proof" testId="brief-proof">
          <p>
            <span className="mr-2 inline-block rounded border border-[var(--primary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">{brief.proof.tag}</span>
            {brief.proof.text}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">YardFlow&apos;s own number, never theirs.</p>
        </Row>
        <Row label="Think" testId="brief-think">
          {brief.think ? (
            <p>
              <span className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">What we think is happening (our read): </span>
              {brief.think}
            </p>
          ) : (
            <p className="italic text-[var(--muted-foreground)]">No hypothesis written.</p>
          )}
        </Row>
        <Row label="Learn" testId="brief-learn">
          {brief.learn ?? <span className="italic text-[var(--muted-foreground)]">No discovery question written.</span>}
        </Row>
        <Row label="Why you" testId="brief-why-you">
          {personaId ? (
            <AngleLine a={{ personaId, angle: brief.whyYou?.owned ? { personaId, text: brief.whyYou.text, source: 'human', by: '', at: '' } : null, suggested: brief.whyYou && !brief.whyYou.owned ? brief.whyYou.text : null }} personaId={personaId} bare />
          ) : (
            <span className="italic text-[var(--muted-foreground)]">No person on this card.</span>
          )}
        </Row>
        <Row label="History" testId="brief-history">
          <ul className={`space-y-0.5 ${STATE_CLASS[brief.historyState]}`}>
            {brief.history.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Row>
        {brief.account ? (
          <Row label="Account" testId="brief-account">
            <p>{brief.account.motion}</p>
            {brief.account.caution ? <p className="font-medium text-amber-700 dark:text-amber-400">{brief.account.caution}</p> : null}
            <a href={brief.account.href} className="text-xs underline">
              Everything GAP knows about this account
            </a>
          </Row>
        ) : null}
        {brief.context?.length ? (
          <Row label="Context" testId="brief-context">
            <ul className="space-y-0.5">
              {brief.context.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="text-xs text-[var(--muted-foreground)]">Yours, not evidence. Mention it only if it would feel natural.</p>
          </Row>
        ) : null}
        <Row label="Wrong if" testId="brief-wrong-if">
          {brief.wrongIf ?? <span className="italic text-[var(--muted-foreground)]">No falsification condition written.</span>}
        </Row>
      </dl>
    </section>
  );
}
