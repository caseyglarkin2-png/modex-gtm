# GAP OS dogfood overnight brief

<!-- verified:2026-09-24 -->

GAP DOGFOOD OVERNIGHT: COMPLETE

## IDENTITY

- before: 16/43 Pounce-cohort accounts resolved (37%)
- after: 23/43 resolved (53%)
- resolved by company ID: 0 (12 accounts now carry `hubspot_company_id`, but no Pounce trigger in this window carried a matching field to exercise that tier -- capability added, not yet exercised)
- resolved by alias: 10 (7 new ticker aliases + UNFI/Niagara Bottling picked up by the same aliasing pass)
- ambiguous: 0
- unresolved: 20 (down from 27)

## INLAND26

- matched: 0
- imported: 0
- hypothesis missing: 3 (Tyson Foods, all 3 real sent emails)
- ambiguous: 0 (corrected from the earlier by-hand AMBIGUOUS call on Tyson -- it resolves cleanly against live data)
- unresolved: 3 (Walmart, all 3 real sent emails -- no canonical Account row)

## HYPOTHESES

- created: 20
- review-ready: 20 (all `status: draft`)
- blocked: 0

## SHADOW

- flag: `GAP_AUTO_ENROLL_SHADOW=false` (untouched)
- decisions: 0
- acted by system: 0
- human-comparable: 0
- missing Casey decisions: at least one Phase 4 hypothesis needs your review before shadow can turn on -- see `docs/gap/shadow-readiness.md`

## REPLIES

- attributable: 0 (out of 728 raw inbound messages)
- awaiting Casey confirmation: 0
- oldest real GAP backlog: none (count is 0)

## LEARNING

- non-zero dimensions: hypothesis count (20), signal yield by type (site_expansion 45% n=11, automation_program 14% n=7, technology_signal 25% n=4, news 0% n=1)
- notable early signals: UNFI Midwest consolidation/automation (2 sources), PepsiCo/Home Depot/Coca-Cola/General Mills/Kroger 10-Q/10-K capex mentions, FedEx autonomous trailer loading (Dexterity)
- sample-size warnings: every rate above carries n <= 11; treat as early signal, not a trend

## SAFETY

- emails sent by GAP: 0
- Gmail writes: 0
- HubSpot writes: 0
- real enrollments: 0
- GAP_AUTO_ENROLL_ENABLED: OFF
- HubSpot publisher: OFF
- HubSpot mirror: OFF
- clawd halt: INTACT
- OUTREACH_PAUSED changed: NO

## CASEY MORNING ACTIONS

1. **Confirm whether "Walmart Distribution Center" is the intended canonical account for the 3 already-sent Inland26 Walmart emails.**
   Why it matters: without this, those 3 real conversations can never be reconciled into GAP's truth.
   Link: `docs/gap/casey-morning-decision-queue.md` (item 1), `docs/gap/inland26-dogfood-reconciliation.md`
   After you answer: if yes, a `GapAccountAlias` write is safe and immediate; if no, it needs a real Account row created through normal onboarding (out of this session's authorization).

2. **Review the 20 draft hypotheses at `/gap/hypotheses/`.**
   Why it matters: this is the first real evidence-backed cohort GAP has ever produced, and it's also the ONLY thing that can unblock shadow mode (Phase 6 gate needs at least one real recommendation-vs-your-action comparison).
   Link: `/gap/hypotheses/`, `docs/gap/dogfood-hypothesis-cohort.md`
   After you answer: your decisions become the first real human-action data; the next dogfood pass can then evaluate shadow readiness again.

3. **Decide whether to track Tyson Foods going forward.**
   Why it matters: 3 real Inland26 emails already went to real Tyson contacts, entirely outside GAP; there's no hypothesis to attribute that history to, and none should be fabricated.
   Link: `docs/gap/casey-morning-decision-queue.md` (item 2)
   After you answer: if yes, Tyson becomes a Phase 4-style hypothesis candidate from current live signals, not a backfill of the old send.

4. **Optional: pick the right HubSpot company for SNDR (Schneider National) and Loblaw**, and **decide whether CL/KNX/Target need onboarding as real Accounts.**
   Why it matters: lower priority than 1-3; these are coverage gaps, not blockers.
   Link: `docs/gap/dogfood-identity-after.md`

5. **Optional: a dedup pass on FedEx/FedEx Corporation, Coca-Cola/The Coca-Cola Company, RXO/RXO Inc.**
   Why it matters: pre-existing duplicate Account rows, found but not created by this session; each currently resolves silently to whichever row a scan hits first.
   Link: `docs/gap/dogfood-identity-after.md` (decision queue item 5)

## PR

- URL: see below (opened this run)
- HEAD: `73e1677c` (feat/gap-os-dogfood)
- tests: 2433/2433 GAP unit tests pass; `tsc --noEmit` clean on the full repo

DOGFOOD OVERNIGHT COMPLETE — CASEY MORNING REVIEW READY
