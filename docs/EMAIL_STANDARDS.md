# YardFlow Email Standards (A+ Grade)

## Goal
Book meetings. Accelerate deal cycles. Fill the hopper.

---

## Email Signature Standard

```
Casey Larkin
Business Development · YardFlow by FreightRoll
M: (512) 818-2819 · LinkedIn

The yard network system — predictable throughput across every facility.

yardflow.ai  |  ROI Calculator  |  Book a Call
```

**CAN-SPAM Footer (small, muted):**
```
Unsubscribe · FreightRoll Inc. · Austin, TX
```

**NEVER use:**
- "DWTB?! Studios" in YardFlow emails
- "GTM Lead" or any internal jargon
- Generic links without context
- Missing phone number

---

## Subject Line Standards

### DO:
- Keep under 50 characters
- Use their company name when possible
- Reference something specific (event, role, timing)
- "Re:" only if actually threading a reply

### DON'T:
- ALL CAPS
- Exclamation points
- "Quick question" (overused, triggers spam filters)
- "Following up" (generic, low open rate)

### Examples:
- "Yard throughput at General Mills"
- "[First Name] — saw the CAGNY presentation"
- "15 min on yard dwell time?"
- Re: [Original Subject] (when threading)

---

## Email Tone & Voice

### DO:
- **Personal** - Use their first name, reference their company, role, recent events
- **Specific** - Cite real data points (CAGNY quote, Blue Buffalo acquisition, facility count)
- **Value-first** - Lead with insight they don't have, not with your product
- **Conversational** - Write like a human, not a marketing template
- **Short grafs** - 2-3 sentences max per paragraph
- **Clear CTA** - One ask, specific timeframe ("Would 15 minutes make sense?")

### DON'T:
- Generic "Hi," without name
- "Companies like [Company]" when you know their company
- Template language ("bumping this to the top")
- Multiple CTAs
- Walls of text
- Jargon without context

---

## Follow-Up Strategy: The Apology + Olive Branch

### Context
Previous emails may not have reached recipients due to technical issues (now fixed). We re-engage with professionalism.

### Apology Language (Professional, not casual)

**DO:** "My earlier note may not have reached you — we resolved a technical issue on our end last week."

**DON'T:** "Landed in your spam folder" / "deliverability hiccup" / "got buried"

---

## Template: Tier 1 Follow-Up (High Personalization)

**Research time:** 5-10 min per email
**Required:** Company-specific insight (acquisition, earnings call, facility footprint)

```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

Quick context: I've been studying yard throughput patterns across CPG distribution networks.

For [Company] specifically, [PERSONALIZED INSIGHT - 2-3 sentences about their unique situation].

Would 15 minutes make sense to see if the math applies?

Casey
```

### Example (General Mills):

```
Paul,

My earlier note may not have reached you — we resolved a technical issue on our end last week.

Quick context: I've been studying yard throughput patterns across CPG distribution networks.

For General Mills specifically, the complexity caught my attention — 30+ US plants, the Blue Buffalo cold chain layer, and the pet food DC network running on different velocity profiles than your legacy cereal lines. That's where the yard becomes the hidden bottleneck between WMS and TMS.

Would 15 minutes make sense to see if the math applies?

Casey
```

---

## Template: Tier 2 Follow-Up (Efficient but Personal)

**Research time:** 2-3 min per email
**Required:** Industry insight, company name, first name

```
[First Name],

My earlier note may not have reached you — we resolved a technical issue on our end last week.

Short version: YardFlow maps the 15-20% of dwell time that lives between gate and dock — the part WMS and TMS don't see.

For a network like [Company]'s, that usually translates to $200K+ annually in recoverable throughput.

Would 15 minutes make sense to take a look?

Casey
```

---

## Personalization Research by Tier

### Tier 1 (Dannon, Frito-Lay, General Mills, Coca-Cola, Diageo, Campbell's, Constellation, Hormel, AB InBev)
- **Must include:** Company-specific insight
- **Research sources:** 10-K, earnings calls, CAGNY presentations, press releases, LinkedIn
- **Example hooks:**
  - "At CAGNY you said 'supply chain is our competitive advantage'"
  - "The Blue Buffalo integration alone added a pet food supply chain..."
  - "With 30+ US plants and 4 distinct logistics profiles..."

### Tier 2 (JM Smucker, TreeHouse, Conagra, Berry Global, etc.)
- **Must include:** Industry-relevant insight, first name, company name
- **Research sources:** Company website, recent news, facility count
- **Example hooks:**
  - "For a network your size..."
  - "At your facility footprint..."

### Tier 3 (3PLs, logistics tech, smaller operators)
- **Must include:** First name, company name, relevant use case
- **Research sources:** LinkedIn, company about page

---

## HTML Email Template (Outlook-Safe, Inline Styles)

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>YardFlow</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a;">

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px;">
    <tr>
      <td>
        {{BODY_CONTENT}}
      </td>
    </tr>
    <tr>
      <td style="padding-top: 24px; border-top: 1px solid #e5e5e5;">
        <strong style="color: #1a1a1a;">Casey Larkin</strong><br/>
        <span style="font-size: 14px; color: #333;">Business Development · YardFlow by FreightRoll</span><br/>
        <span style="font-size: 13px; color: #666; font-style: italic;">The yard network system — predictable throughput across every facility.</span><br/>
        <span style="font-size: 13px;">
          <a href="https://yardflow.ai" style="color: #00A67E;">yardflow.ai</a> ·
          <a href="https://yardflow.ai/roi" style="color: #00A67E;">ROI Calculator</a> ·
          <a href="https://calendly.com/casey-yardflow" style="color: #00A67E;">Book a Call</a>
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 16px; font-size: 11px; color: #999;">
        <a href="{{UNSUBSCRIBE_URL}}" style="color: #999;">Unsubscribe</a> · FreightRoll Inc. · Austin, TX
      </td>
    </tr>
  </table>

</body>
</html>
```

---

## Quality Checklist (Before Every Send)

### Content:
- [ ] First name is present and spelled correctly
- [ ] Company name is accurate (not parent company if targeting subsidiary)
- [ ] At least one company-specific insight (Tier 1) or industry insight (Tier 2/3)
- [ ] Single, clear CTA
- [ ] Subject line under 50 characters
- [ ] No spam trigger words (free, guarantee, act now, limited time)

### Technical:
- [ ] Recipient has not unsubscribed
- [ ] Email address has not hard-bounced previously
- [ ] Correct signature (Business Development · YardFlow by FreightRoll)
- [ ] Unsubscribe link is functional
- [ ] Links are not broken
- [ ] No DWTB branding

### Timing:
- [ ] Recipient hasn't been emailed in last 5 business days
- [ ] Check for major company news/crisis before sending

### Compliance:
- [ ] Physical address present
- [ ] CAN-SPAM compliant

---

## Metrics Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Delivery rate | >95% | Fixed with DKIM |
| Open rate | 25-30% | Cold outreach to F500 |
| Reply rate | 2-3% | Excellent if >5% |
| Meeting book rate | >1% of sends | Key metric |

---

## Process: Follow-Up Execution

1. **Query** eligible contacts (delivered 2+ days ago, no follow-up sent)
2. **Segment** by tier
3. **Research** Tier 1 accounts (5-10 min each)
4. **Draft** personalized copy using templates above
5. **Review** against checklist
6. **Send** with 4-6 sec delays between emails
7. **Log** in database
8. **Monitor** delivery in Resend dashboard

---

*Approved v1.0 - 2026-03-30*
