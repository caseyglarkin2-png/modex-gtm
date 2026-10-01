/**
 * GAP RESEARCH APERTURE: dogfood report (read-only).
 *
 *   npx tsx scripts/gap/source-aperture-dogfood.ts [--out docs/gap/source-aperture-latest.md] [Account ...]
 *
 * Per account: sources GAP found vs outreach facts verified, the sources that are not outreach facts (shown with
 * the reason), and what the earlier surfaces did NOT show (a research source past the 45-day inbox window, or one
 * shown only as a bare URL with no provenance). Nothing is written to the database.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { loadAccountSources } from '../../src/lib/gap/sources/account-sources';
import { ageLabel, STATUS_LABEL } from '../../src/lib/gap/sources/source-copy';
import { normalizeSignalUrl } from '../../src/lib/gap/signals/intake';

const DEFAULT = ['PepsiCo', 'General Mills', 'Walmart', 'Tyson', 'Kroger', 'FedEx', 'NFI', 'Hormel', 'GXO', 'Crowley'];
const INBOX_WINDOW_MS = 45 * 86_400_000;

async function resolve(prisma: PrismaClient, q: string): Promise<string | null> {
  const rows = await prisma.account.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { name: true }, take: 20 });
  const names = rows.map((r) => r.name);
  return names.find((n) => n.toLowerCase() === q.toLowerCase()) ?? names.sort((a, b) => a.length - b.length)[0] ?? null;
}

async function main() {
  const args = process.argv.slice(2);
  const outAt = args.indexOf('--out');
  const out = outAt >= 0 ? args[outAt + 1] : null;
  const wanted = args.filter((a, i) => !a.startsWith('--') && (outAt < 0 || i !== outAt + 1));
  const prisma = new PrismaClient();
  const now = new Date();
  const lines: string[] = [`# GAP research aperture dogfood (${now.toISOString().slice(0, 16)}Z, read-only)`, ''];
  lines.push('| Account | Sources found | Outreach facts verified | Not outreach facts (shown) | Previously hidden or bare URL | Oldest surfaced | Ambiguous surfaced | Set aside | Dropped |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  const details: string[] = [];
  for (const q of wanted.length ? wanted : DEFAULT) {
    const name = await resolve(prisma, q);
    if (!name) {
      lines.push(`| ${q} | account not found | | | | | | | |`);
      continue;
    }
    const s = await loadAccountSources(prisma, name, { now });
    // What the earlier surfaces showed WITH provenance: signal rows (headline, publisher, date) and live facts.
    // A research source inside the 45-day inbox window was shown as a bare URL + reason; outside it, not at all.
    const signalKeys = new Set(
      (await prisma.gapSignal.findMany({ where: { account_name: name }, select: { url: true } })).map((r) => normalizeSignalUrl(r.url ?? '') ?? ''),
    );
    const recentRuns = await prisma.researchRun.findMany({ where: { account_name: name, run_key: { startsWith: 'gap_research:' }, created_at: { gte: new Date(now.getTime() - INBOX_WINDOW_MS) } }, select: { provider_status: true } });
    const bare = new Set<string>();
    for (const r of recentRuns) {
      const res = ((r.provider_status ?? {}) as { result?: { rejected?: Array<{ url?: string }> } }).result;
      for (const x of res?.rejected ?? []) bare.add(normalizeSignalUrl(x.url ?? '') ?? '');
    }
    const hiddenBefore = s.items.filter((i) => !signalKeys.has(i.key) && !i.factId && i.status !== 'VERIFIED_FOR_OUTREACH');
    const notFacts = s.items.filter((i) => i.status !== 'VERIFIED_FOR_OUTREACH');
    const oldest = [...s.items].filter((i) => i.publishedAt).sort((a, b) => a.publishedAt!.localeCompare(b.publishedAt!))[0];
    const ambiguous = s.items.filter((i) => /not about .* itself/.test(i.reason ?? '')).length;
    lines.push(
      `| ${name} | ${s.sourcesFound} | ${s.verifiedFacts} | ${notFacts.length} | ${hiddenBefore.length} (${hiddenBefore.filter((h) => !bare.has(h.key)).length} not shown at all, ${hiddenBefore.filter((h) => bare.has(h.key)).length} bare URL) | ${oldest ? `${oldest.publishedAt!.slice(0, 10)} ${oldest.publisher}` : 'n/a'} | ${ambiguous} | ${s.setAside} | ${s.dropped} |`,
    );
    details.push(`## ${name}`, '', `Sources found: ${s.sourcesFound} · Outreach facts verified: ${s.verifiedFacts}`, '');
    for (const i of s.items) {
      details.push(
        `- **${i.publisher}** · ${ageLabel(i.publishedAt, i.ageDays)}${i.publishedAt && !i.freshTrigger ? ' · NOT A FRESH TRIGGER' : ''} · ${STATUS_LABEL[i.status]}${i.reason ? `: ${i.reason}` : ''}${i.attribution ? ` · said by ${i.attribution}` : ''}`,
        `  ${i.title ?? '(no title)'} <${i.link}>${i.excerpt && i.excerptKind === 'verbatim' ? `\n  > ${i.excerpt.slice(0, 220)}` : ''}`,
      );
    }
    details.push('');
  }
  await prisma.$disconnect();
  const text = [...lines, '', ...details].join('\n');
  if (out) writeFileSync(out, text);
  process.stdout.write(text + '\n');
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message.split('\n')[0] : String(e)}\n`);
  process.exit(1);
});
