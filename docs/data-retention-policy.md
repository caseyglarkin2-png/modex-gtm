# Data Retention Policy

## Email Logs (`email_logs` table)
- **Active**: Retained indefinitely while contact is active
- **Purge trigger**: 12 months after last email send to a contact with no reply/engagement
- **Hard delete**: Redact `subject` and `body` fields, keep metadata (date, status, provider_message_id) for audit

## Unsubscribed Emails (`unsubscribed_emails` table)
- **Retained forever** — required for CAN-SPAM compliance (suppression list must persist)

## Activities (`activities` table)
- **Active**: Retained indefinitely for pipeline history
- **Archive**: Move to cold storage after 24 months of account inactivity

## Mobile Captures (`mobile_captures` table)
- **Active**: Retained for 12 months after capture
- **Purge**: Delete badge photos and raw notes after 12 months (keep structured data)

## Generated Content (`generated_content` table)
- **Active**: Retained for 6 months
- **Purge**: Delete generated email drafts older than 6 months (not sent)

## HubSpot Sync Metadata (future)
- `hubspot_contact_id`, `hubspot_company_id` on local records: retained as long as the local record exists
- Webhook event dedup IDs: purge after 7 days
- Sync cursors: overwrite in place (single row per cursor type)

## Microsite Engagement (`microsite_engagements` table)
- **Active**: Retained for 12 months
- **Archive**: Aggregate into account-level analytics, then purge individual page views

## Implementation Notes
- Retention jobs will run as Vercel crons (Sprint 7+)
- No PII is stored outside the database (no local files, no S3 buckets)
- All purge operations are soft-delete first, hard-delete after 30-day grace period
- GDPR/CCPA deletion requests: honor within 72 hours via manual script
