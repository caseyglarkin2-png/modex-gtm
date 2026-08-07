# Discovery — prospect contacts, inferred email, email-from-drawer

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


**Goal.** From the `/discovery` worklist drawer, turn a top prospect account into
an emailable lead: surface the right decision-maker contacts, get an email
address for each (real when we have it, inferred when we don't — never a blind
guess), and open an editable draft prefilled with the proximity angle so Casey
can tweak and send. No enrichment credits spent (HubSpot is read-only; Apollo
search returns no usable emails and its keys 401).

## Constraints / decisions (from brainstorm)

- **Check what we already have before guessing.** Source contacts from our own
  records and HubSpot **reads** (free) before any inference.
- **Infer only with a real basis** (Casey's "2 and 3"): derive the pattern from
  known emails at that company; else use a researched company→pattern map; if we
  have neither, show the person + LinkedIn but **no guessed address**.
- **Action = editable draft** (Casey's "1 + editable"): open the existing
  `EmailComposer` prefilled (to / subject / body), recipient and body editable,
  Casey sends.
- "Both" for finding contacts, but **manual-add ships first**; automated
  web-research of names is a fast-follow (needs a server-side browse capability).

## The contact waterfall

`findProspectContacts(account)` (server action) assembles a ranked list, cheapest
source first, each contact tagged with `source` and an `email` + `emailBasis`:

1. **Our DB (free, real emails).** `Persona` (by `account_name`),
   `AccountContactCandidate` (by account), and `EmailLog.to_email` (anyone we've
   emailed at the company's domain). Real, verified-ish emails — `emailBasis: 'known'`.
2. **HubSpot read (free).** `getAccountContacts(company)` →
   `hsSearchContacts` (already built; returns name/title/email). Degrades to `[]`
   if HubSpot is unavailable. `emailBasis: 'known'`.
3. **Manually added** (you paste `Name, Title`, optional LinkedIn). Email is
   **inferred** (§ Email inference). `emailBasis: 'inferred-corpus' | 'inferred-map' | 'none'`.
4. *(fast-follow)* **Auto web-research** proposes decision-maker names for the
   account's relevant roles; same inference path. Out of scope for v1.

Dedupe by normalized name; prefer the source with a real email. Cap ~12 contacts.

## Email inference engine (pure, unit-tested) — `src/lib/discovery/email-pattern.ts`

```
type EmailPattern =
  | 'first.last' | 'firstlast' | 'flast' | 'f.last' | 'first_last'
  | 'first' | 'last.first' | 'lastfirst' | 'firstl';

detectPattern(samples: {firstName,lastName,email}[]): { pattern, matchRate, n } | null
applyPattern(firstName, lastName, domain, pattern): string
inferEmail(firstName, lastName, domain, opts:{ samples?, storedPattern? })
  : { email: string | null, confidence: 'high'|'medium'|'low'|'none', basis }
```

- **detectPattern**: over samples at one domain, find the pattern that explains
  the most emails. `matchRate` = fraction matching; `n` = sample count.
- **inferEmail**:
  - **high** — corpus has ≥2 samples and `matchRate ≥ ~0.8` → derive + apply.
  - **medium** — no/weak corpus but a researched `storedPattern` for the domain.
  - **none** — neither → `email: null` (show person + LinkedIn only).
- Lowercase, strip accents/punctuation from names; handle hyphens, middle names.

**Corpus** for a domain = `Persona` rows (have `first_name`/`last_name`/`email`)
+ `EmailLog`/HubSpot emails at that domain. Persona triples drive `detectPattern`.

**Researched map** — `src/lib/discovery/email-patterns.ts`: a committed
`Record<domain, { pattern, source }>` seeded by researching the top ~15–20
prospect companies' formats. Also needs **company→domain** resolution: a seed
`Record<companyKey, domain>` (researched), plus deriving the domain from any
known email at the company. (A DB table can replace the committed map later.)

## Drawer UI — `prospect-detail-sheet.tsx`

Replace the existing existing-account-only Contacts section with a **Contacts**
panel for every prospect:

- Header: company **email pattern + confidence** ("`first.last@sysco.com` — from
  6 known emails" / "researched pattern" / "pattern unknown — add a known email").
- **List**: each contact shows name · title · source chip (Our records / HubSpot /
  Added) · the email (real, or inferred with a confidence dot + basis tooltip) ·
  LinkedIn link if present · an **Email** button.
- **"+ Add contact"**: inline form (Name, Title, optional LinkedIn) → on add, infer
  the email and append to the list.
- **Email** button → opens `EmailComposer` (`open` state in the sheet), prefilled:
  - `to` = contact email (REQUIREMENT: confirm the composer's recipient field is
    editable; if not, make it editable so a wrong inferred address can be fixed),
  - `accountName` = prospect.name, `personaName` = contact.name,
  - `initialSubject` + `initialBody` = the proximity angle (reuse `generateAngle`,
    expanded into a short opener template).
- Send goes through the existing `POST /api/email/send` (`to`, `subject`,
  `bodyHtml`, `accountName`, `personaName`). No new send path.

## Components / boundaries

| Unit | Purpose | Depends on |
| --- | --- | --- |
| `email-pattern.ts` | pure pattern detect/apply/infer | nothing (testable in isolation) |
| `email-patterns.ts` | committed domain→pattern + company→domain seed | — |
| `contacts.ts` action `findProspectContacts` | waterfall aggregation | prisma, hubspot read, email-pattern |
| `contacts.ts` action `inferContactEmail` | infer one added contact | email-pattern, corpus query |
| drawer Contacts panel | list + add + email | the two actions, EmailComposer |
| compose body template | angle → subject+body | `generateAngle` |

## Confidence & safety

- Inferred emails are always **visually flagged** (confidence dot + basis). The
  composer is the review gate — Casey edits the address/body before sending.
- Never auto-send. Never show a `none`-confidence guessed address.

## Out of scope (fast-follow)

- Automated web-research of contact **names** (needs server-side browse: AI
  Gateway / Gemini / SERP). v1 is manual-add + our-records + inference.
- Persisting researched contacts back to `Persona`/candidates (could add later).
- Email **verification** (SMTP/Apollo) — skipped (no credits); confidence + manual
  review stands in.

## Testing

- `email-pattern.test.ts`: detect each pattern from samples; matchRate/confidence
  bands; apply with hyphens/accents/middle names; `none` when no basis.
- `findProspectContacts` (mocked prisma + hubspot): dedupe, source ranking,
  real-email-preferred, graceful HubSpot-empty.
- Render: drawer lists contacts, add-contact infers, Email opens composer prefilled.
