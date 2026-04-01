---
applyTo: "src/lib/email/**,src/app/api/email/**"
description: "Email sending safety rules. Use when: modifying email send logic, bulk send, or webhook handling. Enforces rate limiting, Dannon protection, humanization rules, and logging requirements."
---

# Email Safety Rules

- **NEVER** auto-BCC on email sends. Casey gets copies via Gmail Sent folder automatically.
- **ALWAYS** log sends to `email_logs` table with `provider_message_id`
- **ALWAYS** validate inputs with Zod before sending
- **NEVER** send email to any @dannon.com or @danone.com address via cold outreach
- **NEVER** send email to any @bluetriton.com address (existing FreightRoll relationship)
- **NEVER** exceed rate limit (10 emails/min per IP)
- **ALWAYS** send via Gmail API (`sendEmail` from `src/lib/email/client.ts`). No other providers.
- **ALWAYS** wrap body in branded HTML template before sending

# Humanization Rules (anti-AI-detection)

- **NEVER** use em dashes (—) in email copy. Use periods, commas, hyphens, or line breaks instead. Em dashes are the #1 giveaway that AI wrote the email.
- **NEVER** use semicolons in email body copy. Real sales emails don't have semicolons.
- **AVOID** compound sentences. Keep sentences short and declarative. Under 20 words.
- **AVOID** parallel structure (listing 3+ items in the same grammatical pattern). Vary sentence structure.
- **AVOID** words like "leverage", "utilize", "facilitate", "streamline", "landscape", "ecosystem" in outreach.
- **PREFER** contractions (don't, can't, won't) over formal ("do not", "cannot").
- **PREFER** short paragraphs (1-3 sentences max).
- Emails should read like a human typed them in Gmail, not like a template engine produced them.
