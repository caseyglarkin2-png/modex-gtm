# MODEX Distribution Execution Plan

Status: Active
Updated: 2026-04-08

## Goal

Start distribution immediately without blocking on the whole portfolio. Ship finished assets now. Keep the next assets in staging until they clear page QA and deploy.

## Core Rule

Always send the highest-confidence asset available for a given account.

1. If a route is flagship-ready and deployed, send it now.
2. If the recipient email is confirmed or has later successful send history, include it in the first wave.
3. If the route still needs QA, keep the recipient in the next lane.
4. If the domain is blocked or the account is warm-intro-only, hold it.

## Data Reality

The persona suppression fields are not currently clean enough to use as the only outbound gate for recovery campaigns.

1. `scripts/backfill-email-accounts.ts` sets `do_not_contact=true` when an older send bounced.
2. That flag is not automatically cleared when a later Gmail-era send succeeds.
3. Result: some valid recovery contacts still look suppressed in the DB.
4. For today, use curated manifests plus account/domain safety rules, not raw `do_not_contact` alone.
5. `unsubscribed_emails` is materially different. It is populated only by the unsubscribe API or bounce/complaint webhook. Changing the sender from `casey@yardflow.ai` to `casey@freightroll.com` does not invalidate those records.
6. For the GM and Frito recovery contacts, `unsubscribed_at` timestamps cluster on 2026-03-30, not the burned-domain day. Treat those as real suppressions unless you independently confirm otherwise.

## Route Lanes

### Lane A - Send Now After Deploy

Routes:

1. `/for/general-mills`

Manifest:

1. `scripts/contacts/flagship-wave-a-live.ts`

Selection basis:

1. Contact is not currently in `unsubscribed_emails`.
2. Email is verified in DB.
3. Page is already in the strongest deployed send-now tier.

Current live count after DB and unsubscribe checks:

1. Niccole Pippin at General Mills

### Lane A2 - Broader Live Overview Wave

Current state:

1. Sent on 2026-04-08.
2. Treat `scripts/contacts/overview-wave-live.ts` as the completed broad live wave, not tomorrow's default resend.
3. Use `scripts/contacts/overview-wave-live-follow-on.ts` only for deliberate one-by-one future drips.

Routes:

1. `/for/general-mills`
2. `/for/diageo`
3. `/for/coca-cola`
4. `/for/keurig-dr-pepper`

Manifest:

1. `scripts/contacts/overview-wave-live.ts`

Selection basis:

1. Contact is not currently in `unsubscribed_emails`.
2. Domain is not in the system blocked-domain list.
3. Route is already live in production and currently returns `200`.

Current live count after DB, route, and unsubscribe checks:

1. Niccole Pippin at General Mills
2. Bill Sideravage at Diageo
3. Daniel Coe at Coca-Cola
4. Kelly Killingsworth at Keurig Dr Pepper
5. Jay Traficante at Keurig Dr Pepper
6. Deborah Finney at Keurig Dr Pepper

### Lane A Candidate Pool - Audit Only

Manifest:

1. `scripts/contacts/flagship-wave-a-confirmed.ts`

Why this is not the first live send:

1. Most of the original candidate contacts are currently in `unsubscribed_emails`.
2. Keep this file as an audit pool, not the first dispatch command.

### Lane A Recovery - Same Accounts, Broader Reach

Routes:

1. `/for/frito-lay`
2. `/proposal/frito-lay`
3. `/for/general-mills`
4. `/proposal/general-mills`

Manifest:

1. `scripts/contacts/flagship-wave-a-recovery.ts`

Selection basis:

1. Addresses from the burned-domain recovery cohort.
2. Use after the confirmed manifest dry run is clean and the pages are live.
3. As of the current DB check, this lane is fully blocked by `unsubscribed_emails` and should not be sent.

### Lane B - Archived Narrow Follow-On Lane

Current state:

1. Diageo and Coca-Cola already went out in the broader live wave on 2026-04-08.
2. Keep this manifest only if you want a narrower refreshed resend after an additional page pass.

Routes:

1. `/for/diageo`
2. `/for/coca-cola`

Manifest:

1. `scripts/contacts/flagship-wave-b-after-qa.ts`

Selection basis:

1. Verified email in DB.
2. Page needs final visual review before outbound.

### Hold

1. Dannon. Warm intro only.
2. Any domain blocked by sender safety rules.
3. Any asset not yet deployed.

## Manual Fallback Lane

Use this lane when an account is strategically important but the email lane is constrained by unsubscribe state or missing contact enrichment.

### Current state

1. The current DB records for the live six-contact pool do not have stored `linkedin_url` values.
2. That means there is no automatic LinkedIn DM manifest to send from code right now.
3. The fallback path is research-backed manual outreach using the existing dossiers and phone sheet.
4. The highest-value manual board is now staged in `docs/manual-outreach-priority-board.csv`.
5. A verify-first raw email enrichment queue is staged in `docs/raw-email-enrichment-queue.csv`.

### Best current manual references

1. Coca-Cola leadership context: `docs/research-dossiers-top10.md` includes Daniel Coe and the Coca-Cola system narrative.
2. Keurig Dr Pepper leadership context: `docs/research/kelly-killingsworth-kdp-dossier.md`.
3. Keurig Dr Pepper phone and HQ context: `docs/PHONE_LIST_TOP10.md`.
4. Recent touch history for Bill Sideravage, Niccole Pippin, Kelly Killingsworth, Jay Traficante, and Deborah Finney: `docs/t4-hitlist.csv`.

### Manual workflow

1. Search LinkedIn by exact name and company from the manifest.
2. Confirm the title against the dossier or hitlist source.
3. Send the same deployed microsite or overview route used in the email manifest.
4. Log the outreach manually in the app or add an activity row after the DM or call.

## Divide And Conquer

### Casey

1. Deploy the microsite/proposal pages once the visual pass is ready.
2. Run the live send commands after deployment.
3. Monitor replies, meetings, and page-view activity.
4. Use dossier links or LinkedIn search manually for any DM follow-up lane.

### Copilot

1. Prepare the manifests.
2. Keep the Gmail batch sender aligned with current signature and blocklist rules.
3. Keep the route board accurate.
4. Keep moving the next accounts from staging into send-ready.
5. Keep suppression logic separated from burned-sender cleanup so we do not reintroduce blocked recipients by mistake.

## Atomic Tasks

### Sprint A - Dispatch The Finished Assets

1. Deploy the current flagship page changes.
2. Run dry run for the confirmed manifest.
3. Review subjects, asset URLs, and count.
4. Run live send for the confirmed manifest.
5. Watch `email_logs`, activities, page views, and replies.

### Sprint B - Expand The Same Accounts Safely

1. Run dry run for the recovery manifest.
2. Confirm the asset URLs still point to the deployed pages.
3. Send recovery manifest only after Wave A is out.

### Sprint C - Archived Narrow Resend Path

1. Diageo and Coca-Cola already shipped in the broader live wave on 2026-04-08.
2. Only use this path if you intentionally want a narrower resend after another visual pass.
3. Run dry run for Wave B only if that resend decision is explicit.

## Commands

Dry run confirmed Wave A:

```bash
DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=flagship-wave-a-confirmed
```

Send confirmed Wave A:

```bash
npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=flagship-wave-a-confirmed
```

Dry run broader live overview wave:

```bash
DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=overview-wave-live
```

Send broader live overview wave:

```bash
npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=overview-wave-live
```

Dry run broader live follow-on wave after Wave A has already been sent:

```bash
DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=overview-wave-live-follow-on
```

Send broader live follow-on wave after Wave A has already been sent:

```bash
npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=overview-wave-live-follow-on
```

Dry run broader recovery cohort:

```bash
DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=flagship-wave-a-recovery
```

Dry run Wave B after page QA:

```bash
DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=flagship-wave-b-after-qa
```

## Immediate Recommendation

1. Treat the broad live wave as complete for 2026-04-08.
2. Start tomorrow with replies, email logs, and microsite-session review before sending anything new.
3. If a one-by-one future drip is justified, use `overview-wave-live-follow-on --only=<target-email>` instead of a broad resend.
4. Work `docs/manual-outreach-priority-board.csv` in parallel for Frito-Lay, Hormel Foods, JM Smucker, The Home Depot, Georgia Pacific, and H-E-B.
5. Treat `flagship-wave-a-confirmed` and `flagship-wave-a-recovery` as audit pools, not immediate live send commands.
6. Keep `flagship-wave-b-after-qa` only as a deliberate narrow resend option, not tomorrow's default plan.
