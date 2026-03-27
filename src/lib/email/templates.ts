/**
 * Premium cold outreach template — designed to look like a personal email,
 * NOT a marketing blast. No heavy headers, no boxes, no template smell.
 * Clean typography, subtle brand, executive-level signature.
 */
export function wrapHtml(bodyText: string, accountName: string): string {
  const escaped = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 14px 0; padding:0;">')
    .replace(/\n/g, '<br />');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YardFlow — ${accountName}</title>
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
              <p style="margin:0 0 10px; font-size:12px; color:#9ca3af; font-style:italic;">The First Yard Network System — deterministic throughput across every facility.</p>
              <!-- Links -->
              <p style="margin:0; font-size:12px;">
                <a href="https://yardflow.ai" style="color:#0e7490; text-decoration:none; font-weight:500;">yardflow.ai</a>
                <span style="color:#d1d5db; margin:0 6px;">|</span>
                <a href="https://yardflow.ai/roi" style="color:#0e7490; text-decoration:none; font-weight:500;">Run ROI</a>
                <span style="color:#d1d5db; margin:0 6px;">|</span>
                <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" style="color:#0e7490; text-decoration:none; font-weight:500;">Book a Network Audit</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}
