# GAP OS dogfood, Phase 4: real hypothesis cohort

STATUS: WRITES MADE (real signals + draft hypotheses). No send, no enroll, no hypothesis fabricated.

<!-- verified:2026-09-24 -->

## Method

Ran the real `runHypothesize` (the same function `/api/cron/gap-hypothesize` calls, `src/lib/gap/hypothesis/hypothesize.ts`) directly against production Postgres, NOT dry run, capped `maxAccounts: 50`, `lookbackDays: 90`, actor `gap-dogfood-overnight` (`scripts/gap/dogfood-hypothesize-cohort.ts`). Every hypothesis this produced is `status: 'draft'`, the normal human-review starting state -- nothing was auto-approved, enrolled, or sent.

## Result

```
accountsScanned: 16, triggersSeen: 23
identity.resolved: 23, aliasesRegistered: 1, conflicts: 0, refused.unresolved_company: 48
signals.created: 17, signals.existing: 6
candidates: 20, proposed: 19 (+1 from an earlier narrower run = 20 total draft hypotheses)
buildSkipped: signal_expired: 2, persona_not_relevant: 25
errors: []
```

## The 20 draft hypotheses

| Account | Family | Count | Evidence example |
|---|---|---|---|
| UNFI | yard_state_integrity | 1 | "UNFI Consolidates Midwest Distribution In $300 Million Automation Push" (simplywall.st), "UNFI consolidates Midwest facilities to leverage automation" (Supply Chain Dive) |
| PepsiCo | hidden_capacity | 9 | PEP 10-Q (2026-07-09): capital expenditure mention -- one draft per contact-ready persona |
| FedEx | automation_readiness | 1 | "FedEx scales autonomous trailer loading with Dexterity" (MarketScale) |
| The Home Depot | hidden_capacity | 2 | HD 10-Q (2026-08-25): capital expenditure mention |
| Coca-Cola | hidden_capacity | 1 | KO 10-Q (2026-07-29): capital expenditure mention |
| General Mills | hidden_capacity | 4 | GIS 10-K (2026-07-01): capital expenditure mention |
| Kroger | hidden_capacity | 2 | KR 10-Q (2026-06-26): capital expenditure mention |

Every `observation` string cites its signal id (`[S:...]`) per the hypothesis-writing invariant; none of these sentences were hand-written or embellished beyond the builder's own template.

## What this is NOT

- Not a send. Not an enrollment. No `SequenceEnrollment` row created.
- Not evidence inflation: `signal_expired: 2` and `persona_not_relevant: 25` mean real candidates were correctly refused, not padded into the 20.
- The 9 PepsiCo drafts are 9 REAL distinct persona targets against the SAME signal, not 9 copies of one idea -- see decision queue item 6 for the review-load note.

## Next

Casey reviews at `/gap/hypotheses/`. Decisions recorded there feed Phase 5/6 (routing-vs-human-action comparison), once at least one real decision exists.
