# YardFlow Email Standards (A+ Grade)
*v2.0 — 2026-03-30*

---

## Goal
Book meetings. Accelerate deal cycles. Fill the hopper.

---

## The Gold Standard

**Reference email: 6932c248-150c-493c-91c7-3f0f26f30246** (Jonathan Ness, General Mills)

This email defines what A+ looks like:
- Opens with first name only
- ONE sentence to acknowledge context
- ONE paragraph of company-specific operational insight that shows you studied their business
- ONE sentence value prop tied directly to the insight
- ONE soft CTA ("Worth 10 minutes?")
- Sign with first name only
- Clean signature block

Every email we send should aspire to this.

---

## Email Signature Standard (CANONICAL — use exactly this)

```
Casey Larkin
GTM Lead · YardFlow by FreightRoll
The First Yard Network System. Deterministic throughput across every facility.
yardflow.ai  |  Run ROI  |  Book a Network Audit
```

**Color:** `#0e7490` (teal — not green #00A67E)
**Booking link:** `https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW`
**Tagline em dash:** Use period (`.`) not em dash (`—`) to match templates.ts

**CAN-SPAM Footer:**
```
FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104
[Unsubscribe link]
```

**NEVER use:**
- "Business Development" (correct title is "GTM Lead")
- "DWTB?! Studios" anywhere
- Calendly links (use Google Calendar link above)
- `yardflow.ai/demo` (page doesn't exist)
- Green `#00A67E` (use teal `#0e7490`)
- Fake ROI numbers ($200K+, etc.) not grounded in real customer data

---

## HTML Template (Canonical — matches templates.ts)

Use `src/lib/email/templates.ts` `wrapHtml()` for all sends through the app.

For scripts (`batch-follow-up.ts`, `follow-up-sender.ts`), use this exact template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>YardFlow - {{COMPANY}}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;">
<tr><td style="padding:32px 24px 24px;color:#1a1a1a;font-size:15px;line-height:1.75;letter-spacing:-0.01em;">
  {{BODY}}
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
      <span style="color:#d1d5db;margin:0 6px;">|</span>
      <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" style="color:#0e7490;text-decoration:none;font-weight:500;">Book a Network Audit</a>
    </p>
  </td></tr></table>
</td></tr>
<tr><td style="padding:0 24px 24px;border-top:1px solid #f0f0f0;">
  <p style="margin:8px 0 0;font-size:10px;color:#9ca3af;line-height:1.5;">
    FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104<br/>
    <a href="{{UNSUBSCRIBE_URL}}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
  </p>
</td></tr>
</table>
</body>
</html>
```

**Unsubscribe URL:** Always use `NEXT_PUBLIC_APP_URL` env var or fall back to `https://modex-gtm.vercel.app`.
Do NOT hardcode the URL.

---

## Resend Insights: Known Issues & Status

From Resend's deliverability inspector on email 6932c248:

| Issue | Status | Action |
|-------|--------|--------|
| "Ensure link URLs match sending domain" | Known, low priority | Unsubscribe link goes to `modex-gtm.vercel.app` but email is from `yardflow.ai`. Fix by adding custom domain `app.yardflow.ai` → Vercel, or accept as is |
| "Include valid DMARC record" | **Action required** | Ask Chris to add: `Type: TXT | Name: _dmarc | Value: v=DMARC1; p=none; rua=mailto:casey@yardflow.ai` |
| Disable click tracking | ✅ Doing great | Keep disabled |
| Disable open tracking | ✅ Doing great | Keep disabled |
| Include plain text version | ✅ Doing great | Keep as is |

---

## Subject Line Standards

### DO:
- Under 50 characters
- Use their company name or first name
- Reference something specific (event, role, product, timing)
- "Re:" only when actually threading a reply
- Question format works well ("Who owns the yard at Conagra?")

### DON'T:
- ALL CAPS or excessive punctuation
- "Quick question" as a body opener (acceptable in subject lines only — see note below)
- "Following up" (generic, spam filter flag)
- "Just wanted to check in"

**Note on "Quick question":** Acceptable in subject lines (e.g., `{first_name}, quick yard question`) because subject line psychology differs. In body copy, open directly with the question — the preamble "Quick question." adds zero value and is overused.

### Examples (from initial campaign — these worked):
- `{first_name}, quick yard question`
- `Cold chain gap between {company}'s gate and dock`
- `Who owns the yard at {company}?`
- `{first_name} - MODEX April 14?`
- `The 6-hour blind spot in {company}'s cold chain`
- `Yard throughput at General Mills`
- `{first_name} — saw the CAGNY presentation`

---

## Email Tone & Voice

### DO:
- Personal: first name, company name, specific operational detail
- **Question-forward**: open with a question that shows you know their world
- Insight-led: share something about *their* business, not yours
- Conversational: write like a human, not a marketing template
- Short graphs: 2-3 sentences max, 4-5 paragraphs max
- Under 120 words in body
- Single clear CTA: one ask, specific timeframe

### DON'T:
- Generic openers ("I hope this email finds you well")
- Claim specific ROI numbers you cannot prove (no "$200K+," "15-20%," etc.)
- List features / bullet points in cold outreach
- Multiple CTAs
- Walls of text
- Banned phrases (see below)

### Banned Phrases:
```
reach out, leverage, utilize, facilitate, streamline, landscape, ecosystem,
synergy, bandwidth, circle back, touch base, move the needle, low-hanging fruit,
deep dive, paradigm, holistic, robust, cutting-edge, game-changer, quick question
(as opener), just following up, I wanted to, I hope this finds you
```

---

## Follow-Up Strategy: Apology + Olive Branch

### Context
Initial emails may not have reached recipients due to a DMARC configuration issue (now resolved).
Re-engage professionally. One sentence acknowledgement, then lead with new value.

### Apology framing: DO
> "My earlier note may not have reached you — we resolved a technical issue on our end last week."

### Apology framing: DON'T
> "Sorry I landed in your spam" / "deliverability hiccup" / "got buried"

---

## Template: Tier 1 Follow-Up (Named Accounts — Deep Personalization)

**Research required:** 5-10 min per email. Must include company-specific insight.
**Sources:** 10-K, earnings calls, CAGNY, press releases, LinkedIn, company website.

```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

[COMPANY-SPECIFIC INSIGHT — 2-3 sentences. Reference a real complexity:
 acquisition, product line mix, cold chain requirements, facility footprint,
 public statement, specific operational challenge. Make them think
 "how did they know that?"]

Would 15 minutes make sense to see if the math applies?

Casey
```

### Tier 1 Account Examples:

**General Mills (Jonathan Ness reference, ID: 6932c248):**
```
Jonathan,

Following up on my earlier email about yard operations at General Mills.

The more I look at your portfolio, the more interesting the challenge becomes.
Cheerios is high-cube, low-weight. Haagen-Dazs needs cold chain speed, every
minute at the dock counts. Blue Buffalo is dense and heavy. Each category has a
different yard profile but the same problem: the production line can't outrun
the outbound dock.

We built a system that matches dock capacity to production output in real time.
Worth 10 minutes before MODEX next week?

Casey
```

**Frito-Lay:**
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

Running DSD at Frito-Lay's velocity means the yard isn't a parking lot — it's a live
sequencing problem that resets dozens of times a day. That's where most of the recoverable
throughput hides, and where most YMS tools fall apart.

Would 15 minutes make sense to see how we're solving this?

Casey
```

**Campbell Soup:**
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

After the Sovos acquisition you're now running shelf-stable and refrigerated on the same
yard infrastructure. That's a complexity multiplier — two different velocity profiles, two
different cold chain requirements, one yard team trying to orchestrate it all.

That's where WMS visibility typically ends and throughput leaks begin.

Worth 15 minutes?

Casey
```

---

## MODEX 2026 Urgency (Active: now through April 16)

**MODEX is April 13-16 in Atlanta.** Every CTA should reference it through April 16.
Default Tier 2 CTA: "Worth 15 minutes before MODEX?" — beats "Would 15 minutes make sense?" on urgency.

### MODEX Pre-Event Template (2 weeks out):
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

We're at MODEX April 13-16 in Atlanta. Given [one sentence company/vertical-specific insight],
I think there's a specific conversation worth having before then.

Worth 15 minutes this week?

Casey
```

### MODEX At-Event / Floor Request:
```
[First Name],

We're at MODEX this week in Atlanta. [One sentence on what you want to show them,
tied to their operation.]

Fifteen minutes on the floor?

Casey
```

---

## Template: Tier 1 First Touch (No Prior Contact)

If the contact has never been emailed, omit the apology sentence. Structure is otherwise identical.

```
[First Name],

[COMPANY-SPECIFIC INSIGHT — 2-3 sentences. Make them think "how did they know that?"]

[ONE sentence value prop tied directly to the insight.]

Worth [X] minutes before MODEX?

Casey
```

### Example (General Mills — first touch reference):
```
Jonathan,

The more I look at General Mills' portfolio, the more interesting the challenge becomes.
Cheerios is high-cube, low-weight. Haagen-Dazs needs cold chain speed, every minute at
the dock counts. Blue Buffalo is dense and heavy. Each category has a different yard
profile but the same problem: the production line can't outrun the outbound dock.

We built a system that matches dock capacity to production output in real time.
Worth 10 minutes before MODEX?

Casey
```

---

## Template: Tier 2 First Touch (No Prior Contact)

Same as Tier 2 Follow-Up templates but drop the apology opener. Open directly with the insight or question.

Example (Manufacturing):
```
[First Name],

If I asked [Company]'s dock team what's sitting in the yard right now, could they tell
me in under 60 seconds?

At most sites the answer is no. That gap — between gate and dock awareness — is where
throughput leaks hide. Worth 15 minutes before MODEX?

Casey
```

---

## Template: Tier 2 Follow-Up (Vertical-Specific, Efficient)

**Research required:** 2-3 min. Must have first name, company name, and industry/vertical.
**Rule:** Never claim a specific ROI number you can't support with data.

Pick the template that best matches their vertical:

### Food & Beverage:
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

How does [Company] track reefer dwell time in the yard right now? Most food operations
don't have a clean answer — the yard is the one place where cold chain visibility goes dark.

That's the gap we close. Worth 15 minutes before MODEX?

Casey
```

### CPG / Retail:
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

When [Company] has trailers stacking up and retail appointment windows closing, how does
the yard team prioritize?

That decision — made manually, dozens of times a day — is what determines whether you make
the window or pay detention. Worth 15 minutes to see how we automate it?

Casey
```

### Manufacturing / Industrial:
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

If I asked [Company]'s dock team what's sitting in the yard right now, could they tell me
in under 60 seconds?

At most sites the answer is no. That gap — between gate and dock awareness — is where
throughput leaks hide. Worth 15 minutes before MODEX?

Casey
```

### Distribution / 3PL:
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

In a cross-dock operation, the bottleneck usually isn't the sort — it's the 30 minutes
between a trailer hitting the gate and anyone knowing it's ready to unload.

That dead window is where throughput leaks. It's also where we find the most room to
recover. Worth 15 minutes?

Casey
```

### Automotive / Heavy Manufacturing (JIT):
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

When an inbound parts trailer hits [Company]'s gate, how long before the dock team
knows it's there?

That gap is where JIT breaks down. We fix it with real-time gate-to-dock visibility —
no hardware install, works on day one. Worth 15 minutes before MODEX?

Casey
```

### Pharma / Life Sciences:
```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

GDP compliance doesn't pause in the yard. When a temperature-sensitive trailer sits at
the gate for four hours, that's audit exposure — and most teams don't have a timestamped
record to show for it.

We give you that record. Would 15 minutes make sense?

Casey
```

---

## Tier Definitions

| Tier | Who | Research | Template |
|------|-----|----------|----------|
| 1 | Named accounts: General Mills, Frito-Lay, Diageo, Coca-Cola, Campbell's, AB InBev, Hormel, Constellation, Dannon | 5-10 min — company-specific insight required | Deep personalization template above |
| 2 | All others — by vertical | 2-3 min — identify vertical | Vertical-specific template from section above |

---

## Personalization Research by Tier

### Tier 1 — Required for each send:
- Company-specific complexity, recent acquisition, product line mix
- Earnings call / CAGNY quotes that reveal priorities
- Facility footprint (number of DCs, plant types)
- Public news: capacity expansions, new product lines, M&A

### Tier 2 — Required:
- Correct vertical classification (food_bev / cpg_retail / auto_heavy / industrial / distribution / pharma)
- Verify first name
- Verify company name (avoid parent company confusion)

---

## Vertical Classification Guide

| Industry | Vertical | Template to Use |
|----------|----------|-----------------|
| Food & Beverages, Wine & Spirits, Dairy, Food Production | food_bev | Food & Beverage |
| Consumer Goods, Retail, CPG, Apparel, Cosmetics | cpg_retail | CPG / Retail |
| Automotive, Aerospace, Defense | auto_heavy | Automotive / JIT |
| Building Materials, Chemicals, Mining, Plastics, Packaging | industrial | Manufacturing / Industrial |
| Wholesale, Warehousing, Import/Export | distribution | Distribution / 3PL |
| Pharmaceuticals, Biotech, Medical Devices | pharma | Pharma / Life Sciences |
| All others | general_mfg | Manufacturing / Industrial |

---

## Quality Checklist (Before Every Send)

### Content:
- [ ] First name is present and correct
- [ ] Company name is accurate (not wrong parent/subsidiary)
- [ ] Uses vertical-appropriate template (Tier 2) OR company-specific insight (Tier 1)
- [ ] No unverified ROI/dollar claims
- [ ] No banned phrases
- [ ] Single, clear CTA
- [ ] Subject line under 50 characters
- [ ] Body under 120 words

### Technical:
- [ ] Not in unsubscribe list
- [ ] Email has not hard-bounced previously
- [ ] Correct signature (GTM Lead · YardFlow by FreightRoll)
- [ ] Title: GTM Lead (not "Business Development")
- [ ] Color: `#0e7490` teal (not `#00A67E` green)
- [ ] Booking link: Google Calendar (not Calendly, not yardflow.ai/demo)
- [ ] Unsubscribe link uses NEXT_PUBLIC_APP_URL env var (not hardcoded)
- [ ] No DWTB branding anywhere

### Timing:
- [ ] Not emailed in last 5 business days
- [ ] Check for major company news/crisis

### Compliance:
- [ ] Physical address in footer (FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104)
- [ ] Unsubscribe link functional

---

## Metrics Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Delivery rate | >95% | Fixed with DKIM; improve with DMARC |
| Open rate | 25-30% | Cold outreach to F500 |
| Reply rate | 2-5% | Excellent if >5% |
| Meeting book rate | >1% of sends | Key metric |

---

## Process: Follow-Up Execution

1. **Query** eligible contacts (delivered 2+ days ago, no follow-up sent, not bounced)
2. **Segment** by tier (Tier 1 named accounts vs. everyone else)
3. **Classify** Tier 2 contacts by vertical
4. **Research** Tier 1 accounts (5-10 min each — public info only)
5. **Draft** using template for their tier + vertical
6. **Review** against checklist above
7. **Send** with 4-6 sec delays between emails (respect Resend rate limits)
8. **Log** in `email_logs` table with `status = 'sent'`
9. **Monitor** delivery in Resend dashboard

---

## Key Contacts & Infrastructure

| What | Where |
|------|-------|
| Resend dashboard | resend.com/emails |
| Resend webhook | `https://modex-gtm.vercel.app/api/webhooks/email` ✅ Configured |
| Booking link | Google Calendar (see signature section above) |
| DNS (Cloudflare) | Managed by Chris @ FreightRoll — **yardflow.ai nameservers confirmed on Cloudflare, NOT Vercel** |
| DMARC record needed | Ask Chris: `TXT _dmarc.yardflow.ai: v=DMARC1; p=none; rua=mailto:casey@yardflow.ai` |

---

*v2.0 approved 2026-03-30*
