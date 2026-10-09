# GAP OS deployment and configuration receipt

STATUS: RECEIPT, generated 2026-10-09T11:52:37.154Z by scripts/gap/deployment-receipt.ts (reads only; no secret values; regenerate rather than edit).
<!-- verified:2026-10-09 -->

Three things kept apart: the LOCAL CODE this receipt was generated from, the DEPLOYED ENVIRONMENT (the deployment Vercel serves on the production alias and the environment it snapshotted at build time), and the PROJECT SETTINGS (what the Vercel project holds now; a change here reaches production only with the next deploy).

## 1. Local code

- Commit fd4091bc on feat/gap-execution-engine (uncommitted changes present); origin/main fd4091bc.
- Local code IS the deployed commit (deployed fd4091bc).

## 2. Deployed environment

- Production alias modex-gtm.vercel.app serves deployment dpl_91j7Tf4qZPjJqqbBo7AMWCX6eVNU, state READY, commit fd4091bc, ready 2026-10-09T11:51:11.833Z (alias binding from the API: modex-gtm.vercel.app).
- Other recent production deployments: dpl_G9KX6ZmwES9f719vk8jsrCcay6r1 READY a195467f 2026-10-09T01:47:22.876Z; dpl_8uZtsdeXsHBH7wNZsBQWomBESN24 READY cfce2f27 2026-10-09T01:42:56.040Z; dpl_ChJ8apYhQmWeQ9UgmBrNGHXno6rq READY ed9976e8 2026-10-09T01:37:25.771Z; dpl_F7CbnmnmAxGi2o6MFkY3n5sLiQtY READY 672b8694 2026-10-09T01:14:25.843Z.
- The environment a deployment runs with is the project environment snapshotted at ITS build; a project setting changed after that time is not in it until the next deploy.
- Crons in the deployed build: not read (the local vercel.json below is the code's declaration; the deployed set is what Vercel registered at build).

## 3. Project settings (Vercel, now)

- Project modex-gtm (prj_rSVCgdXqOqsXEmlrS1v8v2eoPV9V) in team team_TkAjtDWif68PlLtgaIYZ5PLr.
- Production environment variables (64 names; values are never in this receipt): AI_GATEWAY_API_KEY [encrypted], AI_GATEWAY_MODEL [encrypted], APOLLO_API_KEY [encrypted], AUTH_SECRET [encrypted], AUTH_TRUST_HOST [encrypted], AUTO_DISPATCH_DAILY_ENABLED [encrypted], CLAWD_CONTROL_PLANE_TOKEN [encrypted], CLAWD_CONTROL_PLANE_URL [encrypted], CODEX_APOLLO_API_KEY_MASTER [encrypted], CONCIERGE_WEBHOOK_SECRET [encrypted], CRON_SECRET [encrypted], DATABASE_URL [encrypted], EDGE_CONFIG [encrypted], ELEVENLABS_API_KEY [encrypted], ELEVENLABS_VOICE_ID [encrypted], FROM_EMAIL [encrypted], FROM_NAME [encrypted], GAP_ACTION_SECRET [encrypted], GAP_AGENT_TASKS_ENABLED [plain], GAP_AUTO_ENROLL_ENABLED [plain], GAP_AUTO_ENROLL_SHADOW [plain], GAP_BACKGROUND_RESEARCH_ENABLED [plain], GAP_BRIEFING_ENABLED [plain], GAP_CRM_LOG_METHOD [plain], GAP_GMAIL_USER_EMAIL [plain], GAP_GOOGLE_DWD_SA_JSON [sensitive], GAP_HUBSPOT_MIRROR_ENABLED [plain], GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED [plain], GAP_HYPOTHESIS_ENABLED [plain], GAP_MESSAGE_COMPILER_ENABLED [plain], GAP_OS_ENABLED [plain], GAP_REPLY_CLASSIFICATION_ENABLED [plain], GAP_ROUTING_CRON_ENABLED [plain], GAP_ROUTING_ENABLED [plain], GEMINI_API_KEY [sensitive], GOOGLE_CLIENT_ID [encrypted], GOOGLE_CLIENT_SECRET [sensitive], GOOGLE_MAPS_STATIC_API_KEY [encrypted], GOOGLE_REFRESH_TOKEN [encrypted], HUBSPOT_ACCESS_TOKEN [encrypted], HUBSPOT_LOGGING_ENABLED [encrypted], NEXT_PUBLIC_APP_URL [encrypted], NEXT_PUBLIC_CALENDLY_LINK [encrypted], NEXT_PUBLIC_MICROSITE_BASE_URL [encrypted], NEXT_PUBLIC_POSTHOG_HOST [plain], NEXT_PUBLIC_POSTHOG_KEY [plain], NEXTAUTH_URL [encrypted], NOTIFICATIONS_PAUSED [plain], OPENAI_API_KEY [encrypted], OUTREACH_PAUSED [encrypted], POUNCE_INGEST_TOKEN [encrypted], QUEUE_AGENT_SECRET [encrypted], ROI_LEAD_SECRET [encrypted], SALES_AGENT_API_KEY [sensitive], SALES_AGENT_BASE_URL [encrypted], SLACK_BOT_TOKEN [encrypted], SLACK_CHANNEL_ID [encrypted], SLACK_OPS_CHANNEL_ID [encrypted], SLACK_SIGNING_SECRET [encrypted], SOURCE_APPROVAL_GATE_ENABLED [encrypted], SOURCE_CC_BULK_ENABLED [encrypted], SOURCE_EVIDENCE_INGEST_ENABLED [encrypted], TOKEN_ENCRYPTION_KEY [encrypted], UNSUBSCRIBE_SECRET [encrypted].
- Non-secret GAP flags as the project holds them now (17): GAP_ACTION_SECRET=(not shown), GAP_AGENT_TASKS_ENABLED=true, GAP_AUTO_ENROLL_ENABLED=false, GAP_AUTO_ENROLL_SHADOW=false, GAP_BACKGROUND_RESEARCH_ENABLED=true, GAP_BRIEFING_ENABLED=true, GAP_CRM_LOG_METHOD=connected_inbox, GAP_GMAIL_USER_EMAIL=(not shown), GAP_GOOGLE_DWD_SA_JSON=(not shown), GAP_HUBSPOT_MIRROR_ENABLED=false, GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED=true, GAP_HYPOTHESIS_ENABLED=true, GAP_MESSAGE_COMPILER_ENABLED=true, GAP_OS_ENABLED=true, GAP_REPLY_CLASSIFICATION_ENABLED=true, GAP_ROUTING_CRON_ENABLED=true, GAP_ROUTING_ENABLED=true.
- Crons declared by the local vercel.json (17): /api/cron/check-inbox/ @ */5 * * * *; /api/cron/sync-hubspot/ @ 0 */6 * * *; /api/cron/drip-sequence/ @ 0 13 * * *; /api/cron/reenrich-contacts/ @ 0 */8 * * *; /api/cron/dispatch-daily/ @ 0 11 * * 1-5; /api/cron/qualification/ @ 30 11 * * *; /api/cron/warm-dispatch/ @ 15 12 * * 1-5; /api/cron/pounce-scan/ @ 5 13 * * *; /api/cron/refresh-intel/ @ 0 13 * * 1; /api/cron/gap-mailbox/?mode=apply @ */10 * * * *; /api/cron/gap-background-research/ @ 40 * * * *; /api/cron/gap-signal-process/ @ */30 * * * *; /api/cron/gap-signal-discovery/ @ 15 */2 * * *; /api/cron/gap-hubspot-replies/?mode=apply @ 45 12 * * *; /api/cron/gap-routing/ @ 30 10 * * 1-5; /api/cron/gap-briefing/ @ 5 * * * *; /api/cron/gap-agent-tasks/ @ */5 * * * *.

## 4. Baseline pointer

- docs/gap/STABLE_BASELINE.md says: Production SHA: fd4091bc (PR #432, the commercial-context and execution audit C01-C60 with the client-chunk build fix b76dc1d5; Vercel `dpl_91j7Tf4qZPjJqqbBo7AMWCX6eVNU` READY 2026-10-09T11:51:11Z; rollback a195467f `dpl_G9KX6ZmwES9f719vk8j ...
- That pointer AGREES with the deployed commit (fd4091bc).

## 5. Last successful source reads (health)

- Not read this run: the health route needs a seller session; pass --health <json file saved from /api/gap/health> to include it. Absent here means unread, not healthy.

## 6. Unread

- Every source above was read.
