# ✅ Environment Variables Checklist

Add these to **Vercel Dashboard** → Settings → Environment Variables:

## Critical (Required for production)

```
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```
- **Where to get:** Resend Dashboard → Webhooks → Select webhook → Copy Signing Secret
- **Why:** Verifies webhook events come from Resend (security)
- **Status:** ⏳ MISSING — needed for tracking

```
NEXT_PUBLIC_APP_URL=https://modex-gtm.vercel.app
```
- **Why:** Used in unsubscribe links and webhook signature verification
- **Status:** ⏳ MISSING

## Already Set (Verified in Vercel)

```
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_xxxxx
SENDGRID_API_KEY=SG.xxxxx
AUTH_SECRET=xxxxx
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
```

---

## How to Add to Vercel

1. Go to https://vercel.com/modex-gtm/settings/environment-variables
2. Click **"Add New"**
3. Enter Key: `RESEND_WEBHOOK_SECRET`
4. Enter Value: (paste signing secret from Resend)
5. Select: **Production, Preview, Development**
6. Click **"Save"**
7. Repeat for `NEXT_PUBLIC_APP_URL`

**Wait 2-3 minutes for Vercel to redeploy with new env vars.**

---

## Verify They're Set

After deploying, check:

```bash
curl https://modex-gtm.vercel.app/api/webhooks/email -X OPTIONS -i
```

If webhook secret is set correctly, should respond with `200 OK`.

---

## Status Dashboard

| Variable | Set? | Used For | Impact if Missing |
|----------|------|----------|-------------------|
| `RESEND_WEBHOOK_SECRET` | ❌ | Webhook verification | Webhooks rejected as invalid |
| `NEXT_PUBLIC_APP_URL` | ❌ | Unsubscribe links | Wrong URL in emails |
| `RESEND_API_KEY` | ✅ | Email sending | Emails fail to send |
| `DATABASE_URL` | ✅ | Data storage | App broken |
| `AUTH_SECRET` | ✅ | Session auth | Login broken |

---

## Test Setup

Run this after adding env vars:

```bash
# Send test emails (replace with your email)
TEST_EMAIL=your-email@example.com npx ts-node scripts/send-test-emails.ts

# Visit analytics
open https://modex-gtm.vercel.app/analytics/emails
```
