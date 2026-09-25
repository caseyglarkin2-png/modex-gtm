# Deliverability health: yardflow.ai and freightroll.com (2026-09-25)

STATUS: SHIPPED 2026-09-25 (read-only audit; no DNS or provider change made)
<!-- verified:2026-09-25 -->

Scope: the two sending domains and the three live lanes. Every number below
was read today from DNS (dns.google DoH), the casey@freightroll.com mailbox
(Gmail API, read-only), SendGrid's v3 stats and suppression APIs (read-only),
and production Postgres. Where a metric was not reachable it says so; nothing
is estimated.

## Lanes

| Lane | From | Volume (measured) | Status |
|---|---|---|---|
| Gmail / Google Workspace | casey@freightroll.com | 751 sent in 30 days, 2,313 in 90 (Sent folder, excluding self) | primary 1:1 lane; GAP drafts land here |
| HubSpot | sequences send through the connected Gmail inbox (same mailbox) | counted in the Gmail numbers | no separate HubSpot sending domain configured |
| SendGrid (war-room coverage lane) | freightroll.com (domain-authenticated) | Jul 24,702 requests, Aug 11,575, Sep 7 | effectively idle since August |
| Resend (historical) | removed 2026-05-17 (`ae3bf6ec`) | March 2026 wave only | the source of the 290 historical "bounced" flags |

## Authentication

| Check | freightroll.com | yardflow.ai |
|---|---|---|
| SPF | `v=spf1 include:spf.privateemail.com include:mail.zendesk.com include:_spf.google.com ~all`: Google authorized, softfail | `v=spf1 include:_spf.google.com ~all` |
| DKIM (Google) | **no key at `google._domainkey`** (also probed google2048, 20230601, 20161025, gws, workspace, mail, dkim, google1, fr: none) | `google._domainkey` present (2048-bit RSA) |
| DKIM (SendGrid) | `s1`/`s2._domainkey` CNAME to `u6175680.wl181.sendgrid.net` (domain authentication in place) | `mail.yardflow.ai` SPF includes sendgrid.net |
| DMARC | `v=DMARC1; p=none; pct=100; rua=mailto:dmarc.rua@freightroll.com` | `v=DMARC1; p=none; sp=none; rua=mailto:dmarc.rua@freightroll.com; fo=1` |
| From-domain alignment, Gmail lane | SPF aligned (Gmail sets the Return-Path to casey@freightroll.com). DKIM alignment **not verifiable**: Sent copies carry no Authentication-Results, and no Workspace DKIM key is published | n/a (not the sending address today) |
| TLS | Gmail and SendGrid send over TLS by default; MX for both domains is Google | same |

Finding: **freightroll.com has no published Google Workspace DKIM key.** Mail
from casey@freightroll.com passes DMARC through aligned SPF today, but it has
no aligned DKIM signature, so forwarding and some gateways that break SPF
also break DMARC. The fix is a Workspace admin action plus one DNS TXT record
(Admin console, Apps, Gmail, Authenticate email, generate key, publish
`google._domainkey.freightroll.com`, start authentication). **Not done: DNS
changes are Casey's call** (see the final list).

## Google sender requirements

- Volume: about 25 messages a day from the mailbox, far under the 5,000/day
  to-Gmail threshold that defines a **bulk sender**. The bulk-only rules (DMARC
  mandatory, one-click unsubscribe, aligned From) do not bind today; the
  all-sender rules do.
- All-sender rules: SPF or DKIM passes (SPF passes, aligned); forward and
  reverse DNS on sending IPs (Google's own); TLS (Google's own); spam rate
  under 0.3%: **not measurable here** (below).
- GAP drafts still carry the bulk-grade niceties: a signed unsubscribe link
  plus `List-Unsubscribe` and `List-Unsubscribe-Post` headers (seller-draft.ts).

## Reputation and outcome metrics

| Metric | Value | Source |
|---|---|---|
| Hard bounce rate, Gmail lane, 30 days | **0.80%** (6 hard of 751 sent) | mailbox DSNs classified by text |
| Hard bounce rate, Gmail lane, 90 days | **1.08%** (25 of 2,313) | same |
| Provider blocks (policy, not address), 30 / 90 days | 3 / 5 (for example "Message blocked" from gm.com, odfl.com, ollies.us) | same |
| Unclassified DSNs, 30 / 90 days | 4 / 12 | same |
| SendGrid bounces / blocks, July | 109 (0.44%) / 423 (1.71%) of 24,702 | SendGrid stats |
| SendGrid bounces / blocks, August | 63 (0.54%) / 224 (1.94%) of 11,575 | SendGrid stats |
| SendGrid spam reports | 1 in July (0.004%), 0 in August | SendGrid stats |
| SendGrid unsubscribes | 9 in July, 4 in August | SendGrid stats |
| SendGrid permanent lists (all time) | 2,577 bounces, 513 spam reports (all but one from 2018-2020), 691 unsubscribes, 0 blocks, 0 invalid | SendGrid suppression API |
| Local unsubscribe rows | 3 in total | `unsubscribed_emails` |
| Gmail spam rate / Postmaster domain reputation | **not available**: no Google Postmaster Tools access or data in this environment | none |

Reading: the Gmail lane's address-level failure rate is about 1%, blocks are
rare, and the SendGrid lane's blocks (1.7 to 1.9%) are sender or content
events that SendGrid itself does not put on a permanent list. SendGrid's
semantics are the model GAP routing now follows: **a block is not a
suppression; bounce, invalid, spam report and unsubscribe are.** The March
2026 Resend wave (13% "bounced", including 28 to our own domains) was a
provider event, not a list-quality event, which is why its flags are SOFT in
the new taxonomy.

## Operating targets (Gmail)

- Spam rate ideally under 0.1%, never at or above 0.3%. Not measurable until
  Postmaster Tools is connected for freightroll.com.
- Keep hard bounces near today's 1%: GAP only drafts to a persona with a valid
  address and no suppression, and each draft is one human-sent 1:1 email, so
  GAP adds no bursty volume.
- Stop and look if blocks climb in the mailbox (the three recent "Message
  blocked" notices are worth watching; one domain is gm.com).

## Owner actions (not done in this session)

1. Enable Google Workspace DKIM for freightroll.com and publish the TXT record
   (a DNS change; Casey's decision).
2. Connect Google Postmaster Tools for freightroll.com (and yardflow.ai if it
   ever sends), so spam rate and domain reputation become measurable.
3. Once DKIM is aligned and a few weeks of Postmaster data show a low spam
   rate, consider moving DMARC from `p=none` toward `quarantine`.
