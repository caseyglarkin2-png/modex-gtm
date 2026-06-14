/**
 * The Pounce Spine — shared ingest (the one write path).
 *
 * Every trigger source routes here: the news cron calls ingestTriggers()
 * in-process; external workers (the local X-rig scan, clawd) POST to
 * /api/pounce/ingest which calls it. Dedupe rides on a sha256 of the
 * normalized URL, persisted on PounceTrigger.url_hash (@unique), so a given
 * story fires Slack + stamps HubSpot EXACTLY ONCE across all sources and runs.
 *
 * HubSpot action here is a best-effort timeline Note on the resolved company
 * (no custom property required — keeps the spine free of the portal-property
 * decision). Slack action is the single #yardflow-intent format.
 */
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';
import { searchCompanyByName, updateCompanyTrigger } from '@/lib/hubspot/companies';
import { createCompanyNote } from '@/lib/hubspot/notes';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { PING_THRESHOLD } from './score';
import { normalizeScore } from './fit';

export interface RawTrigger {
  accountSlug: string;
  accountName: string;
  title: string;
  url: string;
  source: 'news' | 'x' | 'clawd' | 'web';
  score: number;
  categories: string[];
  publishedAt?: string | null;
}

export interface IngestResult {
  received: number;
  created: number;
  duplicate: number;
  pinged: number;
  stamped: number;
}

function normalizeUrl(url: string): string {
  // Strip query/hash + trailing slash so syndicated copies of one story
  // (utm params, AMP, etc.) collapse to a single dedupe key.
  return url.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
}

function hashUrl(url: string): string {
  return createHash('sha256').update(normalizeUrl(url)).digest('hex');
}

/** Resolve the canonical HubSpot company name (registry slug wins over caller). */
function companyName(t: RawTrigger): string {
  return getAccountMicrositeData(t.accountSlug)?.accountName ?? t.accountName;
}

export async function ingestTriggers(
  raw: RawTrigger[],
  opts: { ping?: boolean; pingCap?: number } = {},
): Promise<IngestResult> {
  const ping = opts.ping !== false;
  const pingCap = opts.pingCap ?? 6;
  const res: IngestResult = { received: raw.length, created: 0, duplicate: 0, pinged: 0, stamped: 0 };

  // Highest score first so the ping cap spends on the hottest triggers.
  const sorted = [...raw].sort((a, b) => b.score - a.score);

  for (const t of sorted) {
    const url_hash = hashUrl(t.url);
    const existing = await prisma.pounceTrigger.findUnique({ where: { url_hash } });
    if (existing) { res.duplicate += 1; continue; }

    const row = await prisma.pounceTrigger.create({
      data: {
        url_hash,
        account_slug: t.accountSlug,
        account_name: t.accountName,
        title: t.title,
        url: t.url,
        source: t.source,
        score: t.score,
        categories: t.categories,
        published_at: t.publishedAt ? new Date(t.publishedAt) : null,
      },
    });
    res.created += 1;

    const hot = t.score >= PING_THRESHOLD;
    if (!hot) continue;

    // Slack — once, capped per call.
    if (ping && res.pinged < pingCap) {
      const date = (t.publishedAt ?? new Date().toISOString()).slice(0, 10);
      const ok = await sendSlackNotification(
        `🎯 POUNCE — *${t.accountName}* _(${t.source})_\n"${t.title}"\n${date} · score ${t.score} [${t.categories.join(', ')}]\n${t.url}\nSpear: https://yardflow.ai/for/${t.accountSlug}/`,
      );
      if (ok) { res.pinged += 1; await prisma.pounceTrigger.update({ where: { id: row.id }, data: { slack_ping_at: new Date() } }); }
    }

    // HubSpot — on the resolved company, once: a timeline Note (human-readable)
    // AND the sortable trigger-heat properties (mirroring the intent trio).
    try {
      const company = await searchCompanyByName(companyName(t));
      if (company) {
        const body = [
          `<b>POUNCE TRIGGER — ${t.accountName}</b> <i>(${t.source}, score ${t.score})</i>`,
          t.title,
          `<a href="${t.url}">${t.url}</a>`,
          `Categories: ${t.categories.join(', ')}`,
        ].join('<br>');
        const noteId = await createCompanyNote({ companyId: company.id, body });
        // Trigger-heat properties carry the NORMALIZED 0-100 score (so HubSpot
        // sorts consistently across sources) + the primary locked-vocab category.
        await updateCompanyTrigger(company.id, {
          score: normalizeScore(t.score, t.source),
          at: new Date(),
          headline: t.title,
          source: t.source,
          url: t.url,
          category: t.categories[0] ?? '',
        });
        if (noteId) { res.stamped += 1; await prisma.pounceTrigger.update({ where: { id: row.id }, data: { hubspot_note_at: new Date() } }); }
      }
    } catch {
      // never let a HubSpot hiccup break ingest
    }
  }
  return res;
}
