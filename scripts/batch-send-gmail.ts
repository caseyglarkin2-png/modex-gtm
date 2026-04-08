/**
 * batch-send-gmail.ts — Reusable Gmail API batch sender with DB logging.
 *
 * Usage:
 *   DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=sniper-10
 *   npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=sniper-10
 *   npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=sniper-10 --only=person@example.com
 *   RECOVERY_RESEND_OK=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=review-resend-ryan-hutcherson
 *
 * Features:
 *   - Loads contact list from scripts/contacts/<name>.ts
 *   - Runs the shared recipient guard before sending
 *   - Sends via Gmail API (casey@freightroll.com)
 *   - Logs each send to email_logs table via Prisma
 *   - Rate limited: 6 seconds between sends (10/min max)
 *   - DRY_RUN=1 for preview-only mode
 *   - Review resend manifests require RECOVERY_RESEND_OK=1 for live sends
 */

import { PrismaClient } from '@prisma/client';

// ── Config ──────────────────────────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN === '1';
const RATE_LIMIT_MS = 6000;
const prisma = new PrismaClient();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
const FROM_EMAIL = 'casey@freightroll.com';
const FROM_NAME = 'Casey Larkin';

// ── Contact interface ───────────────────────────────────────────────────────

export interface BatchContact {
  to: string;
  firstName: string;
  accountName: string;
  personaName?: string;
  accountSlug: string;
  assetPath?: string;
  assetLabel?: string;
  previewEyebrow?: string;
  previewTitle?: string;
  previewText?: string;
  previewTags?: string[];
  subject: string;
  body: string[];
}

function getAssetUrl(contact: BatchContact): string {
  return contact.assetPath
    ? `${BASE_URL}${contact.assetPath}`
    : `${BASE_URL}/for/${contact.accountSlug}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Gmail API (inline — avoids ESM issues in scripts) ───────────────────────

function getGmailConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim(),
    userEmail: process.env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com',
  };
}

function base64Url(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMimeMessage(payload: { to: string; subject: string; html: string; plainText: string }): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    payload.plainText,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    payload.html,
    `--${boundary}--`,
  ];
  return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`;
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getGmailConfig();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json() as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || 'Failed to get access token');
  }
  return data.access_token;
}

async function sendViaGmail(to: string, subject: string, html: string, plainText: string): Promise<string | null> {
  const { userEmail } = getGmailConfig();
  const accessToken = await getAccessToken();
  const raw = base64Url(buildMimeMessage({ to, subject, html, plainText }));
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(userEmail)}/messages/send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${err.slice(0, 300)}`);
  }
  const result = await res.json() as { id?: string };
  return result.id ?? null;
}

// ── HTML template ───────────────────────────────────────────────────────────

function renderAssetCard(contact: BatchContact, assetUrl: string): string {
  const eyebrow = escapeHtml(contact.previewEyebrow ?? `Private brief for ${contact.firstName}`);
  const title = escapeHtml(contact.previewTitle ?? contact.assetLabel ?? `${contact.accountName} brief`);
  const text = contact.previewText
    ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.65;color:#475569;">${escapeHtml(contact.previewText)}</p>`
    : '';
  const tags = contact.previewTags?.length
    ? `<p style="margin:16px 0 18px;">${contact.previewTags
        .map((tag) => `<span style="display:inline-block;margin:0 8px 8px 0;padding:7px 10px;border:1px solid #cbd5e1;border-radius:999px;background:#ffffff;color:#334155;font-size:11px;font-weight:600;letter-spacing:0.01em;">${escapeHtml(tag)}</span>`)
        .join('')}</p>`
    : '';

  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:22px 0 18px;border:1px solid #c7dde1;border-radius:22px;overflow:hidden;background:linear-gradient(180deg,#eef7f8 0%,#ffffff 100%);">
  <tr>
    <td style="padding:18px 18px 10px;background:linear-gradient(135deg,#12343b 0%,#0f766e 100%);">
      <p style="margin:0;font-size:11px;line-height:1.4;letter-spacing:0.16em;text-transform:uppercase;color:#d5f2ef;font-weight:700;">${eyebrow}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 18px 18px;">
      <p style="margin:0;font-size:24px;line-height:1.18;color:#0f172a;font-weight:700;letter-spacing:-0.03em;">${title}</p>
      ${text}
      ${tags}
      <p style="margin:0;">
        <a href="${assetUrl}" style="display:inline-block;padding:12px 16px;border-radius:999px;background:#0f766e;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">Open the brief</a>
      </p>
    </td>
  </tr>
</table>`;
}

function wrapHtml(contact: BatchContact): string {
  const unsubUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(contact.to)}`;
  const assetUrl = getAssetUrl(contact);
  const bodyHtml = contact.body
    .filter((paragraph) => paragraph.trim() !== assetUrl)
    .map((paragraph) => `<p style="margin:0 0 14px 0;">${escapeHtml(paragraph)}</p>`)
    .join('\n  ');
  const assetCard = renderAssetCard(contact, assetUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;">
<tr><td style="padding:32px 24px 24px;color:#1a1a1a;font-size:15px;line-height:1.75;letter-spacing:-0.01em;">
  ${bodyHtml}
  ${assetCard}
</td></tr>
<tr><td style="padding:0 24px 32px;">
  <table cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e0e0e0;padding-top:16px;width:100%;">
  <tr><td style="padding-top:16px;">
    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1a1a1a;">Casey Larkin</p>
    <p style="margin:0 0 10px;font-size:13px;color:#6b7280;">GTM Lead · <span style="color:#0e7490;font-weight:600;">Yard</span><span style="font-weight:600;color:#1a1a1a;">Flow</span> by FreightRoll</p>
    <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;font-style:italic;">The First Yard Network System. Deterministic throughput across every facility.</p>
    <p style="margin:0;font-size:12px;">
      <a href="https://yardflow.ai" style="color:#0e7490;text-decoration:none;font-weight:500;">yardflow.ai</a>
      <span style="color:#d1d5db;margin:0 6px;">|</span>
      <a href="https://yardflow.ai/roi" style="color:#0e7490;text-decoration:none;font-weight:500;">Run ROI</a>
    </p>
  </td></tr></table>
</td></tr>
<tr><td style="padding:0 24px 24px;border-top:1px solid #f0f0f0;">
  <p style="margin:8px 0 0;font-size:10px;color:#9ca3af;line-height:1.5;">
    FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104<br/>
    <a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
  </p>
</td></tr>
</table>
</body>
</html>`;
}

function toPlainText(paragraphs: string[]): string {
  return paragraphs.join('\n\n') + '\n\n--\nCasey Larkin\nGTM Lead, YardFlow by FreightRoll\nhttps://yardflow.ai';
}

type RecipientGuardModule = typeof import('../src/lib/email/recipient-guard');

async function loadRecipientGuard(): Promise<RecipientGuardModule> {
  const mod = await import('../src/lib/email/recipient-guard.ts');
  return ('default' in mod ? mod.default : mod) as RecipientGuardModule;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Parse --contacts=<name> arg
  const contactsArg = process.argv.find(a => a.startsWith('--contacts='));
  const onlyArg = process.argv.find(a => a.startsWith('--only='));
  if (!contactsArg) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=<name>');
    console.error('Example: --contacts=sniper-10');
    process.exit(1);
  }
  const contactsName = contactsArg.split('=')[1];
  const onlyEmail = onlyArg?.split('=')[1]?.toLowerCase();

  // Dynamic import of contact list
  let contacts: BatchContact[];
  try {
    const mod = await import(`./contacts/${contactsName}.ts`);
    contacts = mod.CONTACTS || mod.default;
    if (!contacts || !Array.isArray(contacts)) {
      throw new Error(`No CONTACTS array exported from scripts/contacts/${contactsName}.ts`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to load contacts/${contactsName}.ts: ${msg}`);
    process.exit(1);
  }

  if (onlyEmail) {
    contacts = contacts.filter((contact) => contact.to.toLowerCase() === onlyEmail);
    if (contacts.length === 0) {
      console.error(`No contact matched --only=${onlyEmail} in contacts/${contactsName}.ts`);
      process.exit(1);
    }
  }

  const isReviewResendManifest = contactsName.startsWith('review-resend-');
  if (isReviewResendManifest && contacts.length !== 1) {
    console.error(`Review resend manifests must contain exactly one contact. ${contactsName} has ${contacts.length}.`);
    process.exit(1);
  }

  if (isReviewResendManifest && !DRY_RUN && process.env.RECOVERY_RESEND_OK !== '1') {
    console.error('Live review resend requires RECOVERY_RESEND_OK=1. Dry run first, then send one contact and monitor before the next.');
    process.exit(1);
  }

  const { evaluateRecipientEligibility } = await loadRecipientGuard();

  console.log(`\n=== Batch Send via Gmail API ===`);
  console.log(`Contact list: ${contactsName} (${contacts.length} contacts)`);
  if (onlyEmail) {
    console.log(`Filtered to: ${onlyEmail}`);
  }
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE SEND'}`);
  console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`Rate limit: ${RATE_LIMIT_MS}ms between sends\n`);

  // Pre-flight: test OAuth token
  if (!DRY_RUN) {
    try {
      await getAccessToken();
      console.log('OAuth token: OK\n');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`OAuth token FAILED: ${msg}`);
      process.exit(1);
    }
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const contact of contacts) {
    const idx = sent + failed + skipped + 1;
    console.log(`[${idx}/${contacts.length}] ${contact.to} (${contact.accountName})`);
    console.log(`  Subject: ${contact.subject}`);

    const guard = await evaluateRecipientEligibility(prisma, contact.to, {
      allowPayloadReady: true,
      payloadReady: true,
      payloadDoNotContact: false,
    });
    if (!guard.ok) {
      console.log(`  -> SKIP: ${guard.reason}\n`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      const assetUrl = getAssetUrl(contact);
      console.log(`  Name: ${contact.firstName} | Account: ${contact.accountName}`);
      console.log(`  Body preview: ${contact.body[1]?.slice(0, 100)}...`);
      console.log(`  Asset: ${contact.assetLabel ?? 'Microsite'} -> ${assetUrl}`);
      console.log('  -> DRY RUN, skipping send\n');
      skipped++;
      continue;
    }

    try {
      const html = wrapHtml(contact);
      const plainText = toPlainText(contact.body);
      const msgId = await sendViaGmail(contact.to, contact.subject, html, plainText);

      // Log to email_logs
      await prisma.emailLog.create({
        data: {
          account_name: contact.accountName,
          persona_name: contact.personaName || contact.firstName,
          to_email: contact.to,
          subject: contact.subject,
          body_html: html,
          status: 'sent',
          provider_message_id: msgId,
          sent_at: new Date(),
        },
      });

      console.log(`  -> SENT (Gmail ID: ${msgId}) + logged to email_logs\n`);
      sent++;

      // Rate limit between sends
      if (idx < contacts.length) {
        await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  -> FAILED: ${msg}\n`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Sent: ${sent}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${contacts.length}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
