/**
 * LISTEN TO ACCOUNT (account-first UX, UX-11, contract 5.8): a 60 to 90 second brief written for the ear, 150 to
 * 220 words: the state and the last touch; the goal and what changed, saying checked or our read; where the yard
 * fits and the proof, saying measured; the first person and why, whether the role is verified, the second person
 * if no reply, how many are flagged do not contact; the opening and why that person cares; the unknown; the next
 * action. Never the private line, DO NOT USE facts, emails, phone numbers, URLs or machine words. Pure over the
 * projections the page already renders; pinned by tests/unit/gap/voice-listen.test.ts.
 */
import type { PursuitState } from '../pursuit/state';
import type { AccountStory, StorySentence } from '../story/story';
import type { OutreachAnchor } from '../story/anchor';
import type { PeopleStack } from '../people/stack';
import { forTheEar, spokenPerson, spokenSentence, wordCount } from './for-the-ear';

export const ACCOUNT_LISTEN_WORDS = { min: 150, max: 220 } as const;

export interface AccountListenInput {
  accountName: string;
  state: PursuitState;
  story: AccountStory | null;
  anchor: OutreachAnchor | null;
  stack: PeopleStack | null;
  /** NEXT as the page says it. */
  nextText: string;
  /** People set aside as do not contact (the resolver's count), said as a count only. */
  doNotContactCount?: number;
}

/**
 * A fact row speaks only what may be cited to the buyer: a line marked not for outreach, from imagery, unverified or
 * contradicted, or one the anchor lists under DO NOT USE, is never spoken (the review found Maryland's layoffs about
 * to be spoken as "checked"). Rows that are our read, the buyer's words or an unknown carry no cite and speak as is.
 */
const FACT_ROWS = new Set(['changing', 'network', 'stories', 'between_us']);
function speakable(s: StorySentence, key: string, doNotUse: ReadonlySet<string>): boolean {
  if (doNotUse.has(s.text.trim().toLowerCase())) return false;
  if (s.tag === 'Unverified' || s.tag === 'Contradicted') return false;
  if (!FACT_ROWS.has(key) || s.tag !== 'Checked') return true;
  return s.cite === undefined || s.cite === 'OK to cite to the buyer' || /^The (opening story|supporting fact), above\.$/.test(s.text);
}
const row = (story: AccountStory | null, key: string, doNotUse: ReadonlySet<string> = new Set()): StorySentence[] => (story?.rows.find((r) => r.key === key)?.sentences ?? []).filter((s) => speakable(s, key, doNotUse));
const firstSpoken = (s: StorySentence[] | undefined, n = 1): string => (s ?? []).slice(0, n).map((x) => spokenSentence(x.text, x.tag)).filter(Boolean).join(' ');

export function accountListenText(i: AccountListenInput): string {
  const dnu = new Set((i.anchor?.doNotUse ?? []).map((d) => d.text.trim().toLowerCase()));
  const parts: Array<{ key: string; text: string }> = [];
  const say = (key: string, text: string) => text && parts.push({ key, text });
  // 1. State and the last touch.
  say('state', `${i.accountName}. ${forTheEar(i.state.stateLine).replace(/[.!?]+$/, '')}.`);
  const between = row(i.story, 'between_us', dnu);
  if (between.length) say('between', firstSpoken(between, 1));
  else if (i.state.lastOutbound) say('between', `Last touch: ${forTheEar(i.state.lastOutbound.what).replace(/[.!?]+$/, '')}.`);
  // 2. The goal and what is changing.
  const goal = row(i.story, 'goal', dnu);
  if (goal.length) say('goal', `Their goal: ${firstSpoken(goal, 1)}`);
  const changing = row(i.story, 'changing', dnu).filter((s) => !/^The (opening story|supporting fact), above\.$/.test(s.text));
  if (changing.length) say('changing', `What is changing: ${firstSpoken(changing, 1)}`);
  // 3. Where the yard fits, and our proof (measured, ours).
  const yard = row(i.story, 'yard', dnu);
  if (yard.length) say('yard', `Where the yard fits: ${firstSpoken(yard, 1)}`);
  if (i.anchor?.bestProof) say('proof', `Our proof, ${i.anchor.bestProof.tag === 'Our model' ? 'modeled' : 'measured'}: ${forTheEar(i.anchor.bestProof.text).replace(/[.!?]+$/, '')}.`);
  // 4. The people: the first, why, the role; the second if no reply; the flagged count.
  const rows = i.stack?.rows ?? [];
  const first = rows.find((r) => r.chosen) ?? rows[0] ?? null;
  const speakWho = i.state.coldTouchAllowed || i.state.state === 'in_motion' || i.state.state === 'follow_up_due' || i.state.state === 'choose_person';
  if (first && speakWho) {
    // Only a confirmed role is spoken as verified (a likely role is not a verification).
    const verified = first.currentness && /Role confirmed/i.test(first.currentness) ? ' Their role is verified.' : '';
    if (i.stack?.tie && !first.chosen) {
      say('people', `GAP could not separate the first people on evidence; in first-name order: ${spokenPerson(first.name, first.title, i.accountName)}. ${forTheEar(first.reason).replace(/[.!?]+$/, '')}.${verified}`);
    } else {
      say('people', `${first.chosen ? 'First' : 'The first person'}: ${spokenPerson(first.name, first.title, i.accountName)}. ${forTheEar(first.reason).replace(/[.!?]+$/, '')}.${verified}`);
    }
    const second = rows.find((r) => r !== first && r.coldEligible) ?? null;
    if (second) say('second', i.stack?.tie && !first.chosen ? `Then ${spokenPerson(second.name, second.title, i.accountName)}, on the same evidence.` : `If no reply, ${spokenPerson(second.name, second.title, i.accountName)}.`);
  } else if (i.state.state === 'replied' && i.state.lastInbound) {
    say('people', `${forTheEar(i.state.lastInbound.who)} wrote back; read it before anyone else is touched.`);
  }
  if (i.doNotContactCount) say('flagged', `${i.doNotContactCount} ${i.doNotContactCount === 1 ? 'person is' : 'people are'} flagged do not contact.`);
  // 5. The opening and why they care (the anchor only; never the do-not-use list).
  let whySaid = false;
  if (i.anchor?.primary && speakWho) {
    say('opening', `The opening: ${spokenSentence(i.anchor.primary.observation, 'Checked')}`);
    if (i.anchor.whyTheyCare) {
      say('why', `Why they care, our read: ${forTheEar(i.anchor.whyTheyCare.text).replace(/[.!?]+$/, '')}.`);
      whySaid = true;
    }
  }
  // 6. The unknown, then the next action (the remit caution is said once: NEXT drops it when why they care has it).
  const learn = row(i.story, 'learn', dnu);
  if (learn.length) say('learn', `Still unknown: ${firstSpoken(learn, 1)}`);
  const nextText = whySaid ? i.nextText.replace(/\s*Caution: [^.]*\.?$/, '') : i.nextText;
  say('next', `Next: ${forTheEar(nextText).replace(/[.!?]+$/, '')}.`);

  // Over length: drop whole sections (the goal, the yard line, the unknown) until it fits the ear; Next always stays.
  for (const drop of ['goal', 'yard', 'learn', 'second']) {
    if (wordCount(parts.map((p) => p.text).join(' ')) <= ACCOUNT_LISTEN_WORDS.max) break;
    const k = parts.findIndex((p) => p.key === drop);
    if (k >= 0) parts.splice(k, 1);
  }
  return parts.map((p) => p.text).join(' ').replace(/\s+/g, ' ').trim();
}
