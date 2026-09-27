# T2 production proof: Kroger persona 1886 (READ ONLY)

<!-- verified:2026-09-26 -->

Run: `npx tsx scripts/gap/audit-person-history.ts 1886` against production inside a Postgres READ ONLY transaction, on the T2 code (branch feat/gap-redteam-release-b, before merge). Gmail not called.

Before T2: the newest email card forgot the hand-sent step 0 (history read per card) and offered step 0 again. After T2:

```json
{
  "personaId": 1886,
  "recipient": "joey.maggard@kroger.com",
  "cards": 7,
  "emailCards": [
    {
      "id": "cmuh1vrsx0007ld04p8amctu2",
      "action": "enroll_gap_sequence",
      "created_at": "2026-09-25T14:22:47.169Z",
      "human_action": null
    },
    {
      "id": "cmuh65c5s00077kkop8483cyo",
      "action": "enroll_gap_sequence",
      "created_at": "2026-09-25T16:22:11.920Z",
      "human_action": null
    },
    {
      "id": "cmuh66pro00077k6c7ee05djf",
      "action": "enroll_gap_sequence",
      "created_at": "2026-09-25T16:23:16.212Z",
      "human_action": "emailed"
    },
    {
      "id": "cmuhgm4ux0003ju04ldp8hdxa",
      "action": "enroll_gap_sequence",
      "created_at": "2026-09-25T21:15:11.769Z",
      "human_action": null
    },
    {
      "id": "cmuhrmns90003jv04axivyg6n",
      "action": "enroll_gap_sequence",
      "created_at": "2026-09-26T02:23:32.073Z",
      "human_action": null
    }
  ],
  "newestCard": {
    "id": "cmuhrmns90003jv04axivyg6n",
    "action": "enroll_gap_sequence",
    "rule": "enroll",
    "created_at": "2026-09-26T02:23:32.073Z"
  },
  "decisionsInHistory": 7,
  "sent": [
    {
      "step": 0,
      "engine": "manual",
      "card": "cmuh66pro00077k6c7ee05djf",
      "sentAt": "2026-09-25T20:59:19.000Z",
      "gmailSentMessageId": "1a0da5d97f8142c0"
    }
  ],
  "drafts": [],
  "unresolvedClaims": [],
  "nextTouchOnNewestCard": {
    "state": "waiting",
    "stepIndex": 1,
    "dueAt": "2026-10-01T20:59:19.000Z",
    "sent": [
      {
        "stepIndex": 0,
        "sentAt": "2026-09-25T20:59:19.000Z",
        "subject": "doors versus spots",
        "gmailSentMessageId": "1a0da5d97f8142c0",
        "gmailThreadId": "1a0da5c10f51fe73"
      }
    ],
    "threadFrom": {
      "stepIndex": 0,
      "sentAt": "2026-09-25T20:59:19.000Z",
      "subject": "doors versus spots",
      "gmailSentMessageId": "1a0da5d97f8142c0",
      "gmailThreadId": "1a0da5c10f51fe73"
    },
    "pendingDraftId": null
  },
  "step0OnNewestCard": "REFUSED first_touch_already_sent (sent 2026-09-25T20:59:19.000Z via manual on card cmuh66pro00077k6c7ee05djf)",
  "note": "Gmail thread not read (stub): a Gmail-thread reply would stop the sequence and is not reflected here."
}
```
