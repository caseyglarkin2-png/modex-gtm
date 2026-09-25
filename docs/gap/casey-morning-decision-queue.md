# Casey morning decision queue (GAP OS dogfood overnight)

<!-- verified:2026-09-24 -->

Every item here is something GAP could not safely resolve on its own overnight.
Nothing was guessed. Options are listed; no answer is assumed or fabricated.

Decision options for every item: **CONTACT/ENROLL, HOLD, RESEARCH, REJECT
HYPOTHESIS, WRONG PERSON, LIVE OPPORTUNITY, OTHER.**

---

## 1. Identity: "Walmart" has no canonical Account row

- **Account**: Walmart (Pounce signals + 3 real Inland26 sent emails all use this name)
- **Why now**: 3 already-sent Inland26 emails (chris.anderson0@walmart.com, nichole.sanko@walmart.com, ivy.barney@walmart.com) cannot be reconciled to GAP truth -- the identity resolver returns `IDENTITY_UNRESOLVED`.
- **Exact cited fact**: Production has no `Account` row named "Walmart," only "Walmart Distribution Center," which does not name/suffix-normalize to "Walmart."
- **GAP recommended action**: RESEARCH -- confirm whether "Walmart Distribution Center" is the intended canonical parent for these three contacts before any alias is written. GAP will not guess this; it is exactly the kind of silent merge the identity resolver is built to refuse.
- **What happens after Casey answers**:
  - If Casey confirms "Walmart Distribution Center" is correct: a `GapAccountAlias` (walmart -> Walmart Distribution Center) can be written deterministically, no Account creation needed.
  - If not: a real "Walmart" Account row would need to be created outside this session's authorization (account creation is not permitted here).
- **Link**: `docs/gap/inland26-dogfood-reconciliation.md`

---

## 2. Tyson Foods: real sent emails, zero GAP hypothesis

- **Account**: Tyson Foods
- **Why now**: 3 already-sent Inland26 emails (ryan.heman, damian.elsken, todd.skidmore @tyson.com) resolve cleanly to the account, but zero `ProspectingHypothesis` rows exist for it -- the send happened entirely outside the GAP pipeline.
- **Exact cited fact**: `reconcileOne` classifies all 3 as `HYPOTHESIS_MISSING`. This is accurate history, not a defect; GAP does not fabricate a retroactive hypothesis to make the number look better.
- **GAP recommended action**: OTHER -- if Casey wants Tyson tracked going forward, that's a candidate for real hypothesis creation from current Pounce signals (Phase 4), not a backfill of the historical send.
- **What happens after Casey answers**: if Casey wants it tracked, Tyson becomes a Phase 4 hypothesis candidate using live signals, cited honestly as new evidence, not the historical send.
- **Link**: `docs/gap/inland26-dogfood-reconciliation.md`

---

## 3. SNDR (Schneider National) and Loblaw: ambiguous on the HubSpot side too

- **Why now**: unlike the other 9 tickers, SNDR has 5 similarly-named HubSpot company records and Loblaw has "Loblaws" vs "Loblaw Companies," neither an exact match. No Account row exists for either yet either, so no alias was written.
- **GAP recommended action**: RESEARCH -- pick the correct HubSpot company id by hand, then it becomes an ordinary Account-creation-or-linking decision (not something this session did).
- **Link**: `docs/gap/dogfood-identity-after.md`

## 4. CL (Colgate-Palmolive), KNX (Knight-Swift), Target: no existing Account row at all

- **Why now**: HubSpot has a clean single match for all three, but production has zero Account rows to alias them to. Not an identity-resolution bug -- these accounts were never onboarded.
- **GAP recommended action**: OTHER -- if these are meant to be tracked, an Account row needs to be created through the normal onboarding path (account creation was not authorized in this dogfood run).

## 5. Pre-existing near-duplicate Account rows (found, not created by this session)

"FedEx" / "FedEx Corporation", "Coca-Cola" / "The Coca-Cola Company", "RXO" / "RXO, Inc." all have two Account rows under the same normalized name. Each currently resolves silently to whichever row the scan hits first -- a real latent risk, not touched here (merge is not authorized).

- **GAP recommended action**: RESEARCH -- worth a real dedup pass through the existing canonical/dedup engine (`src/lib/gap/revops/*`), on your call.
- **Link**: `docs/gap/dogfood-identity-after.md`

## 6. Real hypothesis cohort ready for review: 20 draft hypotheses, 8 accounts

See `/gap/hypotheses/` -- created from live, resolved Pounce signals (10-Q/10-K capex mentions, automation/consolidation news), zero fabricated evidence. Account breakdown: UNFI (1), PepsiCo (9, one per contact-ready persona), FedEx (1), The Home Depot (2), Coca-Cola (1), General Mills (4), Kroger (2). All `status: draft`, human review required before anything moves. PepsiCo's 9 near-identical drafts (same signal, 9 different persona targets) are a real review-load flag worth noting -- not a bug, but you may want to consolidate which personas actually matter before approving any.

- **GAP recommended action**: CONTACT/ENROLL, HOLD, or REJECT HYPOTHESIS per hypothesis, your call in the UI.
- **Link**: `/gap/hypotheses/`, `docs/gap/dogfood-hypothesis-cohort.md`
