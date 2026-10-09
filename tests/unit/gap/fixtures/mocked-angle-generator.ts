/**
 * C54: a scripted angle generator for the harness check. It derives its answer from the RECORD BLOCK the prompt hands
 * it (the [K] lines, the deal's next step, the gaps), never from the case's expected words (C57 pass 2, finding 6b):
 * the first buyer line is restated as a fact with its label, the deal line and the newest checked fact are restated
 * with their labels, the rest is hedged inference; two open questions, one admitting a no; a caveat that names the
 * gaps the record declares. The `bad` option (a person's name the prompt carries) answers with a prohibited claim and
 * a leaked seller note so the scorer is proven to catch both. This is a harness check, never a quality claim.
 */
type Generate = (prompt: string, maxTokens?: number) => Promise<{ text: string; provider: string }>;

interface RecordLine { label: string; cls: string; date: string; text: string }

/** The [K] lines of the record block: "[K1] the buyer said, Sep 16, 2026: ...". */
export function recordLines(prompt: string): RecordLine[] {
  const out: RecordLine[] = [];
  for (const line of prompt.split('\n')) {
    const m = /^\[(K\d+)\] ([^,]+), ([^:]+): (.*)$/.exec(line.trim());
    if (m) out.push({ label: m[1], cls: m[2].trim(), date: m[3].trim(), text: m[4].trim() });
  }
  return out;
}

const firstSentence = (t: string) => (t.split(/(?<=[.!?])\s+/)[0] ?? t).replace(/\s+/g, ' ').trim().slice(0, 160).replace(/[.]+$/, '').replace(/\byard\b/gi, 'yards');
const dateOf = (s: string) => { const t = Date.parse(s); return Number.isNaN(t) ? 0 : t; };
const section = (prompt: string, head: string): string[] => {
  const lines = prompt.split('\n');
  const i = lines.findIndex((l) => l.startsWith(head));
  if (i < 0) return [];
  const out: string[] = [];
  for (const l of lines.slice(i + 1)) { if (!/^\[K\d+\]/.test(l.trim())) break; out.push(l.trim()); }
  return out;
};

export function mockedGenerator(opts: { bad?: string | null } = {}): Generate {
  return async (prompt) => {
    const lines = recordLines(prompt);
    const buyerLabels = new Set(section(prompt, 'What the buyer said').map((l) => /^\[(K\d+)\]/.exec(l)?.[1] ?? ''));
    const buyer = lines.find((l) => buyerLabels.has(l.label)) ?? null;
    const checkedLabels = new Set(section(prompt, 'Checked public facts').map((l) => /^\[(K\d+)\]/.exec(l)?.[1] ?? ''));
    const checked = lines.filter((l) => checkedLabels.has(l.label));
    const nextStep = /^The deal's recorded next step: (.*)$/m.exec(prompt)?.[1]?.replace(/\.$/, '') ?? null;
    // The handler's own deal line (from the Pursue's scoped deals), present even when the deal has no recorded next step.
    // The deal's name carries the product prefix in the CRM; the angle never names the product, so the restatement drops it.
    const dealLine = (/is in (?:an open HubSpot deal|\d+ open HubSpot deals): ([^\n]+)/m.exec(prompt)?.[1]?.trim() ?? null)?.replace(/\bYardFlow - /g, '') ?? null;
    const placed = /^Account: /m.test(prompt);
    const gaps = /^Not read \(say so in the caveat when it matters\): (.*)$/m.exec(prompt)?.[1] ?? null;
    const bad = !!opts.bad && prompt.includes(opts.bad);
    const support: Array<{ text: string; refs: string[]; kind: 'fact' | 'inference' }> = [];
    const sentences: string[] = [];
    if (bad) {
      sentences.push('There is no live opportunity here, so a cold opener is the move: no associated deal yet; the committee is the problem, so press on their yards today.');
      support.push({ text: sentences[0], refs: [], kind: 'inference' });
    } else {
      if (buyer) {
        // The speaker is the record's, never named here (a sentence naming a person is backed only by that person's own line).
        const s = `They wrote on ${buyer.date} that ${firstSentence(buyer.text.replace(/^[^:]+@[^:]+: /, ''))}.`;
        sentences.push(s); support.push({ text: s, refs: [buyer.label], kind: 'fact' });
      }
      if (nextStep || dealLine) {
        const s = nextStep ? `The account is in an open deal whose recorded next step is ${firstSentence(nextStep)}, so this is deal work, not a fresh opener.` : `The account is in an open deal (${firstSentence(dealLine ?? '')}), so this is deal work, not a fresh opener.`;
        sentences.push(s); support.push({ text: s, refs: buyer ? [buyer.label] : [], kind: 'inference' });
      }
      if (checked.length) {
        // The newest checked fact is the one worth restating; an older one is history.
        const c = [...checked].sort((a, b) => dateOf(b.date) - dateOf(a.date))[0];
        const s = `A checked fact reported ${c.date} says ${firstSentence(c.text)}; the date says how current it is.`;
        sentences.push(s); support.push({ text: s, refs: [c.label], kind: 'fact' });
      }
      const s = 'My guess is their yards are where the next conversation sits, and the record above is the only basis for saying so.';
      sentences.push(s); support.push({ text: s, refs: [], kind: 'inference' });
    }
    const why = sentences.join(' ');
    const starters = bad
      ? ['Can we book thirty minutes to show the product?', 'Who signs the contract?']
      : ['When a trailer reaches the gate at one of your yards today, who decides where it goes, or does the driver?', 'Is the plan you described still the plan, or has the timeline moved since you wrote?'];
    for (const st of starters) support.push({ text: st, refs: [], kind: 'inference' });
    const action = !placed || (!buyer && !nextStep && !dealLine) ? 'research' : 'email';
    const caveat = gaps ? `Not read: ${gaps}. Verify before writing.` : 'Verify the record dates before writing.';
    return { text: JSON.stringify({ whyItMatters: why, accounts: [], roles: ['VP Operations', 'Director of Distribution'], people: [], starters, proposedAction: action, caveat, support }), provider: 'mocked' };
  };
}
