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

const row = (story: AccountStory | null, key: string): StorySentence[] => story?.rows.find((r) => r.key === key)?.sentences ?? [];
const firstSpoken = (s: StorySentence[] | undefined, n = 1): string => (s ?? []).slice(0, n).map((x) => spokenSentence(x.text, x.tag)).filter(Boolean).join(' ');

export function accountListenText(i: AccountListenInput): string {
  const parts: string[] = [];
  // 1. State and the last touch.
  parts.push(`${i.accountName}. ${forTheEar(i.state.stateLine).replace(/[.!?]+$/, '')}.`);
  const between = row(i.story, 'between_us');
  if (between.length) parts.push(firstSpoken(between, 1));
  else if (i.state.lastOutbound) parts.push(`Last touch: ${forTheEar(i.state.lastOutbound.what).replace(/[.!?]+$/, '')}.`);
  // 2. The goal and what is changing.
  const goal = row(i.story, 'goal');
  if (goal.length) parts.push(`Their goal: ${firstSpoken(goal, 1)}`);
  const changing = row(i.story, 'changing').filter((s) => !/^The (opening story|supporting fact), above\.$/.test(s.text));
  if (changing.length) parts.push(`What is changing: ${firstSpoken(changing, 1)}`);
  // 3. Where the yard fits, and our proof (measured, ours).
  const yard = row(i.story, 'yard');
  if (yard.length) parts.push(`Where the yard fits: ${firstSpoken(yard, 1)}`);
  if (i.anchor?.bestProof) parts.push(`Our proof, ${i.anchor.bestProof.tag === 'Our model' ? 'modeled' : 'measured'}: ${forTheEar(i.anchor.bestProof.text).replace(/[.!?]+$/, '')}.`);
  // 4. The people: the first, why, the role; the second if no reply; the flagged count.
  const rows = i.stack?.rows ?? [];
  const first = rows.find((r) => r.chosen) ?? rows[0] ?? null;
  const speakWho = i.state.coldTouchAllowed || i.state.state === 'in_motion' || i.state.state === 'follow_up_due' || i.state.state === 'choose_person';
  if (first && speakWho) {
    const verified = first.currentness && /Role (confirmed|likely|current)/i.test(first.currentness) ? ' Their role is verified.' : '';
    parts.push(`${first.chosen ? 'First' : 'The first person'}: ${spokenPerson(first.name, first.title)}. ${forTheEar(first.reason).replace(/[.!?]+$/, '')}.${verified}`);
    const second = rows.find((r) => r !== first && r.coldEligible) ?? null;
    if (second) parts.push(`If no reply, ${spokenPerson(second.name, second.title)}.`);
  } else if (i.state.state === 'replied' && i.state.lastInbound) {
    parts.push(`${forTheEar(i.state.lastInbound.who)} wrote back; read it before anyone else is touched.`);
  }
  if (i.doNotContactCount) parts.push(`${i.doNotContactCount} ${i.doNotContactCount === 1 ? 'person is' : 'people are'} flagged do not contact.`);
  // 5. The opening and why they care (the anchor only; never the do-not-use list).
  if (i.anchor?.primary && speakWho) {
    parts.push(`The opening: ${spokenSentence(i.anchor.primary.observation, 'Checked')}`);
    if (i.anchor.whyTheyCare) parts.push(`Why they care, our read: ${forTheEar(i.anchor.whyTheyCare.text).replace(/[.!?]+$/, '')}.`);
  }
  // 6. The unknown, then the next action.
  const learn = row(i.story, 'learn');
  if (learn.length) parts.push(`Still unknown: ${firstSpoken(learn, 1)}`);
  parts.push(`Next: ${forTheEar(i.nextText).replace(/[.!?]+$/, '')}.`);

  let text = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  // Over length: drop the second changing sentence, then the goal, then the yard line, until it fits the ear.
  const trims: Array<(t: string) => string> = [
    (t) => t.replace(/ Their goal: [^.]*\.(?: [^.]*\.)?/, ''),
    (t) => t.replace(/ Where the yard fits: [^.]*\.(?: [^.]*\.)?/, ''),
    (t) => t.replace(/ Still unknown: [^.]*\.(?: [^.]*\.)?/, ''),
  ];
  for (const trim of trims) {
    if (wordCount(text) <= ACCOUNT_LISTEN_WORDS.max) break;
    text = trim(text);
  }
  return text;
}
