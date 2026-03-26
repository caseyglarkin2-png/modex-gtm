export function wrapHtml(bodyText: string, accountName: string): string {
  const escaped = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YardFlow — ${accountName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb;">
    <tr>
      <td style="background:#0f172a; padding:20px 28px;">
        <span style="color:#22d3ee; font-size:18px; font-weight:800; letter-spacing:-0.5px;">Yard</span><span style="color:#ffffff; font-size:18px; font-weight:800;">Flow</span>
        <span style="color:#64748b; font-size:12px; margin-left:6px;">by FreightRoll</span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px; color:#1e293b; font-size:15px; line-height:1.7;">
        <p>${escaped}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 24px; border-top:1px solid #f1f5f9;">
        <p style="margin:0; font-size:13px; color:#64748b;">
          Casey Larkin — <strong>YardFlow by FreightRoll</strong><br />
          The First Yard Network System — standardized operating protocol for deterministic throughput<br />
          <a href="https://yardflow.ai" style="color:#22d3ee;">yardflow.ai</a> · <a href="https://yardflow.ai/roi" style="color:#22d3ee;">Run ROI</a> · <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" style="color:#22d3ee;">Book a Network Audit</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
