# Editorial style guide

The Tier-1 CPG anchor customer (237-facility network, multi-year term, displaced an incumbent yard system) is the highest-credibility flex YardFlow has and is contractually un-name-able. Right now each piece of content gets the wink right by intuition. This file makes "right by default" cheaper to maintain as more content lands.

The audience is small. Insiders will recognize the customer from descriptions; outsiders won't. Both should read the asset more carefully because they sense the specifics behind the words.

## Rules

### Never name them.

Use attribute identifiers. Pick the one that fits the surface:

- *Tier-1 CPG anchor customer*
- *the largest bottled-water producer in North America*
- *a top-3 beverage shipper*
- *a 237-facility CPG network*
- *the parent company* (when context makes it obvious)

### Geography & scale flex.

Lean on numbers. They're recognizable to CPG ops insiders without naming:

> 237 facilities · 52 factories · 185 depots · contracted, multi-year

Specific facility counts and operating-region descriptions ("Eastern seaboard manufacturing footprint," "Western depot network reorganization") do more credibility-work than vague phrases like "major CPG client."

### Visual wink.

Module Inspector screenshots are redacted — logos, plant codes, driver names, route labels — but **don't scrub the silhouettes**. Specifically:

- Iconic bottle profile in a yard photo (insiders recognize the shape)
- Recognizable plant town on a redacted shipment record (Allentown, Hollywood FL, Madison GA — the towns are public; the operator is implied)
- Brand-color band visible at the edge of a UI tab
- Driver uniform colors in field photos

The point is plausibility-deniable recognition. Insiders see the silhouette and know. Outsiders see prestige without specifics.

### Receipts > claims.

Where possible, show *redacted* artifacts instead of describing them. "Defensible Evidence" is the brand voice everywhere else; same here. A redacted shipment manifest with the dates intact and the carrier name blacked out beats a sentence claiming "we move millions of cases."

### Quotes without attribution.

Real driver and ops testimonials are usable as long as they're not tied to a named program. Format:

> "Easy to use! And great system."
> — driver, redacted CPG yard

Never include a date, a specific facility, or a job title narrow enough to identify (e.g., "transportation manager, Hollywood FL plant" is too narrow; "ops lead, redacted CPG yard" is fine).

### Field Report register can be the most overt.

Field Reports are framed as journalism. The journalism frame *requires* describing the subject, even unnamed:

> "An investigation into the largest bottled-water rebuild in North America"

reads as Bloomberg-style without ever naming the company. Use the journalism register to push specifics that would feel cagey in a memo. The convention "journalists describe subjects without naming sources" gives cover.

### Surface-by-surface guidance

| Surface | Tone | Allowed | Not allowed |
|---|---|---|---|
| `/for/{account}` per-account memo | Anti-sales, observational, citation-grounded | Attribute identifiers; numbers; comparable-network lift figures | Direct names of the anchor customer; identifying facility addresses |
| Manifesto / opinion piece | Editorial, named-and-claimed where the position is the brand's own | Named YardFlow positions; named *public* customers like Primo Brands (different from the anchor); sourced industry figures | Conflating the public Primo Brands comparable with the unnamed anchor; using their facility addresses as proof |
| Field Report | Journalistic, Bloomberg-y | Specific facility counts, geographies, time-bound rebuild details, redacted artifacts | The customer's name in any form |
| Audio brief chapter labels | Same rules as the memo body — short and observational | "What 237 facilities taught" | "What Primo taught" / "What BlueTriton taught" |
| Module Inspector screenshots | Redacted with intact silhouettes | Bottle shapes, plant-town names, brand-color hints | Logos, ID numbers, full driver names |

## The asymmetry to exploit

Every prospect in CPG ops knows there are only ~3 companies that fit "237-facility network in North America with a recent yard rebuild." Half will guess right. None will be told. All read the asset more carefully *because* of the puzzle. Don't break the puzzle by naming the answer.

## Event- and date-agnostic copy

Sales content (memos, dossiers, microsite copy, outreach templates, audio chapter labels) must read identically a week before, during, and a year after any specific industry event. Anchoring copy to a particular show, season, or date stamps the asset with a quickly-stale fingerprint and signals that the writer didn't think past the next two weeks.

**Specifically don't bake in:**

- Named upcoming or recent shows: "MODEX 2026," "CSCMP EDGE," "ProMat," "RILA LINK." If a target executive is panel-affiliated with a specific show, write *"on industry conference panels"* or *"recurring industry-conference speaker"* instead of naming the show and year.
- Date-relative timing: "next month," "in two weeks," "after the holidays," "Q4 push." Use absolute references where the timing actually matters ("after the Anchor Packaging integration closes Oct 2025"), or omit entirely.
- Imminent-meeting framing: "see you at MODEX," "we'll be in Atlanta the week of." If the meeting is a real plan, address it in the personal email; don't bake it into the durable artifact.

**What to do instead:**

- Frame outreach as event-agnostic and re-runnable: "Two reasons to talk this quarter" / "When you're ready for a working session" / "Open to a 30-minute walkthrough at your timing."
- If a specific event is unusually leverage-rich (target speaks at it, hosts a panel, won an award there), reference it as a *fact about the target* — not as a planned interaction. *"Recently spoke on the [event-name] panel about Y"* survives the event passing; *"will be at [event-name] next week"* does not.
- Section headings inside dossiers: prefer "Meeting Angle" / "Outreach Action Plan" over "MODEX 2026 Meeting Angle" / "MODEX 2026 Action Plan."
- File header: "Prepared for: YardFlow by FreightRoll — Account-Based Outreach" beats "MODEX 2026 Outreach."

**How to apply when the rule conflicts with a real, time-bound action:** the time-bound action lives in the email/Slack/meeting note, not the durable artifact. The durable artifact is the asset Casey re-reads in six months when re-engaging the same account.

**Patterns to grep for during a sweep** (these are the easy-to-miss ones — flat phrase scans usually catch the obvious "at MODEX" hits but not these):

- *"a MODEX target account"* / *"[event] target account"* — cross-references to other accounts that bake the event in. Should read "a YardFlow target account."
- Scorecard rows or signal columns named *"MODEX Signal"* / *"[event] Attendance"* — rename to *"Industry Event Signal"* / *"Conference Attendance"*.
- Narrative analysis like *"The pitch that lands at MODEX"* / *"MODEX-week priorities"* — these sit inside a paragraph about psychological framing or timing and aren't obvious in a headings-only review.
- Schema field names with event names baked in (e.g., `modexAttendance` on `AccountMicrositeData`). Rename to event-neutral (`industryEventAttendance` or just `eventAttendance`) when you touch the schema.

## Current state — leaks audited

Audited 2026-05-09 against the rules above:

Search terms run from `/mnt/c/Users/casey/modex-gtm/`:
- Direct anchor names: `BlueTriton`, `Blue Triton`, `Niagara Bottling`, `Pure Life`, `Poland Spring`
- Public comparable: `Primo` (each hit reviewed for anchor vs. comparable context)
- Facility-count signals: `237`, `237-facility`
- Anchor-associated town names: `Hollywood, FL`, `Allentown`, `Madison, GA`, `Stanwood`, `Cabazon`, `Breinigsville`

Surfaces audited: `src/lib/microsites/accounts/`, `src/lib/microsites/yns-thesis.ts`, `src/lib/microsites/`, `src/components/microsites/`, `docs/research/`

| File:line | Found | Verdict | Action |
|---|---|---|---|
| `src/lib/microsites/memo-compat.ts:150` | `'Primo Brands'` | Legitimate (public comparable) — fallback `customerName` in comparable block | None |
| `src/lib/microsites/memo-compat.ts:168` | `comparableName: 'Primo Brands'` | Legitimate (public comparable) — named comparable field | None |
| `src/lib/microsites/memo-compat.ts:184` | `/primo/i.test(...)` | Legitimate (public comparable) — matcher finding Primo proof block | None |
| `src/lib/microsites/memo-compat.ts:239–240` | `id: 'primo-q1-2025'`, `source: 'Primo Brands operating data (under NDA)'` | Legitimate (public comparable) — citation for named public customer | None |
| `src/lib/microsites/cover-letter.ts:155–162` | `'Primo Brands'` (×4) | Legitimate (public comparable) — fallback logic for cover letter comparable name | None |
| `src/lib/microsites/schema.ts:425` | `comparableName: string // e.g. 'Primo Brands'` | Legitimate (public comparable) — type comment, not rendered content | None |
| `src/lib/microsites/accounts/dannon.ts:87` | `'Primo proof should land hardest here...'` | Legitimate (public comparable) — internal planning comment | None |
| `src/lib/microsites/accounts/dannon.ts:192` | `comparableName: 'Primo Brands'` | Legitimate (public comparable) — named comparable field | None |
| `src/lib/microsites/accounts/dannon.ts:222–225` | `id: 'primo-q1-2025'`, `source: 'Primo Brands operating data (under NDA)'` | Legitimate (public comparable) — citation for named public customer | None |
| `src/lib/microsites/accounts/campbell-s.ts:195` | `comparableName: 'Primo Brands'` | Legitimate (public comparable) — named comparable field | None |
| `src/lib/microsites/accounts/campbell-s.ts:230–233` | `'Primo Brands operating data (under NDA)'` | Legitimate (public comparable) — citation | None |
| `src/lib/microsites/accounts/diageo.ts:20,35,82` | `'...translate well from Primo.'` | Legitimate (public comparable) — internal planning comments (JSDoc) | None |
| `src/lib/microsites/accounts/diageo.ts:187` | `comparableName: 'Primo Brands'` | Legitimate (public comparable) — named comparable field | None |
| `src/lib/microsites/accounts/diageo.ts:223–226` | `'Primo Brands operating data (under NDA)'` | Legitimate (public comparable) — citation | None |
| `src/lib/microsites/accounts/diageo.ts:346,352,377,383,408,414,439,445,470,476` | `'...translate well from Primo.'` | Legitimate (public comparable) — framing narrative / subheadline in per-contact variants | None |
| `src/lib/microsites/accounts/frito-lay.ts:217` | `comparableName: 'Primo Brands'` | Legitimate (public comparable) — named comparable field | None |
| `src/lib/microsites/accounts/frito-lay.ts:252–255` | `'Primo Brands operating data (under NDA)'` | Legitimate (public comparable) — citation | None |
| `src/lib/microsites/accounts/general-mills.ts:217` | `comparableName: 'Primo Brands'` | Legitimate (public comparable) — named comparable field | None |
| `src/lib/microsites/accounts/general-mills.ts:252–255` | `'Primo Brands operating data (under NDA)'` | Legitimate (public comparable) — citation | None |
| `src/lib/microsites/accounts/hormel-foods.ts:101,136` | `'Primo Water operates 45 plants...'` | Legitimate (public comparable) — commented-out JSDoc; refers to Primo Water (former brand name of Primo Brands), not the unnamed anchor; 45 plants ≠ 237 | None — dead code; note: "Primo Water" is the pre-2023 brand name; current name is "Primo Brands" |
| `src/lib/microsites/accounts/hormel-foods.ts:418` | `'Primo Water operates 45 plants...'` | Legitimate (public comparable) — active quote block; refers to Primo Water / Primo Brands (public company), not the unnamed anchor | None — correct context; note: could be updated to "Primo Brands" to reflect current brand name, but not a leak |
| `src/lib/data/accounts.json:264` | `"Primo Water operates 45 plants..."` | Legitimate (public comparable) — same quote as hormel-foods.ts; Primo Brands (public), not the anchor | None |
| `src/lib/microsites/audio-brief.ts:25` | `label: 'What 237 facilities taught'` | Legitimate — correct usage per style guide; uses the facility count as an attribute identifier, never names the company | None |
| `src/components/microsites/memo-audio-brief.tsx:12` | `"What 237 facilities taught"` (JSDoc example) | Legitimate — type documentation example, same correct usage | None |

**Conclusion:** No leaks found across the audited surfaces. All `Primo` references (including the "Primo Water" variant in Hormel fixtures) refer to the public Primo Brands comparable, not the unnamed Tier-1 anchor. The `237` references use the facility count as an attribute identifier exactly as this guide recommends. No anchor customer names (BlueTriton, Niagara Bottling, Pure Life, Poland Spring) appear anywhere in the codebase. No anchor-associated town names appear in any content file.

One housekeeping note: `hormel-foods.ts` and `accounts.json` use "Primo Water" (the company's pre-2023 name before the Primo Water / Cott merger rebranded to Primo Brands in 2023). This is not a style-guide violation but may be worth updating to "Primo Brands" in a future pass for brand-name accuracy.
