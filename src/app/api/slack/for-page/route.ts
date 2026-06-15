import { NextRequest, NextResponse, after } from 'next/server';
import { verifySlackSignature } from '@/lib/slack/verify';
import { generatePageRow } from '@/lib/for/generate';
import { upsertForPage } from '@/lib/for/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SITE = 'https://yardflow.ai';
const slugify = (s: string) => s.trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function post(url: string, body: object) {
  try { await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); } catch { /* slack shows only the ack */ }
}

/**
 * Slack slash command `/yardflow-page <account>`. Verify the signature, ack
 * within Slack's 3s limit, then generate the page in after() and post the live
 * link to response_url. The page assembles deterministically (snapshot + geo +
 * a data-driven baseline spear); the A+ spear is layered later by clawd / an
 * agent re-POSTing the override. A new /for + /demo with no deploy.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !verifySlackSignature(raw, { 'x-slack-signature': request.headers.get('x-slack-signature'), 'x-slack-request-timestamp': request.headers.get('x-slack-request-timestamp') }, secret)) {
    return NextResponse.json({ response_type: 'ephemeral', text: 'Signature check failed.' }, { status: 401 });
  }
  const params = new URLSearchParams(raw);
  const text = (params.get('text') ?? '').trim();
  const responseUrl = params.get('response_url') ?? '';
  if (!text) {
    return NextResponse.json({ response_type: 'ephemeral', text: 'Usage: `/yardflow-page <account>` — e.g. `/yardflow-page frito-lay`' });
  }
  const slug = slugify(text);

  after(async () => {
    try {
      const row = await generatePageRow(slug);
      await upsertForPage(row);
      const snap = row.snap as { annualValueLabel?: string; totalFacilities?: number };
      const pilot = (row.override as { pilot?: { site?: string } }).pilot?.site;
      await post(responseUrl, {
        response_type: 'in_channel',
        text: `:white_check_mark: *${SITE}/for/${slug}*\nModeled ${snap.annualValueLabel ?? ''} across ${snap.totalFacilities ?? '?'} sites. Pilot: ${pilot ?? 'TBD'}.\nBaseline spear is live now; A+ copy can be layered over the same page. Also live: ${SITE}/demo/${slug}`,
      });
    } catch (e) {
      await post(responseUrl, { response_type: 'ephemeral', text: `:x: Could not build /for/${slug}: ${(e as Error).message}. If the audit does not exist yet, build the demo pack first.` });
    }
  });

  return NextResponse.json({ response_type: 'ephemeral', text: `:hourglass_flowing_sand: Building *${SITE}/for/${slug}* ... I will post the link here in ~30-60s.` });
}
