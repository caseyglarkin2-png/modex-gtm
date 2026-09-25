# Inland26 generic-reconciler dry run (read-only)

STATUS: DRY RUN, READ-ONLY. No write to HubSpot, Gmail or GAP production. No hypothesis fabricated.

<!-- verified:2026-09-24 -->

Per the owner addendum (2026-09-24) to `docs/GAP_RUNTIME_HANDOFF.md`, item 4: after 6D's generic reconciler (`src/lib/gap/execution/reconciler.ts`) passed its scratch e2e (`docs/gap/6d-e2e-latest.md`, PASS), this is a read-only dry run against the real Inland26 campaign using live HubSpot evidence. This is acceptance evidence that the reconciler understands the first real campaign run around GAP OS. It is not permission to backfill production, and no hypothesis was fabricated to improve the match rate.

## What changed since this morning

`docs/gap/inland26-field-pilot-2026-09-24.md` (written ~04:2x UTC today) recorded Wave 1 as **PREP ONLY**: three companies with content gate-checked but nothing sent, blocked on (1) a Vercel flag flip, (2) no HubSpot API path to a genuine one-to-one draft, and (3) canonical-Account-row ambiguity for all three companies.

A live HubSpot read this session (portal 3819073, read-only, via the account's own MCP connection) found that blocker 2's documented workaround (paste the prepared copy directly into Gmail/HubSpot) was used this afternoon. Six `EMAILS` engagements, `hs_email_status: SENT`, owner 85093129 (Casey), logged between 15:17 and 18:31 UTC today:

| Time (UTC) | Company | To | Subject |
|---|---|---|---|
| 15:17:07 | Walmart | chris.anderson0@walmart.com | "scrubbed the agenda - want a field guide for Inland next week?" |
| 15:36:50 | Tyson Foods | ryan.heman@tyson.com | "want a guide to Inland26?" |
| 15:37:47 | Tyson Foods | damian.elsken@tyson.com | "field guide for Inland?" |
| 15:37:54 | Tyson Foods | todd.skidmore@tyson.com | "your trucks at your own gates" |
| 17:10:03 | Walmart | nichole.sanko@walmart.com | "Inland26 guide" |
| 18:31:03 | Walmart | ivy.barney@walmart.com | "two days, five facilities..." |

Ingredion has no engagement in today's window (its most recent logged email, "The cheapest capacity left", is dated 2026-09-23, before the campaign window this dry run covers).

All six are logged HubSpot email engagements from a manual send, not a send through any engine this phase's execution contract models (`modex_queue`, `hubspot_sequence`, `gmail_direct`, `gmail_draft`, `hubspot_native`) -- classified `manual` per `ExecutionEngine`.

## Reconciliation, by the six outcomes

**Scope and limitation, stated plainly:** this session has no safe read path into the production Postgres database (no production `DATABASE_URL` configured here, and one was not requested or fabricated). The identity and hypothesis-existence classification below is `resolveIdentity`'s pure logic applied BY HAND to the account-state facts `inland26-field-pilot-2026-09-24.md` already verified and dated this morning, not a fresh production query run by this dry run. If a hypothesis, alias, or canonical-account fix landed in production between that doc's snapshot and now, this classification would be stale in that respect; nothing here claims otherwise.

| Company | Evidence (6 emails) | 6A identity resolution | Outcome | Why |
|---|---|---|---|---|
| Tyson Foods | 3 emails (ryan.heman, damian.elsken, todd.skidmore) | Two near-duplicate `Account` rows ("Tyson Foods" and "Tyson"), neither carrying a `hubspot_company_id`; normalization does not cleanly disambiguate which one is canonical | **AMBIGUOUS** | 6A's resolver refuses to guess between two real candidates (`ambiguous_identity`) rather than silently picking one -- this is precisely the identity-collision case 6A exists to catch, not a false negative |
| Walmart | 3 emails (chris.anderson0, nichole.sanko, ivy.barney) | No canonical `Account` row for parent "Walmart" at all; only a narrower "Walmart Distribution Center" record, which does not name- or suffix-normalize to "Walmart" | **IDENTITY_UNRESOLVED** | The resolver finds no candidate and refuses `unresolved_company` -- correctly: guessing "Walmart Distribution Center" is the right parent account for a `walmart.com` contact would be exactly the kind of silent merge 6A is built never to do |
| Ingredion | 0 emails today | Two near-duplicate `Account` rows, same shape as Tyson (per the field-pilot doc); no new engagement in today's window to reconcile | **(no evidence to classify)** | Not part of this dry run's evidence set; the same AMBIGUOUS finding as Tyson would apply if/when a send happens |

Even setting the identity question aside: per the field-pilot doc's own blocker 3, **zero `ProspectingHypothesis` or `DraftQueueItem` rows exist in production for any of the three companies** -- the content was hand-written and sent entirely outside the GAP hypothesis/enroll pipeline (the same blocker 2 workaround). Had identity resolved for either company, the next-stage outcome would have been **HYPOTHESIS_MISSING**, not MATCHED: nothing in GAP ever proposed or approved a hypothesis this send could attribute to.

## By execution engine

| Engine | Evidence count | Outcomes |
|---|---|---|
| `manual` | 6 | AMBIGUOUS x3 (Tyson), IDENTITY_UNRESOLVED x3 (Walmart) |
| `modex_queue` / `hubspot_sequence` / `gmail_direct` / `gmail_draft` / `hubspot_native` | 0 | no evidence from these engines this campaign; consistent with 6C shipping dark and Sprint 6 (HubSpot-native publishing) remaining out of scope |

## What this proves

The generic reconciler correctly refuses to fabricate a match for a real, live campaign's evidence when the underlying identity or hypothesis data is not there to support one. It does not manufacture MATCHED results to look more complete than the data actually is. The blocking issue it surfaces (Tyson/Ingredion account-row ambiguity, Walmart's missing parent account) is not new -- it is the exact issue named in the field-pilot doc's blocker 3 and the exact acceptance case 6A-T4 already resolves for Pounce triggers; the same fix (a canonical-account pick, or a real dedup merge, per that doc's "Morning path" step 2) would resolve it here too, for a human to make, not this dry run.

## Explicitly not done

- No write to HubSpot, Gmail, or GAP production.
- No `ProspectingHypothesis`, `Account`, alias, or `SequenceEnrollment` row created, fabricated, or backfilled anywhere.
- No production database query was run; the GAP-side facts above are cited from the already-dated field-pilot doc, not freshly re-verified against production Postgres in this session.
