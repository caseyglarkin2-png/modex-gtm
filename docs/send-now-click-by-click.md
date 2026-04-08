# Send-Now Click-By-Click

Updated: 2026-04-08

## Safest path

### Step 1

Open a terminal in the repo root.

Expected working directory:

    /workspaces/modex-gtm

### Step 2

Run a dry run for the single safest contact.

    DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=flagship-wave-a-live

What you want to see:

1. Contact list: flagship-wave-a-live (1 contacts)
2. Mode: DRY RUN (preview only)
3. [niccole.pippin@genmills.com](mailto:niccole.pippin@genmills.com)
4. Summary shows Sent: 0, Failed: 0, Skipped: 1, Total: 1

If you see FAILED or SKIP: unsubscribed, stop.

### Step 3

Run the live send for the single safest contact.

    npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=flagship-wave-a-live

What you want to see:

1. Mode: LIVE SEND
2. OAuth token: OK
3. [niccole.pippin@genmills.com](mailto:niccole.pippin@genmills.com)
4. SENT (Gmail ID: ... ) + logged to email_logs
5. Summary shows Sent: 1, Failed: 0, Skipped: 0, Total: 1

### Step 4

Open the email analytics screen in the app and confirm the row exists.

Production route:

    /analytics/emails

What you want to see:

1. A recent email row for General Mills
2. Recipient [niccole.pippin@genmills.com](mailto:niccole.pippin@genmills.com)
3. Status is sent or delivered

### Step 5

If Step 4 looks clean, choose one target and run a dry run with the one-by-one filter.

    DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=overview-wave-live-follow-on --only=<target-email>

Example:

    DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=overview-wave-live-follow-on --only=kelly.killingsworth@kdrp.com

What you want to see:

1. Contact list: overview-wave-live-follow-on (1 contacts)
2. No FAILED lines
3. No SKIP: unsubscribed lines
4. The recipient listed matches the target email
5. The subject and asset route match the intended drip

### Step 6

Run the live send for that single target.

    npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=overview-wave-live-follow-on --only=<target-email>

What you want to see:

1. Mode: LIVE SEND
2. OAuth token: OK
3. One SENT line
4. Summary shows Sent: 1, Failed: 0, Skipped: 0, Total: 1

### Step 7

Refresh the email analytics screen.

What you want to see:

1. A new row for the target account
2. The recipient matches the email you just sent
3. Status is sent or delivered

## Wave Sent On 2026-04-08

1. Niccole Pippin, General Mills, [niccole.pippin@genmills.com](mailto:niccole.pippin@genmills.com)
2. Daniel Coe, Coca-Cola, [dcoe@coca-cola.com](mailto:dcoe@coca-cola.com)
3. Kelly Killingsworth, Keurig Dr Pepper, [kelly.killingsworth@kdrp.com](mailto:kelly.killingsworth@kdrp.com)
4. Bill Sideravage, Diageo, [bill.sideravage@diageo.com](mailto:bill.sideravage@diageo.com)
5. Jay Traficante, Keurig Dr Pepper, [jay.traficante@kdrp.com](mailto:jay.traficante@kdrp.com)
6. Deborah Finney, Keurig Dr Pepper, [deborah.finney@kdrp.com](mailto:deborah.finney@kdrp.com)

Use `--only=<target-email>` for any future one-off drips from this manifest.

## Do not email today

1. Frito-Lay
2. Hormel Foods
3. JM Smucker
4. The Home Depot
5. Georgia Pacific
6. H-E-B

Use the manual board for those accounts instead of email.
