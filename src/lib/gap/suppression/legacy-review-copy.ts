/**
 * Seller sentences for the legacy suppression review (WHO truth, 2026-10-05). Pure: every function maps the
 * review's evidence to plain words. Voice: no em dashes, yards plural, no machine tokens where a sentence will do.
 * The seller reads WHY this person is blocked and WHAT WOULD HAVE TO BE TRUE to clear it; the only thing the
 * surface can clear is the stale local Modex flag, and only on Casey's confirmed click.
 */
import type { SuppressionReviewClass, SuppressionSourceRead } from './legacy-review';

export const SOURCE_LABEL: Record<SuppressionSourceRead['source'], string> = {
  modex_flag: 'GAP do-not-contact flag',
  modex_email_status: 'GAP email status',
  unsubscribed_emails: 'Unsubscribe list',
  hubspot_optout: 'HubSpot opt-out',
  hubspot_bounce: 'HubSpot bad address, hard bounce or quarantine',
  clawd_contract: 'clawd cross-plane contract (five legs)',
  email_log_bounces: 'Email log bounces',
  email_log_deliveries: 'Email log deliveries after the last bounce',
  gap_ledger: 'GAP ledger (reviews, refusals, owner decisions)',
  override_history: 'Prior clears and reverts',
  gmail_dsn: 'Gmail delivery failure notices',
};

export const VERDICT_LABEL: Record<SuppressionSourceRead['verdict'], string> = {
  hit: 'Blocks',
  clear: 'Clear',
  unknown: 'Could not be read',
  not_read: 'Not read',
};

export const CLASS_COPY: Record<SuppressionReviewClass, { title: string; body: string }> = {
  CONFIRMED_SUPPRESSION: {
    title: 'Confirmed suppression',
    body: 'A hard-safety source says do not contact. This surface can never clear it.',
  },
  LEGACY_CONFLICT: {
    title: 'Legacy local flag, contradicted by later deliveries',
    body: 'Every hard-safety source is clean. The only block is the stale local Modex flag, and the same address accepted mail after the bounce.',
  },
  UNRESOLVED: {
    title: 'Not resolved',
    body: 'Something still has to be true before the flag can be read as stale. Nothing is cleared on an unread authority or on missing evidence.',
  },
  CLEAR: {
    title: 'Clear',
    body: 'No suppression on any plane. Nothing to clear.',
  },
};

/** The inline confirmation the seller reads before the click. Names exactly what the clear touches. */
export const CLEAR_CONFIRMATION = 'Clears only the local do-not-contact flag and the historical bounced status on this GAP record. It never touches an unsubscribe, a HubSpot opt-out, a hard bounce or clawd.';

export const CLEAR_TOUCHES = ['the local do-not-contact flag on the GAP record', 'the historical bounced email status on the GAP record'] as const;

const day = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : 'an unknown date');

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export interface ReviewFacts {
  name: string;
  email: string | null;
  localFlag: boolean;
  doNotContact: boolean;
  emailStatus: string | null;
  lastBounceAt: string | null;
  laterDeliveries: Array<{ at: string; subject: string | null; status: string }>;
  contractAgrees: boolean;
}

/** WHY this person is blocked, one sentence per reason, strongest first. */
export function whyBlockedLines(cls: SuppressionReviewClass, sources: SuppressionSourceRead[], f: ReviewFacts): string[] {
  const by = new Map(sources.map((s) => [s.source, s]));
  const out: string[] = [];
  const hard = sources.filter((s) => s.verdict === 'hit' && s.hard);
  for (const s of hard) {
    switch (s.source) {
      case 'unsubscribed_emails':
        out.push(`${f.name} is on the unsubscribe list (since ${day(s.at)}). That is the recipient's own decision and this surface can never clear it.`);
        break;
      case 'hubspot_optout':
        out.push(`HubSpot records an email opt-out for ${f.name}. An opt-out is the recipient's decision and this surface can never clear it.`);
        break;
      case 'hubspot_bounce':
        out.push(`HubSpot marks the address as bad: ${s.detail}. A proven bad address is never cleared here; find a current address instead.`);
        break;
      case 'clawd_contract':
        out.push(`clawd blocks for a reason beyond the local flag: ${s.detail}. A suppression on another plane is cleared only at that plane, never here.`);
        break;
      case 'email_log_bounces':
        out.push(`The address hard bounced on ${day(s.at)} and nothing was delivered to it afterwards. A hard bounce is never cleared here; find a current address instead.`);
        break;
      case 'modex_email_status':
        out.push(`The GAP record carries a hard email status (${f.emailStatus ?? 'unknown'}). A proven bad address is never cleared here.`);
        break;
      default:
        out.push(`${SOURCE_LABEL[s.source]} says do not contact: ${s.detail}.`);
    }
  }
  const unread = sources.filter((s) => s.verdict === 'unknown');
  for (const s of unread) out.push(`${SOURCE_LABEL[s.source]} could not be read (${s.detail}). Nothing is cleared on an unread authority.`);

  if (f.localFlag) {
    const parts: string[] = [];
    if (f.doNotContact) parts.push('the record is marked do not contact');
    if ((f.emailStatus ?? '').toLowerCase() === 'bounced') parts.push("the email status reads 'bounced'");
    out.push(`The local GAP flag is set: ${parts.join(' and ')} on this record, written by the March 2026 Resend-era wave whose bounce type was never recorded.`);
    const contract = by.get('clawd_contract');
    if (contract?.verdict === 'hit' && !contract.hard) out.push('clawd blocks for exactly one reason: this record\'s own local flag, echoed back through its modex leg. No other plane says stop.');
    if (contract?.verdict === 'clear' && f.doNotContact) out.push('clawd answers clear while the local do-not-contact flag is set: the planes disagree, so nothing is cleared until they agree.');
    const bounces = by.get('email_log_bounces');
    if (bounces?.verdict === 'hit' && !bounces.hard && f.lastBounceAt) out.push(`The email log shows ${bounces.detail}.`);
    if (f.laterDeliveries.length > 0) {
      out.push(`${plural(f.laterDeliveries.length, 'message was', 'messages were')} delivered to the same address after the last bounce on ${day(f.lastBounceAt)} (${f.laterDeliveries.map((d) => day(d.at)).join(', ')}). The address accepts mail.`);
    } else if (f.lastBounceAt) {
      out.push(`No delivery to this address is on record after the last bounce on ${day(f.lastBounceAt)}, so the bounce stands unproven either way.`);
    } else {
      out.push('No bounce and no later delivery to this address is on record, so the flag has no evidence behind it either way.');
    }
    if (hard.length === 0 && unread.length === 0 && cls === 'LEGACY_CONFLICT') out.push('Nothing hard is recorded: no unsubscribe, no HubSpot opt-out, no bad address, no hard bounce, no clawd, SendGrid or verbal do-not-send.');
  }
  if (cls === 'CLEAR') out.push(`No suppression on any plane for ${f.name}. Nothing to clear.`);
  if (!f.email) out.push('The record has no email address, so no authority can be read for it.');
  return out;
}

/** WHAT WOULD HAVE TO BE TRUE to clear it. Empty when nothing is blocked. */
export function whatWouldClearLines(cls: SuppressionReviewClass, sources: SuppressionSourceRead[], f: ReviewFacts): string[] {
  const out: string[] = [];
  if (cls === 'CLEAR') return out;
  if (cls === 'CONFIRMED_SUPPRESSION') {
    out.push('Nothing on this surface. A real unsubscribe, HubSpot opt-out, hard bounce or clawd suppression is cleared only by the recipient or the owner at that source, never here.');
    const hard = sources.filter((s) => s.verdict === 'hit' && s.hard);
    if (hard.some((s) => s.source === 'hubspot_bounce' || s.source === 'email_log_bounces' || s.source === 'modex_email_status')) out.push('A verified current address for this person would be a new record, not a cleared flag.');
    return out;
  }
  if (cls === 'LEGACY_CONFLICT') {
    out.push("Casey's confirmed click on CLEAR LEGACY LOCAL FLAG. Every hard-safety source is clean and the only block is the stale local flag.");
    return out;
  }
  // UNRESOLVED: say exactly which evidence is missing.
  if (!f.email) out.push('An email address on the record. Without one no authority can be read.');
  // Without an email the contract is unknown only because there was nothing to ask; the address line above covers it.
  const unread = sources.filter((s) => s.verdict === 'unknown' && (f.email || s.source !== 'clawd_contract'));
  if (unread.length > 0) out.push(`A readable answer from ${unread.map((s) => SOURCE_LABEL[s.source]).join(' and ')}. Re-open the review once it answers.`);
  if (f.localFlag && f.email && unread.length === 0) {
    if (!f.contractAgrees) out.push('clawd and the local record agreeing on the flag. Re-open the review once the modex leg has caught up.');
    else if (f.laterDeliveries.length === 0) out.push(`At least one delivery, open, click or reply to ${f.email} dated after the last bounce (${day(f.lastBounceAt)}), or a verified current address.`);
  }
  if (out.length === 0) out.push('A fresh review once the evidence changes.');
  return out;
}

export function clearWhy(cls: SuppressionReviewClass): string {
  switch (cls) {
    case 'LEGACY_CONFLICT':
      return 'Allowed: every hard-safety source is clean, every authority answered, and the only block is the stale local flag that later deliveries to the same address contradict. Casey confirms the click.';
    case 'CONFIRMED_SUPPRESSION':
      return 'Not allowed: a hard-safety source says do not contact. That can never be cleared here.';
    case 'UNRESOLVED':
      return 'Not allowed: an authority could not be read or the evidence is missing. Nothing is cleared on an unread authority.';
    case 'CLEAR':
      return 'Not needed: nothing is blocked.';
  }
}

/** The outcome sentence after the click. */
export function clearOutcomeSentence(r: { ok: true; name: string; email: string } | { ok: false; reason: string; detail: string }): string {
  if (r.ok) return `Cleared the legacy local flag on ${r.name}'s GAP record (${r.email}): the record is no longer marked do not contact and the email status reads unverified. Nothing else was touched; the send-time gate still re-reads every plane before any email.`;
  switch (r.reason) {
    case 'hard_suppression':
      return `Kept blocked: ${r.detail}`;
    case 'authority_unreadable':
      return `Kept blocked: ${r.detail}`;
    case 'not_legacy_conflict':
      return `Kept blocked: ${r.detail}`;
    case 'email_mismatch':
      return `Kept blocked: ${r.detail}`;
    case 'row_changed':
      return `Kept blocked: ${r.detail}`;
    case 'not_confirmed':
      return 'Kept blocked: the clear was not confirmed.';
    default:
      return `Kept blocked: ${r.detail || r.reason.replace(/_/g, ' ')}.`;
  }
}
