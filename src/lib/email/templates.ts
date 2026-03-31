/**
 * Premium cold outreach template — designed to look like a personal email,
 * NOT a marketing blast. No heavy headers, no boxes, no template smell.
 * Clean typography, subtle brand, executive-level signature.
 */

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

/** Build RFC 8058 List-Unsubscribe headers for one-click unsubscribe (Gmail/Yahoo mandate) */
export function listUnsubscribeHeaders(recipientEmail: string): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
  const url = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
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

export function wrapHtml(bodyText: string, accountName: string, recipientEmail?: string, emailLogId?: number): string {
  const escaped = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 14px 0; padding:0;">')
    .replace(/\n/g, '<br />');

  // Build unsubscribe link (CAN-SPAM compliance)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
  const unsubscribeUrl = recipientEmail
    ? `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}${emailLogId ? `&id=${emailLogId}` : ''}`
    : `${baseUrl}/unsubscribe`;

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
    <!-- Signature — subtle divider, executive style -->
    <tr>
      <td style="padding:0 24px 32px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e0e0e0; padding-top:16px; width:100%;">
          <tr>
            <td style="padding-top:16px;">
              <!-- Name + Title -->
              <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:#1a1a1a;">Casey Larkin</p>
              <p style="margin:0 0 10px; font-size:13px; color:#6b7280;">GTM Lead · <span style="color:#0e7490; font-weight:600;">Yard</span><span style="font-weight:600; color:#1a1a1a;">Flow</span> by FreightRoll</p>
              <!-- Value prop — one line, understated -->
              <p style="margin:0 0 10px; font-size:12px; color:#9ca3af; font-style:italic;">The First Yard Network System. Deterministic throughput across every facility.</p>
              <!-- Links -->
              <p style="margin:0; font-size:12px;">
                <a href="https://yardflow.ai" style="color:#0e7490; text-decoration:none; font-weight:500;">yardflow.ai</a>
                <span style="color:#d1d5db; margin:0 6px;">|</span>
                <a href="https://yardflow.ai/roi" style="color:#0e7490; text-decoration:none; font-weight:500;">Run ROI</a>
                <span style="color:#d1d5db; margin:0 6px;">|</span>
                <a href="${BOOKING_LINK}" style="color:#0e7490; text-decoration:none; font-weight:500;">Book a Network Audit</a>
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
          FreightRoll Inc. · Austin, TX 78701<br/>
          <a href="${unsubscribeUrl}" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}
