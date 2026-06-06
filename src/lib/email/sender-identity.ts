/**
 * Sender identity resolution for outreach emails.
 *
 * The email signature (name, role, and "Book a Network Audit" link) is
 * parametrized by the sending user so a non-Casey sender gets the right
 * signature and an Outbox preview can show the real thing.
 *
 * Default behavior is unchanged: any unknown / undefined / null sender
 * resolves to Casey, so existing callers keep producing byte-identical output.
 */

export interface SenderIdentity {
  name: string;
  role: string;
  bookingLink?: string;
}

/**
 * Casey's canonical booking link. This value MUST stay identical to the
 * `BOOKING_LINK` constant in `./templates.ts` (the module default), so the
 * default signature is byte-identical to today's.
 */
const CASEY_BOOKING_LINK =
  'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

const CASEY_IDENTITY: SenderIdentity = {
  name: 'Casey Larkin',
  role: 'GTM Lead',
  bookingLink: CASEY_BOOKING_LINK,
};

// Placeholder identity for Jake. Casey must supply Jake's exact name, title,
// and booking link before this is used in real outreach; the booking link is
// intentionally omitted here so the audit link falls back to the default.
const JAKE_IDENTITY: SenderIdentity = {
  name: 'Jake',
  role: 'FreightRoll',
};

/**
 * Resolve the sender identity for a given sender email address.
 * Matching is case-insensitive. Unknown / undefined / null falls back to Casey.
 */
export function resolveSenderIdentity(email?: string | null): SenderIdentity {
  const key = (email ?? '').trim().toLowerCase();
  switch (key) {
    case 'jake@freightroll.com':
      return JAKE_IDENTITY;
    case 'casey@freightroll.com':
    case 'caseyglarkin2@gmail.com':
      return CASEY_IDENTITY;
    default:
      return CASEY_IDENTITY;
  }
}
