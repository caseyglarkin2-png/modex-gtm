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

(more items appended below as later phases surface them)
