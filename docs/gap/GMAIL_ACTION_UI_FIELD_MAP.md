# Gmail action UI: the field map (GUI-01, October 10, 2026)

STATUS: ACTIVE. What the deployed digest and the START assignment render today, where each field comes from, and what each omits that already exists. Read-only trace: `scripts/gap/preview-assignments.ts` rendered four real packets against production (`docs/gap/ASSIGNMENT_PACKETS_PREVIEW_2026-10-10.md`). The audit is Casey's upload of October 9; the build queue GUI-02 to GUI-12 is in `INTELLIGENCE_WIRING_CHECKLIST.md`. <!-- verified:2026-10-10 -->

## What the assignment renders today (work/assignment.ts, buildAssignment)

| Line | Source | Stored field | Omits (exists elsewhere) |
|---|---|---|---|
| "Account: Person (title)." | the plan item (`work/plan.ts` PlanItem.person from the Work card) | `work.day_planned` payload items[].person {name, title} | the person's email, phones, LinkedIn, HubSpot contact link (persona row: email, phone, phone_status, linkedin_url, hubspot_contact_id) |
| "Why now: ..." | item.why + the Ask context's stateLine | the plan item; `ask/context.ts` state | repeats the state words three times for a ready item |
| "What we know:" six lines with a basis | the Ask context story rows (`story/story.ts`: last email to, replies, counts, HubSpot notes, imported records' passages, our read) | HubSpot engagements, the synced inbox, the vault, gap_signals | each line's original source URL and the event date apart from the report and import dates (the imported record carries them under metadata.import; the story line carries a basis string only) |
| "Why they care" / "They said" | the opening (hypothesis) and buyerSaid (inbound excerpts) | gap hypotheses; inbound_messages | the thread link; whether a later outbound answered it |
| "Your vault note" (seller only) | AskContext.sellerNote from the vault account note | gap_knowledge_notes (02_Accounts) | the named documents as links (the four tracked sales docs); wiki fragments leak (`[[RETIREMENT-HANDOFF]]`) |
| "Not read this time / Partly read / Read" | AskContext.coverageLine | the coverage rows | printed above the move; long |
| "GAP has prepared an angle" | the pursued items (`work/intel.ts` loadPursued) | agent tasks (develop_angle) | the angle's source date is in the task; printed as prose |
| "The move:" | the Ask context's next, else the item title | the pursuit state | options including no action; the relationship purpose |
| "The email, to ..., subject ..." + body | the action pack's queued draft (`execution/action-pack.ts`) | hypothesis/compile rows | the sender identity; the exact asset links; when none: "preparation remains" is not said (only "The move: Prepare the first touch") |
| the IW15 hold | buildAssignment | the pack persona and the persona row | (in place since release 1) |
| "Open it in GAP" | a signed `open` link or the item href | action-token | a direct link to the HubSpot contact, company and deal, the Gmail thread |
| the commands footer | COMMAND_WORDS | | the exact effect of each command; direct selection of an item |

## What the digest renders today (work/briefing.ts, renderBriefing)

| Block | Source | Omits |
|---|---|---|
| the subject and the count basis | the plan and the digest (C31) | the units of 13 / 11 / 6 / 3,800 |
| the intelligence items with substance | `IntelItem.substance` (metadata.import) | a classifier label (`fit_rationale`) rendered as a source |
| the pursued section | loadPursued | (now after the intelligence) |
| the plan sections with item cards | `itemCardLines` (PlanItemContext: identity, relationship, why, last exchange, next action, source and date) | the person's contact links; direct selection |
| the coverage paragraph | producer status | printed above the items |

## The fields that exist and are not shown (the producers)

- Persona: `email`, `email_status`, `phone`, `phone_status`, `linkedin_url`, `linkedin_confidence`, `title`, `hubspot_contact_id`, `updated_at`.
- Account: `hubspot_company_id`, `domain`; the in-deals summary: deal id, name, stage, next step (the HubSpot deal record `https://app.hubspot.com/contacts/3819073/record/0-3/<id>`).
- HubSpot contact properties (live, bounded, cached): phone, mobilephone, jobtitle, the LinkedIn property, hs_timezone.
- The synced inbox thread (`inbound_messages` with thread ids) and our Sent (`account-intel/sent.ts`) and drafts: the request state (fulfilled, unfulfilled, unknown).
- The purpose classifier (`replies/purpose.ts`): buyer, customer, partner, vendor pitch, media, administrative, calendar, automated.
- The suppression authority (`suppression/`): the opt-out and its date and words.
- The imported records (`gap_signals` origin report_import): the passage, the sources with urls, eventDate, reportedOn, importedAt, uncertainty, interpretation.
- The vault note's named documents and links (02_Accounts frontmatter and body).
