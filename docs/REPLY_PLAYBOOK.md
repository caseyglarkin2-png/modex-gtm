# Reply Playbook
*How to handle every type of reply from cold outreach*

---

## Response Time Rule
Reply within 2 hours during business hours. Momentum dies fast in cold outreach.

---

## Reply Type 1: "Yes, let's talk" / Positive Interest

**Signs:** "I'd be open to a call", "Happy to connect", "Send me more info and let's schedule"

**Response:**
```
[First Name],

Great — here's a link to grab 30 minutes:
[BOOKING LINK]

If the calendar is easier, I'm also free [2 specific time slots this week].

Looking forward to it.

Casey
```

**In app:** Update account `outreach_status` → "In Conversation", `meeting_status` → "Scheduled" once booked. Create Meeting Brief in Studio.

---

## Reply Type 2: "I'll be at MODEX" / Conference Interest

**Signs:** "I'll be at MODEX", "We're attending", "Let's find time at the show"

**Response:**
```
[First Name],

Perfect. We're in [Hall/location if known] — easy to swing by.

What day works best for you? I have open slots [Day 1 and 2] in the afternoon.

Alternatively, grab a floor slot here: [BOOKING LINK]

Casey
```

**In app:** Tag account with MODEX signal, set meeting_status → "Scheduled"

---

## Reply Type 3: "Send more info" / Soft positive

**Signs:** "Can you send a deck?", "Send me your ROI calculator", "Tell me more about how it works"

**Response:**
```
[First Name],

Sure — here's the quickest way to get the picture:

ROI calculator (takes 2 min): https://yardflow.ai/roi
Book a 20-minute walkthrough: [BOOKING LINK]

Happy to walk through the ROI calc together on a call — that usually makes the numbers more specific to your footprint.

Casey
```

**Do NOT send a deck over email unsolicited.** The ROI calc + walkthrough CTA is the correct move.

---

## Reply Type 4: "Not now / Follow up later"

**Signs:** "Reach out in Q3", "We're in the middle of a project", "Bad timing, try me in [month]"

**Response:**
```
[First Name],

Understood — I'll check back in [month]. If anything changes before then, you know where to find me.

Casey
```

**In app:** Set `next_action` to follow-up date, `outreach_status` → "Nurture". Add activity note with the specific date they gave you.

---

## Reply Type 5: "Wrong person — contact [Name]"

**Signs:** "You want to talk to [Name]", "This should go to our VP of Logistics", "Not my area — try [email]"

**Response to referrer:**
```
[First Name],

Thank you — that's really helpful. I'll reach out to [Name] directly.

Casey
```

**Immediately:** Look up the new contact on LinkedIn, verify email, add to personas, send first-touch email with the referring person's name as social proof:

```
[New Contact First Name],

[Referrer Name] at [Company] suggested I reach out to you directly — figured it was better to come to you first than work my way around.

[Vertical-specific insight paragraph]

Worth 15 minutes before MODEX?

Casey
```

**In app:** Add new persona, log referral in notes, set `outreach_status` → "In Conversation" for original contact.

---

## Reply Type 6: "Not interested" / Hard No

**Signs:** "Not for us", "We already have a solution", "Doesn't apply to our business"

**Response:**
```
[First Name],

Understood — appreciate you letting me know.

If the operation ever changes or you find yourself evaluating yard management again, happy to reconnect.

Casey
```

**Do NOT:** Argue, ask "why not?", or push back. One gracious exit.

**In app:** `outreach_status` → "Not interested", no further sequence.

---

## Reply Type 7: "Remove me / Unsubscribe"

**Signs:** "Take me off your list", "Please don't email me again", "Unsubscribe"

**Response:**
```
[First Name],

Done — you're removed. Apologies for the interruption.

Casey
```

**In app immediately:** Run the unsubscribe API or manually add to UnsubscribedEmail table. This is legally required under CAN-SPAM within 10 business days (do it same day).

```bash
# Manual suppression if needed
node -e "
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
prisma.unsubscribedEmail.create({ data: { email: 'EMAIL_HERE' } })
  .then(() => console.log('Suppressed'))
  .finally(() => prisma.\$disconnect());
"
```

---

## Reply Type 8: Out of Office / Auto-reply

**Do nothing.** Wait until they're back. If the OOO says "back on [date]", set a reminder to follow up then.

---

## Reply Type 9: Hard bounce / Delivery failure notice

**In app:** Find the email log, mark as bounced. Run:
```bash
node -e "
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
prisma.emailLog.updateMany({
  where: { to_email: 'EMAIL_HERE' },
  data: { status: 'bounced' }
}).then(r => console.log('Marked bounced:', r.count)).finally(() => prisma.\$disconnect());
"
```

---

## Meeting Booked — What Now?

1. Send calendar confirmation (auto from Google Calendar)
2. Create Meeting Brief in app Studio 24 hours before
3. Research: check their latest earnings call, any public company news from last 30 days
4. Have ROI calc ready with their rough facility footprint (# of doors, trailer volume) pre-filled
5. Goal of meeting: get to a second meeting or pilot conversation

---

## Meeting Brief Prep Checklist

- [ ] Their title and tenure at current company
- [ ] Company news in last 90 days (acquisition, expansion, earnings)
- [ ] Estimate: # of DCs, trailer volume, facility types
- [ ] Their specific vertical pain (from which template they responded to)
- [ ] 3 questions to ask them
- [ ] One specific customer story or data point relevant to their vertical

---

*Created: 2026-03-30 · Update when new reply patterns emerge*
