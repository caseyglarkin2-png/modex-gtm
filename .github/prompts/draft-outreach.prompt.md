---
description: "Draft personalized outreach for a specific account and persona. Use when: writing cold emails, follow-ups, LinkedIn DMs, or call scripts for YardFlow target accounts. Pulls account brief, persona context, and wave intel to craft targeted messaging."
---

# Draft Outreach — {{account}} → {{persona}}

## Instructions

1. **Gather context** for this account:
   - Read the meeting brief from `meeting_briefs` table (why this account, why now, likely pain, primo relevance)
   - Read the persona details (title, priority, role_in_deal, persona_lane)
   - Check the account's outreach_waves for timing and channel mix
   - Check email_logs for any prior sends to this persona (don't repeat yourself)

2. **Draft the outreach** following these principles:
   - **Under 150 words** — executives skim, not read
   - **Open with their world**, not yours: reference their new role, their company's challenge, MODEX context
   - **The yard is the constraint** — anchor on the invisible dock bottleneck
   - **Specific ask**: "15 minutes at MODEX Tuesday April 14?" or "Quick call before the show?"
   - **No jargon**: Say "yard" not "yard management system". Say "dock bottleneck" not "logistics friction"
   - **P.S. line**: Include a proof point ($1M profit lift, 48→24 min drop-and-hook)

3. **Output format**:

```
## Email Draft
**To:** [persona email]  
**Subject:** [compelling subject line — under 8 words]

[Body — under 150 words]

---
**Sending notes for Casey:**
- Best send time: [day/time based on persona's timezone]
- Follow-up if no reply by: [date]
- Alternative channel if email bounces: [LinkedIn DM / call]
- Dannon check: [SAFE or BLOCKED — warm intro only]
```

4. **HARD CHECK**: If account is Dannon/Danone, STOP. Output: "⚠️ DANNON = WARM INTRO ONLY via Mark Shaughnessy. Draft a warm intro request to Mark instead."
