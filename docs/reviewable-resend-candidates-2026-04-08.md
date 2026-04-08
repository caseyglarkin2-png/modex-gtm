# Reviewable Resend Candidates - 2026-04-08

Scope: previously disputed domains that were blocked by sender-blind bounce history.

This list uses the stricter recovery-aware rule:

1. The domain has a later accepted send after the March 27 bounce window.
2. The exact recipient does not exist in `unsubscribed_emails`.
3. The recipient has a later positive `email_logs` event after the last bounce for that address.

This is a reviewable resend cohort, not a blanket inbox guarantee. The later positive signal is `sent`, which proves provider acceptance but not inbox placement.

## Reviewable Now

| Account | Contact | Email | Recovery evidence | Current stale DB flags | Suggested handling |
| --- | --- | --- | --- | --- | --- |
| Hormel Foods | Will Bonifant | will.bonifant@hormel.com | bounced 2026-03-27 12:33 UTC -> sent 2026-04-02 18:49 UTC | `do_not_contact=true`, `is_contact_ready=false`, `email_status=bounced` | Reviewable one-by-one resend from `casey@freightroll.com` with softened copy and close monitoring |
| JM Smucker | Rob Ferguson | rob.ferguson@jmsmucker.com | bounced 2026-03-27 21:51 UTC -> sent 2026-04-02 18:49 UTC | `do_not_contact=true`, `is_contact_ready=false`, `email_status=bounced` | Reviewable one-by-one resend from `casey@freightroll.com` with softened copy and close monitoring |
| The Home Depot | John Deaton | john.deaton@homedepot.com | bounced 2026-03-27 21:50 UTC -> sent 2026-04-02 18:49 UTC | `do_not_contact=true`, `is_contact_ready=false`, `email_status=bounced` | Reviewable one-by-one resend from `casey@freightroll.com` with softened copy and close monitoring |
| Georgia Pacific | Ryan Hutcherson | ryan.hutcherson@gapac.com | bounced 2026-03-27 21:50 UTC -> sent 2026-04-02 18:49 UTC | `do_not_contact=true`, `is_contact_ready=true`, `email_status=bounced` | Reviewable one-by-one resend from `casey@freightroll.com` with softened copy and close monitoring |
| H-E-B | Troy Retzloff | troy.retzloff@heb.com | bounced 2026-03-27 21:49 UTC -> sent 2026-04-02 18:49 UTC | `do_not_contact=true`, `is_contact_ready=true`, `email_status=bounced` | Reviewable one-by-one resend from `casey@freightroll.com` with softened copy and close monitoring |

## Not Reviewable Yet

`pepsico.com` does not currently have a clean resend candidate in the known Frito-Lay lane.

Known addresses with later positive history still have exact `unsubscribed_emails` rows:

1. Brian Watson
2. Beth Mars
3. Bob Fanslow
4. David Chambers
5. Isaac Scott

Those addresses should stay out of the resend lane until their suppression source is reviewed intentionally.

## What Changed

The previous domain blocklist treated March 27 bounce history as universal domain failure. The updated logic now recognizes later accepted sends as evidence that those domains are not categorically bad for `casey@freightroll.com`.

The remaining stale evidence is on the persona rows themselves. `do_not_contact`, `is_contact_ready`, and `email_status` still reflect the older bounce event even when a later accepted send exists.