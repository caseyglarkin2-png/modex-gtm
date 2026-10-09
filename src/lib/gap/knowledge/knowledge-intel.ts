/**
 * THE VAULT AS INTELLIGENCE (intelligence wiring, IW06, 2026-10-09). Server only; reads the knowledge table.
 *
 * The knowledge program put the vault's calls and meetings on the account story and into the people state (a
 * conversation counts for quiet). Those readers run only when a person or an account is already in play. This
 * reader projects the vault's recent conversations into the intelligence digest ON THEIR OWN: a held Fireflies call
 * or a calendar meeting within the window becomes an item with the call's summary and action items as the passage
 * (never the transcript; the vault's own rule says the verbatim is the ground truth and the summary advisory), the
 * participants as hints, the note path as the source, and NO decision buttons (the vault is not a prospecting
 * signal; the account page holds the moves). No wedge is generated here; nothing is interpreted.
 */
import { parseFirefliesCapture } from './fireflies-summary';
import { HISTORICAL_DAYS, type IntelItem } from '../work/intel';
import { TRUTH_TEXT } from '../work/truth-text';
import { dateOnlyText } from '../signals/intelligence-record';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const KNOWLEDGE_INTEL_WINDOW_DAYS = 45;
export const KNOWLEDGE_INTEL_LIMIT = 12;
const INTERNAL = /@(freightroll\.com|yardflow\.ai)$/i;

type NoteRow = { id: string; path: string; kind: string; title: string; note_date: Date | string | null; source: string | null; people: string[]; account_name: string | null; text: string; synced_at: Date | string; git_sha: string | null };

const dayOf = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

/** Pure: one note row to one intelligence item (null when the note has no date or nothing to say). */
export function knowledgeItemOf(n: NoteRow, now: Date): IntelItem | null {
  if (!n.note_date) return null;
  const at = new Date(n.note_date);
  if (Number.isNaN(at.getTime()) || at.getTime() > now.getTime()) return null;
  const isCall = n.kind === 'raw' && n.source === 'fireflies';
  const isMeeting = n.kind === 'meeting';
  if (!isCall && !isMeeting) return null;
  const buyers = (n.people ?? []).filter((p) => p.includes('@') && !INTERNAL.test(p));
  // A conversation with nobody from the account on it (an internal war room, a note with no participants) is not
  // intelligence about the account; it stays on the vault.
  if (!buyers.length) return null;
  const who = buyers.slice(0, 3).join(', ');
  let text = '';
  let uncertainty: string | null = null;
  if (isCall) {
    const f = parseFirefliesCapture(n.text ?? '');
    const parts = [...f.summary.slice(0, 3), ...f.actions.slice(0, 2).map((a) => `Action item${a.who ? ` (${a.who})` : ''}: ${a.text}`)];
    text = parts.join(' ').trim();
    if (!text) return null;
    uncertainty = 'The Fireflies summary is advisory and has been seen to hallucinate; the verbatim transcript on the note is the ground truth.';
  } else {
    text = `${n.title} (on the calendar; the vault's prep note).`;
  }
  const day = dayOf(at);
  const truth = now.getTime() - at.getTime() > HISTORICAL_DAYS * 86_400_000 ? 'historical_observation' : 'unverified_status';
  return {
    kind: 'knowledge', id: n.id, key: `knowledge:${n.id}`, title: n.title, source: 'the vault', url: null, publishedAt: at.toISOString(), observedAt: new Date(n.synced_at).toISOString(), truth,
    line: `${isCall ? 'A Fireflies call' : 'A meeting'} ${dateOnlyText(day)} with ${who}, on the vault. ${TRUTH_TEXT[truth]}.${isCall ? ' The summary is advisory; the verbatim is on the note.' : ''}`,
    accountName: n.account_name, accountHint: null, relevance: null, categories: [], person: null, decisions: [], rank: 0,
    substance: {
      producer: 'vault', producerLabel: 'the vault', producerRunId: n.git_sha ?? 'local push', producerItemId: n.path, recordKind: 'observation',
      text, sources: [{ url: null, publisher: 'the vault', label: n.path }], sourceRecordIds: [], eventDate: day, reportedOn: day, reportedOnBasis: 'stated', importedAt: new Date(n.synced_at).toISOString(),
      producerStatus: isCall ? 'call' : 'meeting', uncertainty, interpretation: null, personHints: buyers, suggestions: 0, revisions: 0,
    },
  };
}

/** The vault's held calls and meetings within the window, newest first, as intelligence items; empty without the table. */
export async function loadKnowledgeIntel(prisma: PrismaLike, opts: { now: Date; limit?: number; windowDays?: number }): Promise<{ items: IntelItem[]; total: number }> {
  if (!prisma?.gapKnowledgeNote || typeof prisma.gapKnowledgeNote.findMany !== 'function') return { items: [], total: 0 };
  const since = new Date(opts.now.getTime() - (opts.windowDays ?? KNOWLEDGE_INTEL_WINDOW_DAYS) * 86_400_000);
  const where = { note_date: { gte: since, lte: opts.now }, OR: [{ kind: 'raw', source: 'fireflies' }, { kind: 'meeting' }] };
  const rows: NoteRow[] = await prisma.gapKnowledgeNote.findMany({ where, orderBy: [{ note_date: 'desc' }, { id: 'desc' }], take: 60, select: { id: true, path: true, kind: true, title: true, note_date: true, source: true, people: true, account_name: true, text: true, synced_at: true, git_sha: true } }).catch(() => []);
  const items = rows.map((r) => knowledgeItemOf(r, opts.now)).filter((x): x is IntelItem => !!x).map((x, i) => ({ ...x, rank: i }));
  const total: number = typeof prisma.gapKnowledgeNote.count === 'function' ? await prisma.gapKnowledgeNote.count({ where }).catch(() => items.length) : items.length;
  return { items: items.slice(0, opts.limit ?? KNOWLEDGE_INTEL_LIMIT), total: Math.max(total, items.length) };
}
