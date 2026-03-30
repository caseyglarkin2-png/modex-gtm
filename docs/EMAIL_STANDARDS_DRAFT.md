# YardFlow Email Standards (DRAFT)

## Goal
Book meetings. Accelerate deal cycles. Fill the hopper.

---

## Email Signature Standard

```
Casey Larkin
GTM Lead · YardFlow by FreightRoll

The First Yard Network System — deterministic throughput across every facility.

yardflow.ai  |  Run ROI  |  Book a Network Audit
```

**CAN-SPAM Footer (small, muted):**
```
Unsubscribe · FreightRoll Inc. · Austin, TX
```

**NEVER use:**
- "DWTB?! Studios" in YardFlow emails
- "GTM @ YardFlow" (use "GTM Lead · YardFlow by FreightRoll")
- Generic links without context

---

## Email Tone & Voice

### DO:
- **Personal** - Use their first name, reference their company, role, recent events
- **Specific** - Cite real data points (CAGNY quote, Blue Buffalo acquisition, facility count)
- **Value-first** - Lead with insight they don't have, not with your product
- **Conversational** - Write like a human, not a marketing template
- **Short grafs** - 2-3 sentences max per paragraph
- **Clear CTA** - One ask, specific timeframe ("Worth 20 minutes to see the math?")

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
Previous emails may have landed in spam due to DMARC/SPF issues. We've fixed this. Now we re-engage with honesty.

### Template Framework

**Subject:** Re: [Original Subject] (keeps threading)

**Body Structure:**
1. **Acknowledge** - Brief honest note about deliverability issue
2. **Re-introduce value** - One specific insight about their business
3. **Soft CTA** - Low-commitment ask

### Example (Tier 1 - High Personalization):

```
[First Name],

Fair chance my last email landed in your spam folder — we had a deliverability hiccup on our end that's now fixed.

Quick re-intro: I've been mapping yard throughput for CPG distribution networks.
[COMPANY-SPECIFIC INSIGHT - e.g., "Given General Mills' 30+ US plants plus the Blue Buffalo cold chain complexity, the yard becomes the hidden bottleneck between WMS and TMS."]

Worth 15 minutes to see if the math applies to your network?

Casey

---
Casey Larkin
GTM Lead · YardFlow by FreightRoll

The First Yard Network System — deterministic throughput across every facility.

yardflow.ai  |  Run ROI  |  Book a Network Audit
```

**Unsubscribe · FreightRoll Inc. · Austin, TX**

---

### Example (Tier 2 - Efficient but Personal):

```
[First Name],

My last note may have hit spam — we had a technical issue on our end that's now sorted.

Short version: YardFlow maps the 15-20% of dwell time that lives between gate and dock — the part WMS and TMS don't see.

For a network like [Company]'s, that usually translates to $200K+ annually in recoverable throughput.

Worth a 15-minute look?

Casey

---
Casey Larkin
GTM Lead · YardFlow by FreightRoll

The First Yard Network System — deterministic throughput across every facility.

yardflow.ai  |  Run ROI  |  Book a Network Audit
```

**Unsubscribe · FreightRoll Inc. · Austin, TX**

---

## Personalization Requirements by Tier

### Tier 1 (Dannon, Frito-Lay, General Mills, Coca-Cola, Diageo, etc.)
- **Must include:** Company-specific insight (acquisition, earnings call quote, facility footprint)
- **Research time:** 5-10 min per email
- **Tone:** Executive-level, insight-driven
- **Example hooks:**
  - "At CAGNY you said 'supply chain is our competitive advantage'"
  - "The Blue Buffalo integration alone added a pet food supply chain..."
  - "With 30+ US plants and 4 distinct logistics profiles..."

### Tier 2 (Mid-market CPG, regional players)
- **Must include:** Industry-relevant insight, company name, first name
- **Research time:** 2-3 min per email
- **Tone:** Friendly, value-focused
- **Example hooks:**
  - "For a network like [Company]'s..."
  - "At your facility footprint..."

### Tier 3 (3PLs, logistics tech)
- **Must include:** First name, company name, relevant use case
- **Research time:** 1-2 min
- **Tone:** Peer-to-peer, technical credibility

---

## HTML Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
    }
    p { margin: 0 0 16px; }
    a { color: #00A67E; }
    .signature {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #333;
    }
    .signature strong { color: #1a1a1a; }
    .tagline {
      font-size: 13px;
      color: #666;
      font-style: italic;
      margin: 8px 0;
    }
    .links {
      font-size: 13px;
      margin-top: 8px;
    }
    .links a { margin-right: 12px; }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #999;
    }
  </style>
</head>
<body>
  {{BODY_CONTENT}}

  <div class="signature">
    <strong>Casey Larkin</strong><br>
    GTM Lead · <strong style="color: #00A67E;">Yard</strong>Flow by FreightRoll
    <div class="tagline">The First Yard Network System — deterministic throughput across every facility.</div>
    <div class="links">
      <a href="https://yardflow.ai">yardflow.ai</a>
      <a href="https://yardflow.ai/roi">Run ROI</a>
      <a href="https://yardflow.ai/demo">Book a Network Audit</a>
    </div>
  </div>

  <div class="footer">
    <a href="{{UNSUBSCRIBE_URL}}" style="color: #999;">Unsubscribe</a> · FreightRoll Inc. · Austin, TX
  </div>
</body>
</html>
```

---

## Quality Checklist (Before Every Send)

- [ ] First name is present and correct
- [ ] Company name is accurate
- [ ] At least one company-specific insight (Tier 1) or industry insight (Tier 2/3)
- [ ] Single, clear CTA
- [ ] Correct signature (GTM Lead · YardFlow by FreightRoll)
- [ ] No DWTB branding
- [ ] Unsubscribe link works
- [ ] Subject line is compelling (not generic "Following up")

---

## Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Delivery rate | >95% | 69% (fixing) |
| Open rate | >40% | Unknown |
| Reply rate | >5% | Unknown |
| Meeting book rate | >1% of sends | Unknown |

---

## Process: Batch Follow-Up Execution

1. **Query** eligible contacts (delivered 2+ days ago, no reply)
2. **Segment** by tier
3. **Research** Tier 1 accounts (5-10 min each)
4. **Draft** personalized copy
5. **Review** against checklist
6. **Send** with 4-6 sec delays
7. **Log** in database with template type
8. **Monitor** delivery in Resend dashboard

---

*Draft v1 - 2026-03-30*
