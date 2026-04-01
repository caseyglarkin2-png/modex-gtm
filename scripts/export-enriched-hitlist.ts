/**
 * export-enriched-hitlist.ts
 * Pulls every emailed contact from email_logs, joins persona + account DB intel,
 * cross-matches Mission Control pipeline data, and adds Resend email links per touch.
 * Output: docs/hitlist-enriched.csv
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// MC pipeline already fetched — re-fetch live
const MC_URL  = 'https://clawd-control-plane-production.up.railway.app';
const MC_TOKEN = process.env.MC_API_TOKEN || '';

async function fetchMCPipeline(): Promise<Record<string, any>> {
  const res = await fetch(`${MC_URL}/api/pipeline?limit=2000`, {
    headers: { Authorization: `Bearer ${MC_TOKEN}` },
  });
  const d: any = await res.json();
  const byEmail: Record<string, any> = {};
  for (const e of (d.entries || [])) {
    if (e.email) byEmail[e.email.toLowerCase()] = e;
  }
  return byEmail;
}

async function main() {
  console.log('Fetching MC pipeline...');
  const mc = await fetchMCPipeline();
  console.log(`MC pipeline: ${Object.keys(mc).length} entries`);

  console.log('Querying DB...');

  // All touches per contact with Resend message IDs
  const logs = await prisma.$queryRawUnsafe(`
    SELECT
      el.to_email,
      el.account_name,
      el.subject,
      el.provider_message_id,
      el.status,
      el.sent_at,
      el.opened_at,
      el.clicked_at
    FROM email_logs el
    WHERE el.to_email NOT IN (SELECT email FROM unsubscribed_emails)
      AND el.to_email NOT IN (
        SELECT DISTINCT to_email FROM email_logs WHERE status IN ('bounced','complained')
      )
    ORDER BY el.to_email, el.sent_at ASC
  `) as any[];

  // Group touches by email
  const grouped: Record<string, any[]> = {};
  for (const row of logs) {
    const k = row.to_email.toLowerCase();
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(row);
  }

  // Persona + account enrichment
  const personaRows = await prisma.$queryRawUnsafe(`
    SELECT
      p.email,
      p.name            AS contact_name,
      p.title,
      p.linkedin_url,
      p.quality_score,
      p.quality_band,
      p.email_confidence,
      p.phone,
      a.vertical,
      a.rank            AS account_rank,
      a.priority_score,
      a.priority_band,
      a.tier,
      a.signal_type,
      a.why_now,
      a.primo_angle,
      a.icp_fit,
      a.modex_signal,
      a.primo_story_fit
    FROM personas p
    LEFT JOIN accounts a ON a.name = p.account_name
    WHERE p.email IS NOT NULL
  `) as any[];

  const personaByEmail: Record<string, any> = {};
  for (const p of personaRows) {
    personaByEmail[p.email.toLowerCase()] = p;
  }

  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const resendLink = (id: string) =>
    id ? `https://resend.com/emails/${id}` : '';

  const gmailLink = (rawId: string) => {
    // MC stores as "Sent: {hexId}" — link to Gmail sent item
    const match = rawId?.replace('Sent: ', '').trim();
    return match ? `https://mail.google.com/mail/u/0/#sent/${match}` : '';
  };

  const cols = [
    'email',
    'account_name',
    'contact_name',
    'title',
    // Contact channels
    'linkedin_db',
    'linkedin_mc',
    'phone',
    // Location
    'city',
    'state',
    // Classification
    'vertical',
    'industry_mc',
    'account_rank',
    'priority_score',
    'priority_band',
    'tier_db',
    'tier_mc',
    'quality_score',
    'quality_band',
    'email_confidence',
    // Research hooks
    'signal_type',
    'why_now',
    'primo_angle',
    'facilities_mc',
    'freight_type_mc',
    'est_truckloads_mc',
    // Account scores
    'icp_fit',
    'modex_signal',
    'primo_story_fit',
    // Engagement
    'total_touches',
    'ever_opened',
    'ever_clicked',
    // Resend email links (per touch, up to 5)
    'touch_1_subject',
    'touch_1_resend_link',
    'touch_1_sent_at',
    'touch_2_subject',
    'touch_2_resend_link',
    'touch_2_sent_at',
    'touch_3_subject',
    'touch_3_resend_link',
    'touch_3_sent_at',
    'touch_4_subject',
    'touch_4_resend_link',
    'touch_4_sent_at',
    'touch_5_subject',
    'touch_5_resend_link',
    'touch_5_sent_at',
    // MC Gmail send links (cross-ref)
    'mc_t1_gmail_link',
    'mc_t2_gmail_link',
    'mc_t3_gmail_link',
    // MC metadata
    'mc_stage',
    'mc_source',
    'mc_replied_at',
    'mc_website',
  ];

  const rows: string[] = [cols.join(',')];

  for (const [email, touches] of Object.entries(grouped)) {
    const account_name = touches[0]?.account_name ?? '';
    const p = personaByEmail[email] ?? {};
    const m = mc[email] ?? {};

    const everOpened = touches.some(t => t.status === 'opened' || t.opened_at);
    const everClicked = touches.some(t => t.status === 'clicked' || t.clicked_at);

    const t = (i: number) => touches[i];

    const row: Record<string, any> = {
      email,
      account_name,
      contact_name:       p.contact_name ?? m.contact ?? '',
      title:              p.title ?? m.title ?? m.role ?? '',
      linkedin_db:        p.linkedin_url ?? '',
      linkedin_mc:        m.linkedin ?? '',
      phone:              p.phone ?? '',
      city:               m.city ?? '',
      state:              m.state ?? '',
      vertical:           p.vertical ?? '',
      industry_mc:        m.industry ?? '',
      account_rank:       p.account_rank ?? '',
      priority_score:     p.priority_score ?? '',
      priority_band:      p.priority_band ?? '',
      tier_db:            p.tier ?? '',
      tier_mc:            m.tier ?? '',
      quality_score:      p.quality_score ?? '',
      quality_band:       p.quality_band ?? '',
      email_confidence:   p.email_confidence ?? '',
      signal_type:        p.signal_type ?? '',
      why_now:            p.why_now ?? '',
      primo_angle:        p.primo_angle ?? '',
      facilities_mc:      m.facilities ?? '',
      freight_type_mc:    m.freight_type ?? '',
      est_truckloads_mc:  m.est_truckloads ?? '',
      icp_fit:            p.icp_fit ?? '',
      modex_signal:       p.modex_signal ?? '',
      primo_story_fit:    p.primo_story_fit ?? '',
      total_touches:      touches.length,
      ever_opened:        everOpened,
      ever_clicked:       everClicked,
      touch_1_subject:    t(0)?.subject ?? '',
      touch_1_resend_link: resendLink(t(0)?.provider_message_id ?? ''),
      touch_1_sent_at:    t(0)?.sent_at ?? '',
      touch_2_subject:    t(1)?.subject ?? '',
      touch_2_resend_link: resendLink(t(1)?.provider_message_id ?? ''),
      touch_2_sent_at:    t(1)?.sent_at ?? '',
      touch_3_subject:    t(2)?.subject ?? '',
      touch_3_resend_link: resendLink(t(2)?.provider_message_id ?? ''),
      touch_3_sent_at:    t(2)?.sent_at ?? '',
      touch_4_subject:    t(3)?.subject ?? '',
      touch_4_resend_link: resendLink(t(3)?.provider_message_id ?? ''),
      touch_4_sent_at:    t(3)?.sent_at ?? '',
      touch_5_subject:    t(4)?.subject ?? '',
      touch_5_resend_link: resendLink(t(4)?.provider_message_id ?? ''),
      touch_5_sent_at:    t(4)?.sent_at ?? '',
      mc_t1_gmail_link:   gmailLink(m.sent_t1_message_id ?? ''),
      mc_t2_gmail_link:   gmailLink(m.sent_t2_message_id ?? ''),
      mc_t3_gmail_link:   gmailLink(m.sent_t3_message_id ?? ''),
      mc_stage:           m.stage ?? '',
      mc_source:          m.source ?? '',
      mc_replied_at:      m.replied_at ? new Date(m.replied_at * 1000).toISOString() : '',
      mc_website:         m.website ?? '',
    };

    rows.push(cols.map(c => esc(row[c])).join(','));
  }

  const outPath = path.join(process.cwd(), 'docs', 'hitlist-enriched.csv');
  fs.writeFileSync(outPath, rows.join('\n'));
  console.log(`\nExported ${rows.length - 1} contacts to ${outPath}`);
  console.log('Columns:', cols.length);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
