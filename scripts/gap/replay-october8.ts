/**
 * C56: the October 8 replay, written to docs/gap/REPLAY_OCTOBER8.md.
 *
 *   npx tsx scripts/gap/replay-october8.ts [--out docs/gap/REPLAY_OCTOBER8.md]
 *
 * A sink-backed world (tests/unit/gap/fixtures/ledger-db.ts), the frozen reference set, a scripted generator; the
 * real plan, intelligence, briefing renderers, decide, angle, promotion and accountability code. No database, no
 * mail credential, no model, nothing sent. Exit code 1 when any ticket is an exception.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { renderReplay, replayOctober8, replayWorldSeed } from '../../src/lib/gap/evaluation/replay-october8';
import { REFERENCE_SET } from '../../tests/unit/gap/fixtures/reference-set';
import { ledgerDb } from '../../tests/unit/gap/fixtures/ledger-db';
import { mockedGenerator } from '../../tests/unit/gap/fixtures/mocked-angle-generator';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };

function measuredOctober8(): string {
  const ledger = readFileSync('docs/GAP_PROSPECTING_OS.md', 'utf8');
  const start = ledger.indexOf('#### The October 8 briefing, measured');
  const end = ledger.indexOf('#### Backlog', start);
  return start > 0 && end > start ? ledger.slice(start, end).replace(/^#### /, '') : '(the measured record was not found in docs/GAP_PROSPECTING_OS.md)';
}

async function main() {
  const now = new Date();
  const seed = replayWorldSeed(now);
  const db = ledgerDb({ accounts: seed.accounts, personas: seed.personas, inbound: seed.inbound, signals: seed.signals, triggers: seed.triggers }, now);
  const r = await replayOctober8(db.client(), { now, cases: REFERENCE_SET, generate: mockedGenerator() });
  const out = arg('--out') ?? 'docs/gap/REPLAY_OCTOBER8.md';
  writeFileSync(out, renderReplay(r, now, { measuredOctober8: measuredOctober8() }), 'utf8');
  const ex = r.dispositions.filter((d) => d.status === 'exception');
  console.log(`wrote ${out}: ${r.dispositions.length} dispositions (${r.dispositions.filter((d) => d.status === 'demonstrated').length} demonstrated, ${ex.length} exception(s)); ${r.drafts.length} draft(s) in the sink, ${r.sent.length} sent`);
  if (ex.length) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
