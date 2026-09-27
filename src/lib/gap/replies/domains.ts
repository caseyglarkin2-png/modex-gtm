/** Consumer mail: a shared domain says nothing about the account (red team T9). */
export const FREEMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
]);

/** Our own domains: mail from these is never a buyer reply. */
export const OWN_DOMAINS: ReadonlySet<string> = new Set(['yardflow.ai', 'freightroll.com', 'dwtb.dev']);

/**
 * Out-of-office / auto-reply subjects, English and localized (Release C
 * review S6, re-review S7). One pattern for the GAP mailbox intake, the
 * account-reply hold and next-touch, so no reader treats a German
 * "Abwesenheitsnotiz" as a human reply.
 */
export const AUTO_REPLY_SUBJECT =
  /^\s*(automatic reply|auto(matic)?[- ]?reply|autoreply|auto:|ooo\b|out of (the )?office|abwesenheit\w*|automatische antwort|r[ée]ponse automatique|absence|absent|respuesta autom[áa]tica|fuera de la oficina|risposta automatica|fuori ufficio|afwezig|automatisch antwoord|resposta autom[áa]tica|ausente|autosvar|automatiskt svar|poza biurem)/i;

/** Per recipient (subject_type 'recipient'): a policy block that holds the person's next touch (Release C re-review S4). */
export const DELIVERY_BLOCKED_KIND = 'mailbox.delivery_blocked';
