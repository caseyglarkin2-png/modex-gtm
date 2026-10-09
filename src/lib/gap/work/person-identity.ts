/**
 * PERSON TO ACCOUNT (C02, C03 of the commercial-context audit, 2026-10-08). Pure.
 *
 * A person who wrote to the mailbox is placed at an account through the SAME identity machinery the opportunity
 * resolver uses (identity/resolve.ts: HubSpot company id, verified domain, registered alias, normalized name), in
 * this order: the GAP persona's account, the HubSpot company of the contact (when the CRM read carried it), the
 * thread's account, the sender domain. A competing match stays AMBIGUOUS (said, never guessed); nothing here
 * creates a persona, an account or a CRM record.
 */
import { resolveIdentity, type IdentityContext, type IdentityVia } from '../identity/resolve';
import { emailDomain } from '../opportunity/active-opportunity';

export type PersonVia = 'persona' | 'hubspot_contact' | IdentityVia | null;

export interface PersonAccount {
  accountName: string | null;
  via: PersonVia;
  /** Two accounts claimed the sender's domain or name: the person stays unplaced until Casey names the account. */
  ambiguous: boolean;
  domain: string | null;
}

export interface PersonAccountInput {
  email: string;
  persona?: { account_name?: string | null } | null;
  /** The HubSpot company ids the CRM associates with this contact (a live read; empty when unread). */
  hubspotCompanyIds?: readonly string[];
  threadAccount?: string | null;
  identity?: IdentityContext | null;
}

const FREEMAIL = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'me.com', 'live.com', 'msn.com', 'protonmail.com']);

export function resolvePersonAccount(input: PersonAccountInput): PersonAccount {
  const domain = emailDomain(input.email);
  if (input.persona?.account_name) return { accountName: input.persona.account_name, via: 'persona', ambiguous: false, domain };
  const ctx = input.identity ?? null;
  if (ctx) {
    for (const id of input.hubspotCompanyIds ?? []) {
      const r = resolveIdentity(ctx, { hubspotCompanyId: id });
      if (r.ok) return { accountName: r.accountName, via: 'hubspot_contact', ambiguous: false, domain };
    }
  }
  if (input.threadAccount) {
    // The thread names an account; through the identity context it may be an alias of the canonical name.
    const r = ctx ? resolveIdentity(ctx, { rawName: input.threadAccount }) : null;
    if (r?.ok && !r.conflict) return { accountName: r.accountName, via: r.via, ambiguous: false, domain };
    if (r && !r.ok && r.reason === 'ambiguous_identity') return { accountName: null, via: null, ambiguous: true, domain };
    if (!ctx) return { accountName: input.threadAccount, via: 'normalized', ambiguous: false, domain };
  }
  if (ctx && domain && !FREEMAIL.has(domain)) {
    const r = resolveIdentity(ctx, { domain });
    if (r.ok && !r.conflict) return { accountName: r.accountName, via: r.via, ambiguous: false, domain };
    if (r.ok && r.conflict) return { accountName: null, via: null, ambiguous: true, domain };
    if (!r.ok && r.reason === 'ambiguous_identity') return { accountName: null, via: null, ambiguous: true, domain };
  }
  return { accountName: null, via: null, ambiguous: false, domain };
}
