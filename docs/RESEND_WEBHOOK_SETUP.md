# 🔔 Resend Webhook Setup Guide

## Critical: Webhook Setup Required

**Status:** Webhook endpoint exists in code (`/api/webhooks/email`) but NOT configured in Resend dashboard.

**Without this setup:** Email opens, bounces, and clicks won't be tracked.

---

## Step 1: Get Your Webhook Signing Secret

1. Go to [Resend Dashboard](https://resend.com/webhooks)
2. Click **"Create Webhook"** (or find existing one for `modex-gtm.vercel.app`)
3. Set **Endpoint URL** to:
   ```
   https://modex-gtm.vercel.app/api/webhooks/email
   ```
4. Select **Events** to track:
   - ✅ `email.sent`
   - ✅ `email.delivered`
   - ✅ `email.opened`
   - ✅ `email.clicked`
   - ✅ `email.bounced`
   - ✅ `email.complained`

5. Click **"Create"**
6. Copy the **Signing Secret** (shows as `whsec_...`)

---

## Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/modex-gtm/settings/environment-variables)
2. Click **"Add New"**
3. Create variable:
   ```
   Key:   RESEND_WEBHOOK_SECRET
   Value: whsec_xxxxxxxxxxxxx  (paste from step 1)
   ```
4. Select environments: **Production, Preview, Development**
5. Click **"Save"**

You also need:
```
Key:   NEXT_PUBLIC_APP_URL
Value: https://modex-gtm.vercel.app
```

---

## Step 3: Verify Configuration

After deploying (Vercel auto-redeploys on env var change), send a test email:

```bash
curl -X POST https://modex-gtm.vercel.app/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "bodyHtml": "<p>This is a test</p>",
    "accountName": "Test Account",
    "personaName": "Test User"
  }'
```

Then open the email and:
- ✅ Click a link in the email
- ✅ Wait 5 minutes
- ✅ Check `/analytics/emails` — should show "Clicked" status

---

## Step 4: Test Bounce Handling

1. Send an email to `bounce@simulator.amazonses.com`
2. Wait 30 seconds
3. Check `/analytics/emails` — should show "Bounced" status
4. Check the persona's `email_valid` flag — should be `false`

---

## Webhook Event Mapping

When Resend sends events, this is what happens:

| Resend Event | Action |
|---|---|
| `email.delivered` | Update `EmailLog.status = 'delivered'` |
| `email.opened` | Update `EmailLog.status = 'opened'`, set `opened_at` |
| `email.clicked` | Update `EmailLog.status = 'clicked'`, set `clicked_at` |
| `email.bounced` | Update `EmailLog.status = 'bounced'` |
| `email.complained` | Update `EmailLog.status = 'bounced'` (spam complaint) |

---

## Debugging

### "Webhook not received"
- Check Resend Dashboard → Webhooks → Test event
- Verify endpoint URL is correct
- Check Vercel logs for webhook handler errors

### "Webhook signature verification failed"
- Make sure `RESEND_WEBHOOK_SECRET` is set in Vercel
- It must match the secret shown in Resend dashboard
- After updating, wait 5 min for Vercel to deploy

### "Email status not updating in analytics"
- Verify `provider_message_id` is being saved when email is sent
- Check Vercel logs: `console.error` in webhook handler
- Open email preview in Resend dashboard to manually test

---

## Current Status

| Component | Status | Next Step |
|-----------|--------|-----------|
| Email send API | ✅ Working | Send test emails |
| Email analytics dashboard | ✅ Working | View sent emails |
| Webhook endpoint | ✅ Coded | Configure in Resend |
| Webhook events | ⏳ Blocked on config | Add RESEND_WEBHOOK_SECRET to Vercel |
| Open/click tracking | ⏳ Blocked on webhook | Complete steps above |
| Bounce handling | ⏳ Blocked on webhook | Complete steps above |

---

## Next: Send Test Emails

Once webhook is configured, run:

```bash
TEST_EMAIL=your-email@example.com npx ts-node scripts/send-test-emails.ts
```

This sends 3 emails showing the complete sequence:
1. Initial outreach
2. Follow-up (2 days later)
3. Meeting brief / offer

Check your inbox to see what recipients receive!
