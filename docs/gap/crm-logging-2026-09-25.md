# GAP direct send: HubSpot CRM logging (proof, 2026-09-25)
<!-- verified:2026-09-25 -->

STATUS: SHIPPED 2026-09-25

## Result

`crm_log_method = connected_inbox`. No BCC. The HUMAN_APPROVED_1TO1 wire
invariant stays: exactly one TO, zero CC, zero BCC.

## Portal state read (HubSpot 3819073, rig, read-only)

- Connected individual inboxes (Settings > General > Email): `casey@yardflow.ai` (G Suite, Enabled, inbox automation OFF) and `casey@freightroll.com` (G Suite, Enabled, inbox automation ON).
- Contact email logging rule (Settings > Objects > Activities > Email Log & Track): **Log all emails** (known contacts, users with connected emails) is selected; "Log replies only" is not.
- Never Log: `*@freightroll.com` (all users) only. Prospect domains are not on it.
- The portal's manual-logging BCC address exists; it is NOT used and is never shown in the UI.

## Proof send

One internal send through the real direct-send wire (`gmailDirectAdapter`, `sendViaGmail`, purpose HUMAN_APPROVED_1TO1, with a confirmation), while clawd's `outreach` motion was halted:

| field | value |
|---|---|
| sender | casey@yardflow.ai (Gmail API, domain-wide delegation) |
| recipient | caseyglarkin2+dealwiretest@gmail.com (HubSpot contact 233849960577, Casey's own alias) |
| Gmail message id | 1a0dadb7ace48c87 |
| sent | 2026-09-25T23:16:42Z |
| HubSpot activity | EMAIL 117453956458, from casey@yardflow.ai, status SENT, created 23:17:25Z (43 s later) |
| activities on the contact | exactly 1 |
| mechanism | connected inbox + "Log all emails" (no BCC, no API engagement) |

No prospect was sent anything.

## How it is used

- `GAP_CRM_LOG_METHOD=connected_inbox` (server config) plus a known HubSpot contact on the person: the receipt records `crmLogMethod: connected_inbox`, `crmLogStatus: expected`, `hubspotContactId`. Without a known contact: `none`, and the confirmation shows HubSpot UNAVAILABLE.
- The activity id is not read back per send (debt: an optional read-back to flip `expected` to `logged` with the activity id). A logging gap never retries Gmail.
- Exactly one method: no BCC is added and no HubSpot engagement is created by GAP.
