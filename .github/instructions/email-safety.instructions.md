---
applyTo: "src/lib/email/**,src/app/api/email/**"
description: "Email sending safety rules. Use when: modifying email send logic, bulk send, or webhook handling. Enforces auto-BCC, rate limiting, Dannon protection, and logging requirements."
---

# Email Safety Rules

- **ALWAYS** BCC casey@freightroll.com on every outbound email (primary inbox)
- **ALWAYS** log sends to `email_logs` table with `provider_message_id`
- **ALWAYS** validate inputs with Zod before sending
- **NEVER** send email to any @dannon.com or @danone.com address via cold outreach
- **NEVER** exceed rate limit (10 emails/min per IP)
- **ALWAYS** use Resend first, SendGrid as fallback only
- **ALWAYS** wrap body in branded HTML template before sending
