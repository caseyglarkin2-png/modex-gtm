/**
 * MEETING PREPARATION (GAP OS execution recovery, R51): objective, who is coming and their roles, the last commitment,
 * the buyer's confirmed needs, the open questions, the guess to test, public context and our materials. Every line
 * carries its trust word ("Buyer confirmed", "Recorded", "HubSpot", "To learn", "Our guess", "Public source", "Ours",
 * "Suggested"), so nothing speculative reads as a finding and public news never stands in for the buyer's words.
 * A canceled meeting shows only that it was canceled. Presentational.
 */
import type { MeetingPrep, PrepLine } from '@/lib/gap/deals/meeting-prep';

function Line({ l }: { l: PrepLine }) {
  return (
    <li className="text-sm" data-testid="prep-line" data-trust={l.trust}>
      <span className="mr-1 rounded bg-[var(--muted)] px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]" data-testid="prep-trust">
        {l.trust}
      </span>{' '}
      {/* R63-B N5: a space after the trust word, so a screen reader says "To learn: Learn ...", never "To learnLearn". */}
      {l.href ? (
        <a href={l.href} className="underline" target={/^https?:/.test(l.href) ? '_blank' : undefined} rel="noreferrer">
          {l.text}
        </a>
      ) : (
        l.text
      )}
      {l.source ? <span className="block text-xs text-[var(--muted-foreground)]">{l.source}</span> : null}
    </li>
  );
}

function Part({ title, lines, empty, testid }: { title: string; lines: PrepLine[]; empty: string; testid: string }) {
  return (
    <div data-testid={testid}>
      <h5 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</h5>
      {lines.length ? <ul className="space-y-1">{lines.map((l, n) => <Line key={n} l={l} />)}</ul> : <p className="text-xs text-[var(--muted-foreground)]">{empty}</p>}
    </div>
  );
}

export function MeetingPrepView({ prep }: { prep: MeetingPrep }) {
  return (
    <section id={`meeting-${prep.meetingId}`} className="scroll-mt-16 space-y-2 rounded-md border border-[var(--border)] p-3" data-testid="meeting-prep" data-state={prep.state} data-meeting-id={prep.meetingId} aria-label="Meeting preparation">
      <h4 className="text-sm font-semibold" data-testid="meeting-prep-headline">{prep.headline}</h4>
      {prep.state === 'canceled' ? null : (
        <>
          <Part title="Objective" lines={[prep.objective]} empty="" testid="prep-objective" />
          <Part title="Who is coming" lines={prep.attendees} empty="Nobody is named on the meeting and nobody GAP holds is on the deal." testid="prep-attendees" />
          <Part title="The last commitment" lines={prep.lastCommitment ? [prep.lastCommitment] : []} empty="No commitment on record yet." testid="prep-last-commitment" />
          <Part title="What they confirmed" lines={prep.confirmedNeeds} empty="Nothing confirmed from the buyer yet: this meeting is discovery." testid="prep-needs" />
          <Part title="What to learn" lines={prep.openQuestions} empty="" testid="prep-questions" />
          {prep.toTest.length ? <Part title="Our guess, to test (never a finding)" lines={prep.toTest} empty="" testid="prep-to-test" /> : null}
          {prep.publicContext.length ? <Part title="Public context (not the buyer's words)" lines={prep.publicContext} empty="" testid="prep-public" /> : null}
          {prep.materials.length ? <Part title="Materials" lines={prep.materials} empty="" testid="prep-materials" /> : null}
        </>
      )}
    </section>
  );
}
