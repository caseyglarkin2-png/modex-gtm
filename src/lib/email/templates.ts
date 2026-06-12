/**
 * Premium cold outreach template — designed to look like a personal email,
 * NOT a marketing blast. No heavy headers, no boxes, no template smell.
 * Clean typography, subtle brand, executive-level signature.
 */

import { generateToken } from './unsubscribe-token';
import { generateOpenToken } from './open-token';
import { getSiteUrl } from '@/lib/site-url';
import { resolveSenderIdentity, type SenderIdentity } from './sender-identity';

/**
 * Build the open-tracking pixel <img> for an outbound email.
 *
 * The route lives at `/api/e/open/route.ts`, so its canonical URL is
 * slash-terminated (`/api/e/open/`) — modex-gtm runs trailingSlash:true and
 * email clients do NOT follow the 308 a non-slash path would emit, so the id
 * MUST ride as a query param on the slash-terminated path. We pass the opaque
 * HMAC-signed token (never the raw EmailLog id).
 *
 * Caveat (do not try to defeat): Gmail proxies and pre-fetches remote images,
 * so an "open" is approximate (the proxy may fetch without a human viewing, and
 * blocked-image clients never fetch). First-open timestamp + a count is still
 * real signal, so we record it.
 */
export function buildOpenPixel(trackingId: string): string {
  const token = generateOpenToken(trackingId);
  const url = `${getSiteUrl()}/api/e/open/?l=${encodeURIComponent(token)}`;
  return `<img src="${url}" alt="" width="1" height="1" style="display:none; width:1px; height:1px; max-height:1px; max-width:1px; overflow:hidden; border:0; margin:0; padding:0;" />`;
}

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

/** Build RFC 8058 List-Unsubscribe headers for one-click unsubscribe (Gmail/Yahoo mandate) */
export function listUnsubscribeHeaders(recipientEmail: string): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
  const token = generateToken(recipientEmail);
  const url = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${token}`;
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/** Strip HTML to plain text for multipart/alternative */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function wrapHtml(bodyText: string, accountName: string, recipientEmail?: string, emailLogId?: number, imageUrl?: string, cid?: string, identity: SenderIdentity = resolveSenderIdentity(), trackingId?: string): string {
  const escaped = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 14px 0; padding:0;">')
    .replace(/\n/g, '<br />');

  // Optional inline proof image (a YardFlow live-yard frame). URL is schema-validated;
  // strip quotes defensively so it can't break out of the attribute.
  // When a `cid` is supplied, reference the embedded attachment via `cid:<id>`
  // instead of the hosted URL (so it renders even when remote images are
  // blocked). The cid token is internal/trusted; still strip quotes defensively.
  const safeImageUrl = imageUrl ? imageUrl.replace(/["'<>]/g, '') : '';
  const safeCid = cid ? cid.replace(/["'<>]/g, '') : '';
  const imgSrc = safeCid ? `cid:${safeCid}` : safeImageUrl;
  const imageBlock = imgSrc
    ? `<tr>
      <td style="padding:4px 24px 8px;">
        <img src="${imgSrc}" alt="YardFlow live yard operations at a Primo Brands plant" width="592" style="width:100%; max-width:592px; height:auto; border-radius:8px; border:1px solid #e8e8e8; display:block;" />
        <p style="margin:7px 2px 0; font-size:11px; color:#9ca3af; font-style:italic;">YardFlow live at a Primo Brands plant: real-time trailer detection in the yard.</p>
      </td>
    </tr>`
    : '';

  // Build unsubscribe link (CAN-SPAM compliance, HMAC-signed)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
  const unsubscribeUrl = recipientEmail
    ? `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${generateToken(recipientEmail)}${emailLogId ? `&id=${emailLogId}` : ''}`
    : `${baseUrl}/unsubscribe`;

  // Open-tracking pixel (only when a tracking id is minted for this send).
  const openPixel = trackingId ? buildOpenPixel(trackingId) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background:#ffffff; margin:0; padding:0;">
  <!--[if mso]><table width="100%"><tr><td width="640" align="center"><![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px; margin:0 auto;">
    <!-- Body — clean, personal, no wrapper box -->
    <tr>
      <td style="padding:32px 24px 24px; color:#1a1a1a; font-size:15px; line-height:1.75; letter-spacing:-0.01em;">
        <p style="margin:0 0 14px 0; padding:0;">${escaped}</p>
      </td>
    </tr>
    ${imageBlock}
    <!-- Signature — subtle divider, executive style -->
    <tr>
      <td style="padding:0 24px 32px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e0e0e0; padding-top:16px; width:100%;">
          <tr>
            <td style="padding-top:16px;">
              <!-- Name + Title -->
              <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#1a1a1a;">${identity.name}</p>
              <p style="margin:0 0 10px; font-size:13px; color:#6b7280;">${identity.role} · <span style="color:#0e7490; font-weight:600;">Yard</span><span style="font-weight:600; color:#1a1a1a;">Flow</span> by FreightRoll</p>
              <!-- Value prop — one line, understated -->
              <p style="margin:0 0 10px; font-size:12px; color:#9ca3af; font-style:italic;">The First Yard Network System. Deterministic throughput across every facility.</p>
              <!-- Links -->
              <p style="margin:0; font-size:12px;">
                <a href="https://yardflow.ai" style="color:#0e7490; text-decoration:none; font-weight:500;">yardflow.ai</a>
                <span style="color:#d1d5db; margin:0 6px;">|</span>
                <a href="https://yardflow.ai/roi" style="color:#0e7490; text-decoration:none; font-weight:500;">Run ROI</a>
                <span style="color:#d1d5db; margin:0 6px;">|</span>
                <a href="${identity.bookingLink ?? BOOKING_LINK}" style="color:#0e7490; text-decoration:none; font-weight:500;">Book a Network Audit</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer — compliance & unsubscribe -->
    <tr>
      <td style="padding:0 24px 24px; border-top:1px solid #f0f0f0;">
        <p style="margin:8px 0 0; font-size:10px; color:#9ca3af; line-height:1.5;">
          FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104<br/>
          <a href="${unsubscribeUrl}" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
  ${openPixel}
</body>
</html>`;
}
