# ✅ Environment Variables Checklist

Current reality as of 2026-04-08: the production Vercel project already has the core AI and voice keys configured. This checklist has been updated to reflect that instead of the older missing-key assumptions.

Add these to **Vercel Dashboard** → Settings → Environment Variables:

## Critical (Required for production)

```
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```
- **Where to get:** Resend Dashboard → Webhooks → Select webhook → Copy Signing Secret
- **Why:** Verifies webhook events come from Resend (security)
- **Status:** still required if webhook verification is intended to be strict across all environments

```
NEXT_PUBLIC_APP_URL=https://modex-gtm.vercel.app
```
- **Why:** Used in public links, metadata generation, unsubscribe links, and webhook-related absolute URLs
- **Status:** ✅ Set in Production

```
UNSUBSCRIBE_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- **Why:** HMAC for unsubscribe links and list-unsubscribe headers; required for all outbound emails
- **Status:** ❗ Add to Production, Preview, Development

## AI And Voice (Required for wow-first proposal work)

```
GEMINI_API_KEY=xxxxxxxxxxxxx
```
- **Why:** Primary content generation path for proposal copy, section briefings, and narration transforms
- **Status:** ✅ Set in Production

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```
- **Why:** Fallback provider when Gemini fails or exhausts quota
- **Status:** ✅ Set in Production

```
ELEVENLABS_API_KEY=xxxxxxxxxxxxx
```
- **Why:** Text-to-speech, preview generation, and any section-level narration work
- **Status:** ✅ Set in Production

```
ELEVENLABS_VOICE_ID=xxxxxxxxxxxxx
```
- **Why:** Default production narrator voice
- **Status:** ✅ Set in Production

Optional but useful for future studio or control-plane integration:

```
CLAWD_CONTROL_PLANE_URL=https://...
CLAWD_CONTROL_PLANE_TOKEN=...
```
- **Why:** Lets the repo delegate generation to a shared control-plane endpoint when needed
- **Status:** optional, not required for the current wow-first roadmap

## Already Set (Verified in Vercel Production)

```
DATABASE_URL=postgresql://...
AUTH_SECRET=xxxxx
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REFRESH_TOKEN=xxxxx
GEMINI_API_KEY=xxxxx
OPENAI_API_KEY=xxxxx
ELEVENLABS_API_KEY=xxxxx
ELEVENLABS_VOICE_ID=xxxxx
FROM_EMAIL=xxxxx
FROM_NAME=xxxxx
NEXTAUTH_URL=https://modex-gtm.vercel.app
CRON_SECRET=xxxxx
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
| `RESEND_WEBHOOK_SECRET` | Unknown from current CLI check | Webhook verification | Signature enforcement may be incomplete |
| `NEXT_PUBLIC_APP_URL` | ✅ Production | Public links and metadata | Wrong URLs in previews and emails |
| `DATABASE_URL` | ✅ | Data storage | App broken |
| `AUTH_SECRET` | ✅ | Session auth | Login broken |
| `GEMINI_API_KEY` | ✅ Production | Primary AI generation | AI generation falls back or fails |
| `OPENAI_API_KEY` | ✅ Production | AI fallback generation | Less resilient generation path |
| `ELEVENLABS_API_KEY` | ✅ Production | Narration and voice previews | Audio features unavailable |
| `ELEVENLABS_VOICE_ID` | ✅ Production | Default narrator voice | Audio falls back to a default or fails |

---

## Test Setup

Run this after adding env vars:

```bash
# Send test emails (replace with your email)
TEST_EMAIL=your-email@example.com npx ts-node scripts/send-test-emails.ts

# Visit analytics
open https://modex-gtm.vercel.app/analytics/emails
```
