/**
 * DEAL BRIEF v0 view (Phase 2 F2/F3): read-only, one column on a phone.
 * Every truth section shows the buyer's own words, who said them and who
 * confirmed them, or UNKNOWN. The next learning objective is Casey's; a
 * machine suggestion is labelled "Suggested (not yours yet)".
 */
import type { DealBrief } from '@/lib/gap/deals/deal-brief';
import { SECTION_TITLE, TRUTH_SECTIONS } from '@/lib/gap/deals/sections';
import { DealObjectiveForm } from './deal-objective-form';

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : null);

function Row({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div data-testid={`deal-brief-${id}`} className="grid grid-cols-1 gap-1 border-b border-[var(--border)] py-2 last:border-b-0 sm:grid-cols-[11rem_1fr] sm:gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <div className="min-w-0 break-words text-sm">{children}</div>
    </div>
  );
}

const Unknown = () => <p className="font-semibold text-amber-700 dark:text-amber-400">UNKNOWN</p>;

export function DealBriefView({ brief, deals, editable = false }: { brief: DealBrief; deals: Array<{ name: string | null; stage: string; lastActivityAt: string | null }>; editable?: boolean }) {
  return (
    <section data-testid="deal-brief" className="space-y-2 rounded-md border border-[var(--border)] p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Deal brief: {brief.deal?.name ?? brief.accountName}</h3>
        <p data-testid="deal-brief-known" className="text-xs text-[var(--muted-foreground)]">
          {brief.known} of {TRUTH_SECTIONS.length} known · confirmed buyer truth only · read-only
        </p>
      </div>
      <ul className="space-y-0.5 text-xs text-[var(--muted-foreground)]">
        {deals.map((d, i) => (
          <li key={`${d.name}-${i}`}>
            Open deal {d.name ? `"${d.name}"` : '(unnamed)'} · {d.stage}
            {d.lastActivityAt ? ` · last activity ${day(d.lastActivityAt)}` : ''}
          </li>
        ))}
      </ul>

      <div>
        {TRUTH_SECTIONS.map((s) => (
          <Row key={s} id={s} label={SECTION_TITLE[s]}>
            {brief.sections[s].length === 0 ? (
              <Unknown />
            ) : (
              <ul className="space-y-1">
                {brief.sections[s].map((e) => (
                  <li key={e.bidId}>
                    {/* R63-A S5: their own words quoted; what the seller noted, never in quotation marks. */}
                    {e.noted ? <span data-testid="deal-brief-noted">You noted they said: {e.quote}</span> : <q className="italic">{e.quote}</q>}
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      {e.scope ? <span className="font-semibold" data-testid="deal-brief-scope">{e.scope} · </span> : null}
                      {e.who} · {e.source}
                      {e.confirmedBy ? ` · confirmed by ${e.confirmedBy}` : ''}
                      {e.at ? ` · ${day(e.at)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Row>
        ))}
        <Row id="stakeholders" label="Stakeholders">
          {brief.stakeholders.length === 0 && brief.dealContacts === 0 ? (
            <Unknown />
          ) : (
            <ul className="space-y-0.5">
              {brief.stakeholders.map((p) => (
                <li key={p.email}>
                  {p.who}
                  {p.title ? <span className="text-[var(--muted-foreground)]">, {p.title}</span> : null}
                </li>
              ))}
              {brief.dealContacts ? (
                <li className="text-xs text-[var(--muted-foreground)]">
                  {brief.dealContacts} contact{brief.dealContacts === 1 ? '' : 's'} on the HubSpot deal
                </li>
              ) : null}
            </ul>
          )}
        </Row>
        <Row id="commitments" label="Buyer commitments">
          {brief.commitments.length === 0 ? (
            <p className="text-[var(--muted-foreground)]">None recorded.</p>
          ) : (
            <ul className="space-y-0.5">
              {brief.commitments.map((c, i) => (
                <li key={i}>
                  {c.who}: {c.what} ({day(c.at)}){c.next ? `. Next: ${c.next}` : ''}
                </li>
              ))}
            </ul>
          )}
        </Row>
        <Row id="contradictions" label="Contradictions">
          {brief.contradictions.length === 0 ? (
            <p className="text-[var(--muted-foreground)]">None recorded.</p>
          ) : (
            <ul className="list-disc space-y-0.5 pl-4">
              {brief.contradictions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </Row>
        <Row id="unknowns" label="Unknowns">
          {brief.unknowns.length === 0 ? 'None.' : brief.unknowns.map((u) => SECTION_TITLE[u]).join(', ')}
        </Row>
        <Row id="objective" label="Next learning objective">
          {brief.objective.owned ? (
            <p>
              {brief.objective.text}
              <span className="block text-xs text-[var(--muted-foreground)]">
                {brief.objective.from === 'meeting' ? 'From your meeting notes' : 'Set by you'} · {brief.objective.by} · {day(brief.objective.at)}
              </span>
            </p>
          ) : (
            <p>
              <span className="font-semibold">Suggested (not yours yet):</span> {brief.objective.text}
            </p>
          )}
          {editable ? <DealObjectiveForm accountName={brief.accountName} initial={brief.objective.owned ? brief.objective.text : ''} /> : null}
        </Row>
      </div>
    </section>
  );
}
