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
  <title>FreightRoll — ${accountName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb;">
    <tr>
      <td style="background:#0f172a; padding:20px 28px;">
        <span style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:-0.5px;">FreightRoll</span>
        <span style="color:#94a3b8; font-size:13px; margin-left:8px;">MODEX 2026</span>
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
          Casey — <strong>FreightRoll</strong><br />
          Reducing CPG freight costs 12–18% with real-time carrier intelligence<br />
          MODEX 2026 · Atlanta · March 16–19
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
