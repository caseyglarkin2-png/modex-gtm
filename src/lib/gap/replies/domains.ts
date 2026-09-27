/** Consumer mail: a shared domain says nothing about the account (red team T9). */
export const FREEMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
]);

/** Our own domains: mail from these is never a buyer reply. */
export const OWN_DOMAINS: ReadonlySet<string> = new Set(['yardflow.ai', 'freightroll.com', 'dwtb.dev']);
