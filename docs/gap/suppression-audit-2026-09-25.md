# GAP suppression provenance audit (2026-09-25)

STATUS: SHIPPED 2026-09-25 (production READ audit; 10 proven corrections applied)
<!-- verified:2026-09-25 -->

## Why this exists

Routing treated every positive suppression leg as a permanent `do_not_contact`.
The General Mills cards in the dogfood cohort were blocked that way while every
remote plane (clawd, HubSpot, SendGrid, verbal) was clear. The only authority
was the local `Persona.do_not_contact` flag, set by a March 2026 bounce wave.
This audit asks, for every suppressed persona, **why** the flag exists, and
classifies it with the taxonomy the router now uses
(`src/lib/gap/suppression/provenance.ts`).

## Method (all production reads; nothing written during the audit)

| Source | How it was read |
|---|---|
| `personas.do_not_contact`, `email_status`, `email_valid` | Prisma, `SET TRANSACTION READ ONLY` |
| `unsubscribed_emails` | same (3 rows total, none matching a DNC persona) |
| `email_logs` bounce history | same (290 `bounced` rows, all 2026-03-27/28, `bounce_type` NULL, Resend-format UUID message ids) |
| clawd cross-plane contract (modex, clawd `do_not_send`, HubSpot `hs_email_optout`, SendGrid global/group/spam/bounce/invalid, war-room verbal) | `POST /api/suppression/contract`, every positive leg read from `keys` |
| HubSpot | contact batch READ: `hs_email_optout`, `hs_email_hard_bounce_reason_enum`, `email_bounced`, `email_bounced_reason`, `hs_email_last_open_date`, reply dates |
| Gmail (casey@freightroll.com) | read-only search of Sent and of every bounce notice (201 DSNs since 2026-03-25, so the mailbox demonstrably receives bounces) |

### Where do_not_contact comes from (code writers)

| Writer | Sets | Class it implies |
|---|---|---|
| `recordUnsubscribe` (unsubscribe link, GAP `do_not_contact` disposition) | `unsubscribed_emails` row + flag | HARD COMPLIANCE |
| HubSpot `hs_email_optout` (webhook, sync-hubspot pull) | flag | HARD COMPLIANCE while HubSpot still says opted out |
| HubSpot `email.bounce` webhook | `email_status = hard_bounce` + flag | HARD INVALID |
| failure-remediation `mark-bad-address` | `email_status = invalid` + flag + unsubscribe row | HARD INVALID |
| failure-remediation `suppress-recipient` | unsubscribe row + flag | HARD COMPLIANCE (human decision) |
| `scripts/enrich-contacts.ts` banned/blocked domain list | `email_status = blocked` + flag | policy (review) |
| the March 2026 Resend-era wave (writer since deleted in `ae3bf6ec`) | `email_status = bounced` + flag, bounce type never stored | SOFT / HISTORICAL |
| anything else | flag only, no status | UNKNOWN |

## Result: 386 personas carried do_not_contact = true

| Class | Count | Provenance |
|---|---:|---|
| **HARD COMPLIANCE** | **2** | SendGrid permanent list + clawd `do_not_send` (persona 381 outlook.com, 426 mantank.com). No DNC persona has a live HubSpot opt-out, an unsubscribe row, or a verbal DNC today. |
| **HARD INVALID** | **8** | HubSpot `UNKNOWN_USER` hard bounce, or clawd's Gmail-era bounce sweep (`email_bounced_reason = hard_bounce`): 23 Hormel Foods, 66 and 67 Barnes & Noble, **81 General Mills (Paul Gallagher)**, 452, 619, 624, 650. |
| **SOFT / HISTORICAL** | **96** | 85 March 2026 Resend-era bounces, unproven; 1 HubSpot `POLICY` bounce (a block, 428 rivian.com); **10 proven and corrected** (below). |
| **UNKNOWN** | **280** | 144 no email on file; 116 bare flag with no status evidence; 9 clawd `do_not_send` whose reason the contract does not return; 6 banned-domain policy (Dannon/Danone x5, BlueTriton x1); 5 Frito-Lay (see the compliance note). |

The March wave, in numbers: 290 of 2,241 March sends marked bounced (13%) on
two days, 28 of them to our own yardflow.ai / freightroll.com addresses, 10
bounces apiece at many large shippers' domains. That pattern is a sender or
provider event, not 290 bad mailboxes. It is still not **proof** for any one
address, so a flag was corrected only on individual evidence.

## Corrections applied (10, individually proven)

Standard: the ONLY suppression is the local March-wave flag; clawd's contract
answers with keys exactly `[modex_do_not_contact]` (every other plane clear);
no unsubscribe row; and the casey@freightroll.com mailbox proves the address
receives mail. Evidence per person: `docs/gap/suppression-correction-2026-09-25.json`.

| Persona | Account | Tier | Proof |
|---|---|---|---|
| 8 Ryan Underwood | General Mills | A | out-of-office auto-reply FROM his mailbox 2026-04-30; HubSpot open 2026-04-30; five Gmail sends, no bounce |
| 36 Ryan Hutcherson | Georgia Pacific | A | auto-reply FROM his mailbox 2026-04-08; eight Gmail sends, no bounce |
| 7 Nisar Ahsanullah | General Mills | B | same-day, same-pattern bounce as Ryan Underwood at the same domain (proven live); Gmail send 2026-04-02, no bounce |
| 26, 27 Rob Ferguson, Anbu Kuppusamy | JM Smucker | B | 8 and 6 Gmail sends Apr-Jun, no bounce |
| 31 John Deaton | The Home Depot | B | 6 Gmail sends, no bounce |
| 41 Troy Retzloff | H-E-B | B | 6 Gmail sends, no bounce |
| 51 Jim Small | Honda | B | 3 Gmail sends, no bounce |
| 56 Cory Reed | John Deere | B | 7 Gmail sends through 2026-09-22, no bounce |
| 61 Kristi Montgomery | Kenco | B | 4 Gmail sends; kencogroup.com does return bounces for unknown users, so silence counts |

Mechanics (`scripts/gap/correct-historical-suppression.ts`): dry run first;
`--apply` re-verified every precondition live, set `do_not_contact = false`,
`email_status = 'unverified'` by raw SQL **without touching `updated_at`** (the
sync-hubspot cron pushes recently updated personas to HubSpot, and this pass
may not write HubSpot), and appended one `suppression.corrected`
GapAuditEvent per person. `--revert` restores all ten from those receipts.
Verified after: `updated_at` unchanged on all ten; the clawd contract now
answers clear for Nisar and Ryan Underwood; Paul Gallagher (hard invalid)
still refuses on `modex_do_not_contact` and `clawd_do_not_send`.

## Casey review queue (left unchanged; provenance not provable)

1. **Compliance ambiguity, 5 Frito-Lay personas (11-15).** The 2026-04-08 doc
   `docs/reviewable-resend-candidates-2026-04-08.md` says Brian Watson, Beth
   Mars, Bob Fanslow, David Chambers and Isaac Scott had `unsubscribed_emails`
   rows. Those rows no longer exist and no plane shows an opt-out. Their DNC
   flag is untouched, so email stays blocked at send. Casey decides whether
   those were recipient unsubscribes (then they should be restored as
   unsubscribes) or remediation suppressions.
2. **85 unproven March-wave bounces** (accounts: Niagara Bottling 10, Hormel 7,
   Flowers Foods 6, FedEx 5, Home Depot 4, Georgia Pacific 4, H-E-B 4,
   Hyundai 4, John Deere 4, Kenco 4, TreeHouse 4, and others; General Mills
   personas 9 Zoe Bracey and 10 Lars Stolpestad). Routing now treats them as
   soft: phone and LinkedIn allowed with a visible warning, email blocked at
   send. Each becomes correctable the same way the ten were, on its own
   mailbox evidence.
3. **116 bare flags and 9 clawd-only flags.** Routing sends these to a
   "suppression review" prerequisite, never to outreach.
4. **144 flags with no email.** Nothing to email; provenance unknown.

## What routing does now (the four classes)

| Class | Routing | Send-time wire gate |
|---|---|---|
| HARD COMPLIANCE | R0 system block, `do_not_contact` | refuses (unchanged) |
| HARD INVALID | email off; phone/LinkedIn allowed; no usable channel means "find a current address" research | refuses (unchanged) |
| SOFT | not a DNC; phone/LinkedIn actionable with a visible warning; no email action recommended | refuses until the flag is corrected (unchanged) |
| UNKNOWN | R0c `suppression_review`: research, work queue, never outreach | refuses (unchanged) |
| service unreadable | R0b blocked, operational warning, no DNC written | refuses (unchanged) |

`assertSuppressionPermitsSend` was not modified. Routing permission is not
send permission.
