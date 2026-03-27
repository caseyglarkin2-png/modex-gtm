---
description: "Generate a daily action plan for YardFlow pipeline execution. Checks current pipeline state, identifies gaps, and produces a prioritized task list split between agent-automatable and human-required actions."
---

# Daily GTM Sprint Plan

Today is {{date}}. MODEX 2026 is April 13-16. Every day counts.

## Instructions

1. **Pull current pipeline state** from the database:
   - How many accounts have been contacted? (`outreach_status != 'Not started'`)
   - How many meetings are booked? (`meeting_status != 'No meeting'`)
   - How many emails sent? What's the open/click rate?
   - Any accounts with email opens but no meeting? (These are HOT — prioritize follow-up)

2. **Identify the biggest gaps**:
   - Wave 1 accounts (General Mills, Frito-Lay, Diageo, Hormel, JM Smucker, Home Depot, Georgia Pacific, H-E-B) that haven't been contacted yet
   - Band A/B accounts with no outreach
   - Accounts where emails were opened but no reply received (warm → follow up TODAY)

3. **Build the action plan** using this format:

```
## Pipeline Snapshot
- Days until MODEX: X
- Accounts contacted: X/20
- Meetings booked: X
- Emails sent: X | Opens: X% | Clicks: X%
- Hot leads (opened, no meeting): [list]

## Casey's Top 5 Actions Today
1. [Action] — [Account] — [Persona] — [Why now] — Est: X min
2. ...

## I'll Draft Right Now
- [ ] Email draft for [Account] → [Persona]
- [ ] Follow-up for [Account] (opened email X days ago)
- [ ] Meeting prep for [Account] (meeting on [date])
- [ ] LinkedIn DM for [Persona] at [Account]

## This Week's Pipeline Targets
- Move [X] accounts from "Not started" → "Contacted"
- Book [X] meetings
- Send [X] follow-ups on opened emails
```

4. **Remember**: Dannon = warm intro only (Mark Shaughnessy). Never include in cold outreach lists.

5. **Be honest**: If pipeline is behind, say so. Calculate the math — X meetings needed, Y days left, Z actions/day required.
