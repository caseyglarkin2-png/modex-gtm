# Inland26 dogfood reconciliation (Phase 3, read-only)

STATUS: READ-ONLY. No write to HubSpot, Gmail, or GAP production. Run via `scripts/gap/dogfood-inland26-reconcile.ts` against production Postgres.

<!-- verified:2026-09-24 -->

## What this supersedes

`docs/gap/inland26-runtime-reconcile-dry-run.md` (earlier today) classified the same six evidence rows BY HAND because that session had no production `DATABASE_URL`. This run uses the real `reconcileOne` reconciler (`src/lib/gap/execution/reconciler.ts`) wired to real production Prisma reads (the pattern in `scripts/gap/e2e-6d.ts`'s `realDeps`), for the same six emails.

## Evidence (unchanged, verified earlier today)

Six HubSpot `EMAILS` engagements, `hs_email_status: SENT`, owner 85093129 (Casey), sent 15:17-18:31 UTC 2026-09-24. See the dry-run doc for the full table (times, subjects). No new HubSpot read was done in this pass; the account name and contact email per row are unchanged.

## Result (current identity state, BEFORE Phase 2 bootstrap)

| Row | Outcome | Account | Hypothesis | Enrollment |
|---|---|---|---|---|
| Walmart / chris.anderson0 | IDENTITY_UNRESOLVED | -- | -- | -- |
| Tyson Foods / ryan.heman | HYPOTHESIS_MISSING | Tyson Foods | none | none |
| Tyson Foods / damian.elsken | HYPOTHESIS_MISSING | Tyson Foods | none | none |
| Tyson Foods / todd.skidmore | HYPOTHESIS_MISSING | Tyson Foods | none | none |
| Walmart / nichole.sanko | IDENTITY_UNRESOLVED | -- | -- | -- |
| Walmart / ivy.barney | IDENTITY_UNRESOLVED | -- | -- | -- |

## Update: after the Walmart Inc. identity fix (owner decision, 2026-09-24)

Casey confirmed "Walmart Distribution Center" is NOT the canonical enterprise
account. HubSpot search (`domain = walmart.com`, exact match) found exactly
one deterministic company (id `8536615003`, name "Walmart"; the only other
candidate, "Walmart eCommerce Mexico", is `walmart.com.mx`, a different
domain). Per that owner authorization, created a real `Account` row
"Walmart Inc." (id 1892, `hubspot_company_id=8536615003`), a resolved
`CanonicalCompany`/`CanonicalAccountLink` pair for the domain, and an
explicit `GapAccountAlias` (Walmart -> Walmart Inc.). "Walmart Distribution
Center" (id 674) was NOT touched, merged, or deleted.
Script: `scripts/gap/dogfood-walmart-identity.ts`.

Re-running the reconciler (same script, `scripts/gap/dogfood-inland26-reconcile.ts`):

| Row | Outcome | Account | Hypothesis | Enrollment |
|---|---|---|---|---|
| Walmart / chris.anderson0 | **HYPOTHESIS_MISSING** | Walmart Inc. | none | none |
| Walmart / nichole.sanko | **HYPOTHESIS_MISSING** | Walmart Inc. | none | none |
| Walmart / ivy.barney | **HYPOTHESIS_MISSING** | Walmart Inc. | none | none |
| Tyson Foods (all 3) | HYPOTHESIS_MISSING | Tyson Foods | none | none | (unchanged)

All 6 evidence rows now resolve to a real account. None are MATCHED (no
`ConversationDisposition` written) -- there was never a GAP hypothesis
behind any of these sends, and none is fabricated to close the gap.
HYPOTHESIS_MISSING remains the honest, correct outcome for all six.

**Correction to the earlier hand-classification:** the dry-run doc classified Tyson as AMBIGUOUS ("two near-duplicate Account rows, neither carrying a hubspot_company_id, normalization does not cleanly disambiguate"). The real resolver, run against live production data, resolves "Tyson Foods" cleanly (`ok: true`) -- it is NOT ambiguous today. That earlier note was itself hand-derived from a morning snapshot doc, not a fresh query; this run is the fresh query, and it disagrees. Treat the hand-classification as superseded by this result, per the recency-discipline rule (fetch before declaring state).

Walmart remains IDENTITY_UNRESOLVED, matching the earlier finding: no canonical `Account` row exists for parent "Walmart," only a narrower "Walmart Distribution Center" record that does not normalize-match.

## What is NOT written

- No `ConversationDisposition` row created for any of the six (all six are non-MATCHED outcomes -- HYPOTHESIS_MISSING and IDENTITY_UNRESOLVED are never written as dispositions, by design; recording a MATCHED result is a separate, deliberate step this script does not take).
- No hypothesis fabricated to make Tyson's `HYPOTHESIS_MISSING` outcome look better. Per the overnight directive: "If historical outreach had no real hypothesis, HYPOTHESIS_MISSING must remain the truth." It does.
- No account merge, no alias guess for "Walmart" (a guess here is exactly the kind of silent merge 6A exists to prevent -- see `docs/gap/casey-morning-decision-queue.md`).

## CASEY_REVIEW_REQUIRED

**Walmart parent-account gap.** No `Account` row named "Walmart" exists; only "Walmart Distribution Center." Three real, already-sent Inland26 emails (chris.anderson0, nichole.sanko, ivy.barney) cannot be reconciled until either (a) a real "Walmart" `Account` row is created (not in this session's authorization -- account creation is explicitly NOT permitted), or (b) Casey confirms "Walmart Distribution Center" is in fact the intended canonical account for these contacts, at which point a `GapAccountAlias` (Walmart -> Walmart Distribution Center) would be a safe, deterministic, non-guessing write. See the decision queue.

**Tyson Foods: no hypothesis exists.** Three real, already-sent emails resolve to a real account with zero `ProspectingHypothesis` rows. This is not a bug to fix by fabricating one; it is accurate history (the send happened outside the GAP pipeline, per the dry-run doc's blocker 2 workaround). If Casey wants Tyson tracked in GAP going forward, that is a Phase 4 hypothesis-creation candidate, not a reconciliation-of-history one.

## Next

Re-run this same script after Phase 2's identity bootstrap lands, to see whether any outcome changes (it should not, for Walmart -- Phase 2 is not authorized to create the missing Account row -- but will confirm Tyson's HYPOTHESIS_MISSING is stable).
