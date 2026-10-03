/**
 * BRIEF (V2, 2026-10-02): the one-page meeting brief. Each section shows 3-5 seller lines (tag + basis) and how many
 * more SOURCES holds. Projected from the same brief and context as NOW; nothing new is decided here.
 */
import type { AccountInputs, AccountIntelligenceBrief, SectionKey } from '../account-intel/build';
import { sensitivityOf } from '../research/sensitivity';
import { displayName, sellerLine, type NowLine } from './now';
import type { AccountContext } from './context';

export interface BriefSection {
  key: string;
  title: string;
  lines: Array<Pick<NowLine, 'text' | 'tag' | 'basis' | 'cite'>>;
  /** Plain lines (people, relationship, history, assets): no truth tag. */
  notes: string[];
  unknowns: string[];
  /** Statements beyond what is shown (in SOURCES). */
  more: number;
  /** The SOURCES anchor for "View details", when the section has one there. */
  detailsAnchor: string | null;
}

const SHOW = 5;

export function projectBrief(brief: AccountIntelligenceBrief, ctx: AccountContext, i: Pick<AccountInputs, 'facts' | 'domains' | 'account'> & { bids?: AccountInputs['bids'] }, now: Date): BriefSection[] {
  const live = i.facts.filter((f) => !f.expiresAt || new Date(f.expiresAt).getTime() > now.getTime());
  const lx = { domains: i.domains, accountName: i.account.name, citable: new Set(live.filter((f) => !sensitivityOf(f.quote)).flatMap((f) => [f.id, ...(f.sameQuoteIds ?? [])])) };
  const intel = (key: string, title: string, keys: SectionKey[]): BriefSection => {
    const st = keys.flatMap((k) => brief.sections[k].statements.map((s) => ({ s, k })));
    // One readable line each: no raw URLs, no "fact:" fragments, at most ~240 characters (the rest is in SOURCES).
    const clean = (t: string) => {
      const c = t.replace(/\s*https?:\/\/\S+/g, '').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim();
      return c.length > 240 ? `${c.slice(0, 239).trimEnd()}…` : c;
    };
    const lines = st.map(({ s, k }) => sellerLine(s, k, lx)).filter((l): l is NowLine => !!l).map(({ text, tag, basis, cite }) => ({ text: clean(text), tag, basis, cite }));
    return { key, title, lines: lines.slice(0, SHOW), notes: [], unknowns: keys.flatMap((k) => brief.sections[k].unknowns).slice(0, 4), more: Math.max(0, lines.length - SHOW), detailsAnchor: `brief-section-${keys[0]}` };
  };
  const plain = (key: string, title: string, notes: string[], unknowns: string[] = []): BriefSection => ({ key, title, lines: [], notes: notes.slice(0, SHOW), unknowns, more: Math.max(0, notes.length - SHOW), detailsAnchor: null });

  const p = brief.people;
  const people = p?.lanes.length
    ? p.lanes.map((l) => `${l.label}: ${l.people.slice(0, 3).map((x) => `${displayName(x.name)}${x.title ? ` (${x.title})` : ''}${x.doNotContact ? ' [do not contact]' : ''}${x.region === 'US_NA' ? ' [US / NA]' : ''}`).join('; ')}${l.people.length > 3 ? ` and ${l.people.length - 3} more` : ''}`)
    : [];
  const rel = ctx.relationship;
  const relationship = [
    rel.restriction ? `Warm intro only: through ${rel.restriction.introducer} to ${rel.restriction.route}. No cold outreach.` : null,
    rel.introPath ? `Intro path on record: ${rel.introPath}` : null,
    ...rel.routes.map((r) => `Route to ${r.person}: ${r.route}`),
    ...rel.sources.filter((s) => s.context || s.person).map((s) => `${s.person ? `${s.person}: ` : ''}${s.context ?? s.type} (${s.source})`),
    rel.meetings.upcoming ? `Upcoming meeting: ${rel.meetings.upcoming.at.slice(0, 10)}, ${rel.meetings.upcoming.what}` : null,
    rel.meetings.last ? `Last meeting: ${rel.meetings.last.at.slice(0, 10)} (${rel.meetings.last.status})` : null,
    rel.lastThread ? `Last email: ${rel.lastThread.at.slice(0, 10)} to ${rel.lastThread.to}${rel.lastThread.replied ? ' (they have replied on the account)' : ''}` : null,
    rel.owner ? `Account owner: ${rel.owner}` : null,
  ].filter((x): x is string => !!x);
  const e = ctx.engagement;
  const engagement = e.sessions
    ? [`${e.material ? e.line : `Private: interest signal, never mention to the buyer. ${e.sessions} human session${e.sessions === 1 ? '' : 's'}; nothing material in the last 180 days.`}`, `Pages: ${e.pages.join(', ')}; first ${e.firstAt?.slice(0, 10) ?? 'unknown'}, last ${e.lastAt?.slice(0, 10) ?? 'unknown'}.`]
    : [];
  const commercial = [
    ...brief.sections.commercial.statements.map((s) => s.text),
    ...ctx.history.map((h) => `${h.at.slice(0, 10)} ${h.text}`),
    ...(ctx.legacyNote ? [`Legacy note (MODEX-era record, ${ctx.legacyNote.at?.slice(0, 10) ?? 'undated'}; never the next step): ${ctx.legacyNote.text}`] : []),
  ];
  const assets = ctx.assets.map((a) => `${a.label}${a.at ? `, ${a.at.slice(0, 10)}` : ''}${a.lastSentAt ? `, last sent ${a.lastSentAt.slice(0, 10)}` : a.legacy ? '' : ', never sent'}`);
  const read = [
    ...brief.hypotheses.slice(0, 2).map((h) => `Our read: ${h.problem}${h.wrongIf ? ` Wrong if: ${h.wrongIf}` : ''}`),
    ...brief.discovery.slice(0, 4).map((q) => `Ask (${q.type.replace(/_/g, ' ').toLowerCase()}): ${q.question}`),
  ];
  // The pitch conclusion only after the buyer confirmed a problem or a cost (the same rule as NOW's WEDGE).
  const confirmed = i.bids?.some((b) => b.type === 'business_problem' || b.type === 'impact');
  const wedgeLine = confirmed && brief.wedge.archetype ? `Where YardFlow may fit: ${brief.thesis.whereYardFlowMayFit}` : null;

  return [
    intel('network', 'Network', ['identity', 'footprint']),
    intel('freight', 'Freight', ['freight']),
    intel('yard', 'Yard', ['yard', 'volume']),
    intel('tech', 'Tech', ['technology']),
    intel('economics', 'Economics', ['economics']),
    plain('people', 'Buyer map', people, p?.primary?.lane === 'PRIMARY_OPERATOR' ? [] : ['A US / North America transportation operations owner']),
    intel('signals', 'Change and signals', ['catalysts']),
    plain('relationship', 'Relationship', relationship),
    plain('commercial', 'Commercial history', commercial),
    plain('private', 'Private engagement', engagement),
    plain('assets', 'Existing assets', assets),
    plain('read', 'Our read and what to ask', [...read, ...(wedgeLine ? [wedgeLine] : [])]),
  ].filter((s) => s.lines.length || s.notes.length || s.unknowns.length);
}
