---
description: "Review email engagement data and prioritize follow-ups. Use when: checking which prospects opened emails, identifying warm leads, or building a follow-up queue. Analyzes email_logs for opens/clicks without replies to surface hottest opportunities."
---

# Pipeline Review & Follow-up Prioritization

## Instructions

1. **Pull email engagement data** from `email_logs` table:
   - Which emails were opened? (status = 'opened' or 'clicked')
   - When were they opened? (opened_at timestamp)
   - Which accounts have opens but NO meeting booked? (cross-reference meetings table)
   - Any clicks? (highest intent signal)

2. **Pull pipeline status** from accounts:
   - research_status, outreach_status, meeting_status for all 20 accounts
   - Sort by priority_band (A first, then B, C, D)
   - Flag any Wave 1 accounts that are still at "Not started"

3. **Produce a prioritized follow-up list**:

```
## 🔥 HOT — Opened/Clicked, No Meeting (ACT TODAY)
| Account | Persona | Opened | Clicked | Days Since | Suggested Action |
|---------|---------|--------|---------|------------|-----------------|

## ⚡ WARM — Contacted, No Response (Follow Up This Week)
| Account | Persona | Last Sent | Channel | Suggested Follow-up |
|---------|---------|-----------|---------|-------------------|

## 🧊 COLD — Not Yet Contacted (Start Outreach)
| Account | Band | Primary Persona | Suggested First Touch |
|---------|------|----------------|---------------------|

## 📊 Funnel Math
- 20 accounts total
- X researched → X contacted → X meeting booked
- Conversion needed: X meetings from Y remaining contacts
- Days until MODEX: Z
- Required pace: [X actions/day to hit target]
```

4. **Be brutally honest** about pipeline health. If we're behind, quantify how far behind and what pace is needed to catch up.
