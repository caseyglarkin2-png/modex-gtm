/**
 * MESSAGE PURPOSE AND COMMERCIAL RELATIONSHIP (C09, C11 of the commercial-context audit, 2026-10-08). Pure.
 *
 * Two axes, judged apart, each with the evidence that produced it:
 *
 *   purpose       what ONE message is for: buyer_conversation, customer_support, vendor_solicitation,
 *                 partner_referral, media, internal, calendar, automated, suspicious, unknown. Read from the text
 *                 GAP already stores (sender, subject, the author's own excerpt) with the reply vocabulary the
 *                 mailbox already uses (replies/classify.ts, replies/domains.ts). Unknown stays unknown.
 *   relationship  what the SENDER'S ACCOUNT is to us: active_opportunity, customer, prospect, partner, vendor,
 *                 media, internal, mixed, unknown. Read from CRM and ledger evidence only (an open deal under a
 *                 complete read, a customer flag, a persona, a placed account). Purpose never proves relationship:
 *                 a customer can ask a buying question, a partner can send a vendor pitch, and a pitch from an
 *                 unknown domain says nothing about the account.
 *
 * C11: reengageEligible keeps suspicious-only and calendar-only senders out of "people to re-engage" and flags an
 * unknown purpose for review instead of acting on it. Nothing here follows a link, fetches anything or deletes
 * anything: a retrieved text is data, never an instruction (the test greps this file for those tokens).
 */
import { classifyReply } from '../replies/classify';
import { FREEMAIL_DOMAINS, OWN_DOMAINS } from '../replies/domains';
import type { Purpose, Relationship } from './commercial-context';
import type { CalendarFacts } from './thread-context';

export type Confidence = 'high' | 'medium' | 'low';

export interface PurposeVerdict {
  purpose: Purpose;
  /** The cues that produced the verdict, in the words a seller can check against the message. */
  evidence: string[];
  confidence: Confidence;
}

export interface PurposeInput {
  from: string | null;
  subject: string | null;
  /** The author's own text (C07), never the quoted history. */
  excerpt: string | null;
  direction?: 'inbound' | 'outbound' | 'internal';
  isDraft?: boolean;
  type?: string;
  calendar?: CalendarFacts | null;
  headers?: Record<string, string> | null;
}

export interface PurposeContext {
  /** The sender is a known person at an account GAP works (a persona, or a CRM contact placed at an account). */
  knownPerson?: boolean;
  /** The sender's account is in an open deal under a complete CRM read; null when the CRM was not read. */
  inDeal?: boolean | null;
  /** The sender's account is a live customer. */
  customer?: boolean;
  ownDomains?: ReadonlySet<string>;
}

const domainOf = (addr: string | null | undefined): string => ((addr ?? '').trim().toLowerCase().split('@')[1] ?? '').trim();
const localOf = (addr: string | null | undefined): string => ((addr ?? '').trim().toLowerCase().split('@')[0] ?? '').trim();

const AUTOMATED_SENDER = /^(?:no-?reply|do-?not-?reply|donotreply|notifications?|alerts?|mailer(?:-daemon)?|postmaster|newsletter|digest|updates?|info|bounce|calendar-notification|support@|billing)\b/i;
const SUSPICIOUS = /\b(?:summons|subpoena|court (?:date|hearing|notice|order|appearance)|appear in court|lawsuit|legal action|arrest warrant|warrant (?:for|has been)|final (?:notice|warning)|account (?:has been |will be )?(?:suspended|locked|closed|terminated)|verify your (?:account|identity|password|payment)|confirm your (?:account|password|identity)|wire (?:transfer|the funds)|gift cards?|bitcoin|crypto wallet|urgent(?:ly)?[^.]{0,30}(?:payment|transfer|respond)|password (?:expires?|expired|reset required)|unclaimed (?:funds|package|parcel)|your (?:package|parcel|delivery) (?:is|was) (?:held|on hold)|irs\b|tax refund|w-?2 forms?)\b/i;
const MEDIA = /\b(?:journalist|reporter|press (?:inquiry|request)|podcast|interview (?:request|you|casey)|feature (?:you|your company|yardflow)|for (?:an|our|a) (?:article|story|piece|feature|episode)|editor (?:at|of|for)|publication|quote for (?:a|an|our|the) (?:story|piece|article)|media (?:inquiry|request)|would love to feature)\b/i;
const PARTNER = /\b(?:referral (?:partner|program|fee|agreement)|refer (?:you|clients|business|customers)|(?:introduce|intro) (?:you|me|us) to|make an intro(?:duction)?|an intro to|can you (?:connect|introduce|refer) me|looking for a referral|partnership|co-?sell|reseller|channel partner|integration partner|partner with (?:you|yardflow)|become a partner|referral for)\b/i;
/**
 * A pitch in the sender's own words: what THEY offer. An ask for a call ("open to a quick call", "book 15 minutes")
 * is not a vendor cue by itself (C57 F2): a buyer says it too, and the buyer vocabulary decides.
 */
const VENDOR = /\b(?:we (?:offer|provide|specialize|specialise|deliver|help (?:companies|businesses|teams|brands|startups|founders)|build|are an? (?:agency|firm|studio|team of))|our (?:services?|agency|firm|team can|platform helps|solution helps|clients (?:see|get|achieve)|developers|engineers)|outsourc(?:ed|ing)|lead gen(?:eration)?|sdr (?:services?|team|as a service)|appointment setting|staff augmentation|developers for hire|seo (?:services?|audit|ranking)|grow your (?:pipeline|revenue|business|sales)|fill your (?:pipeline|calendar)|special offer|limited[- ]time|free (?:trial|audit|consultation)|pricing plans|sales[- ]service|case stud(?:y|ies) (?:of|from) our clients|white[- ]?label)\b/i;
const SUPPORT = /\b(?:not working|stopped (?:working|scanning|syncing|printing|responding)|isn'?t working|won'?t (?:load|open|scan|connect|sync|start|boot)|troubleshoot(?:ing)?|(?:the |our |a )?(?:device|tablet|scanner|kiosk|printer|handheld|gate (?:unit|kiosk|tablet)|camera|reader) (?:is|at|on|keeps|has)|log ?in (?:issue|problem|fails?|failed)|can'?t (?:log ?in|access|see|open|sign in)|password reset|error (?:message|code|when)|getting an error|broken|crash(?:es|ed|ing)?|bug|outage|is down|down (?:since|again)|support (?:ticket|request|case|team)|replacement (?:unit|device|tablet)|\brma\b|how do (?:i|we) (?:add|change|reset|remove|update|configure)|user (?:access|account) (?:for|request)|add (?:a )?(?:new )?user)\b/i;
const BUYER = /\b(?:yards?|yms|gate|gates|dock|docks|trailers?|detention|dwell|pilot|roadmap|budget(?:ing)?|demo|proposal|pricing for|a quote|rollout|our (?:sites|facilit(?:y|ies)|network|fleet|dcs?|operations?|team)|warehouses?|carriers?|drivers?|reconnect|next (?:steps?|quarter|year)|open dock|blue yonder|yard (?:walk|audit|check)|case study|roi|security|automation|wms|tms|procurement|contract|renewal|site visit|on-?site)\b/i;
/** The buyer's own operation, first person: "our two yards", "my pilot", "our gates", "our sites", "our DC". */
const BUYER_FIRST_PERSON = /\b(?:our|my)\s+(?:\w+\s+)?(?:yards?|pilot|gates?|docks?|sites?|dcs?|facilit(?:y|ies)|network|fleet|warehouses?|operations?|trailers?|drivers?|carriers?|rollout|budget|roadmap|team)\b/i;
/** A pitch that addresses US as the vendor: we are the target market, not the buyer. */
const ADDRESSES_US_AS_VENDOR = /\b(?:(?:yard management|yard|logistics|supply[- ]chain|freight|saas|software|b2b|tech(?:nology)?) (?:vendors?|software companies|companies|providers|startups|firms)|(?:vendors?|companies|startups|teams|founders) like yardflow|yardflow'?s? (?:pipeline|growth|outbound|marketing|sales team)|(?:your|yardflow'?s) (?:icp|ideal customers?|target accounts?|tam))\b/i;

/** A message from one of our own addresses or domains, whichever direction it was stored in. */
function isOwn(addr: string | null, own: ReadonlySet<string>): boolean {
  const d = domainOf(addr);
  return !!d && (own.has(d) || own.has((addr ?? '').trim().toLowerCase()));
}

function headerValue(headers: Record<string, string> | null | undefined, name: string): string {
  if (!headers) return '';
  const k = Object.keys(headers).find((h) => h.toLowerCase() === name.toLowerCase());
  return k ? headers[k] : '';
}

/** C09: the purpose of ONE message, with its evidence. Pure over the stored text and the caller's context flags. */
export function classifyPurpose(event: PurposeInput, context: PurposeContext = {}): PurposeVerdict {
  const own = context.ownDomains ?? OWN_DOMAINS;
  const from = (event.from ?? '').trim().toLowerCase();
  const subject = (event.subject ?? '').trim();
  const text = (event.excerpt ?? '').replace(/\s+/g, ' ').trim();
  const both = `${subject}\n${text}`;
  const known = context.knownPerson === true || context.inDeal === true || context.customer === true;

  if (event.isDraft || event.type === 'draft') return { purpose: known ? 'buyer_conversation' : 'unknown', evidence: ['a draft: preparation, not a contact'], confidence: 'low' };
  if (event.direction === 'outbound') {
    return known
      ? { purpose: 'buyer_conversation', evidence: ['we wrote to a known person at an account'], confidence: 'medium' }
      : { purpose: 'unknown', evidence: ['we wrote; the recipient is not a known person'], confidence: 'low' };
  }
  if (isOwn(from, own)) return { purpose: 'internal', evidence: [`sender ${from} is one of our own addresses`], confidence: 'high' };

  const suspicious = both.match(SUSPICIOUS);
  if (event.type === 'calendar' || event.calendar) {
    if (suspicious) return { purpose: 'suspicious', evidence: [`a calendar ${event.calendar?.kind ?? 'message'}`, `threat or lure words: "${suspicious[0]}"`, 'not a buyer statement; do not follow its links'], confidence: 'high' };
    const organizerFreemail = FREEMAIL_DOMAINS.has(domainOf(from)) && !known;
    if (event.calendar?.kind === 'invitation' && organizerFreemail) return { purpose: 'suspicious', evidence: ['a calendar invitation from a consumer address nobody knows', 'not a buyer statement; do not follow its links'], confidence: 'medium' };
    return { purpose: 'calendar', evidence: [`a calendar ${event.calendar?.kind ?? 'message'}${event.calendar?.meetingKey ? ` for "${event.calendar.meetingKey.split('|')[0]}"` : ''}`], confidence: 'high' };
  }

  const reply = classifyReply({ snippet: text, subject, from });
  if (reply.kind === 'bounce') return { purpose: 'automated', evidence: ['a delivery failure notice'], confidence: 'high' };
  if (reply.kind === 'out_of_office') return { purpose: 'automated', evidence: ['an out-of-office or automatic reply'], confidence: 'high' };
  const autoSubmitted = headerValue(event.headers, 'Auto-Submitted');
  if (autoSubmitted && !/^no\b/i.test(autoSubmitted)) return { purpose: 'automated', evidence: [`Auto-Submitted: ${autoSubmitted}`], confidence: 'high' };
  if (AUTOMATED_SENDER.test(localOf(from)) && !known) return { purpose: 'automated', evidence: [`a machine sender (${localOf(from)}@)`], confidence: 'medium' };

  if (suspicious && !known) return { purpose: 'suspicious', evidence: [`threat or lure words: "${suspicious[0]}"`, 'sender is not a known person', 'not a buyer statement; do not follow its links'], confidence: 'medium' };

  const media = both.match(MEDIA);
  if (media && !known) return { purpose: 'media', evidence: [`press words: "${media[0]}"`], confidence: 'medium' };

  const partner = both.match(PARTNER);
  const vendor = both.match(VENDOR);
  const support = both.match(SUPPORT);
  const buyer = both.match(BUYER);
  const evidence: string[] = [];
  if (reply.kind === 'human') evidence.push(reply.human === 'reply' ? 'a person wrote back' : reply.human === 'referral' ? 'a person wrote back and named someone else' : 'a person wrote back with a push back');
  if (reply.kind === 'opt_out') evidence.push('an opt-out: they asked not to be contacted');
  if (context.knownPerson) evidence.push('a known person at an account');
  if (context.inDeal === true) evidence.push('their account is in an open deal');
  if (context.customer) evidence.push('their account is a customer');

  if (support && (context.customer || !vendor)) {
    return { purpose: 'customer_support', evidence: [...evidence, `support words: "${support[0]}"`], confidence: context.customer ? 'high' : 'medium' };
  }
  if (partner && !(known && buyer)) return { purpose: 'partner_referral', evidence: [...evidence, `referral or partner words: "${partner[0]}"`], confidence: 'medium' };
  if (reply.kind === 'opt_out') return { purpose: 'buyer_conversation', evidence, confidence: 'high' };
  // C57 F2, corrected on the reference set (2026-10-09): a pitch that addresses US as a vendor ("for yard management
  // vendors", "vendors like YardFlow") or offers services is a vendor solicitation whatever operational nouns it holds.
  // Buyer vocabulary wins only when it is FIRST-PERSON operational ("our two yards", "my pilot", "our gates") or the
  // message is a reply in a conversation we started (a Re: subject, an In-Reply-To); then a pitch cue beside it is
  // said in the evidence, never used to drop the person.
  const addressesUs = both.match(ADDRESSES_US_AS_VENDOR);
  const firstPerson = both.match(BUYER_FIRST_PERSON);
  const inOurThread = /^\s*(?:re|aw|sv|fwd?)\s*:/i.test(subject) || !!headerValue(event.headers, 'In-Reply-To') || !!headerValue(event.headers, 'References');
  const buyerWins = reply.kind === 'human' && buyer && !addressesUs && (firstPerson || inOurThread || !vendor);
  if (buyerWins) {
    evidence.push(`buyer vocabulary: "${(firstPerson ?? buyer)[0]}"${inOurThread && !firstPerson ? ' in a thread we started' : ''}`);
    if (vendor && !known) evidence.push(`pitch words beside it: "${vendor[0]}"; judged a buyer by the first-person vocabulary, review if it reads as a pitch`);
    return { purpose: 'buyer_conversation', evidence, confidence: known ? 'high' : vendor ? 'low' : 'medium' };
  }
  if ((vendor || addressesUs) && !known) {
    return { purpose: 'vendor_solicitation', evidence: [...evidence, `a pitch in their own words: "${(vendor ?? addressesUs)![0]}"`, ...(addressesUs ? [`it addresses us as a vendor: "${addressesUs[0]}"`] : []), 'sender is not a known person'], confidence: 'high' };
  }
  // A known person (a partner, a customer) can still send a pitch: the purpose says so, the relationship is judged apart.
  if (vendor && known) return { purpose: 'vendor_solicitation', evidence: [...evidence, `a pitch in their own words: "${vendor[0]}"`, 'from a known person: the relationship is judged apart'], confidence: 'low' };
  if (reply.kind === 'human' && known) return { purpose: 'buyer_conversation', evidence, confidence: 'medium' };
  if (media) return { purpose: 'media', evidence: [...evidence, `press words: "${media[0]}"`], confidence: 'low' };
  return { purpose: 'unknown', evidence: [...evidence, 'no purpose cue matched: review it'], confidence: 'low' };
}

// ---------------------------------------------------------------------------
// The relationship axis
// ---------------------------------------------------------------------------

export interface RelationshipEvidence {
  /** true: an open deal under a complete CRM read; false: none under a complete read; null: the CRM was not read. */
  openDeal: boolean | null;
  customer?: boolean;
  /** A GAP persona or hypothesis person at an account. */
  persona?: boolean;
  /** The identity machinery placed the sender at an account (a domain, an alias, a CRM company). */
  accountPlaced?: boolean;
  partner?: boolean;
  vendor?: boolean;
  media?: boolean;
  internal?: boolean;
  /** Where each flag came from, in the seller's words (a CRM property, a ledger row, a setting). */
  sources?: string[];
}

/** C09: the sender's relationship to us from CRM and ledger evidence only; several at once are mixed; none is unknown. */
export function classifyRelationship(e: RelationshipEvidence): { value: Relationship; evidence: string[] } {
  const roles: Array<[Relationship, string]> = [];
  if (e.internal) roles.push(['internal', 'one of our own addresses']);
  if (e.openDeal === true) roles.push(['active_opportunity', 'an open deal under a complete CRM read']);
  if (e.customer) roles.push(['customer', 'a customer account']);
  if (e.partner) roles.push(['partner', 'a partner flag']);
  if (e.vendor) roles.push(['vendor', 'a vendor flag']);
  if (e.media) roles.push(['media', 'a media flag']);
  if ((e.persona || e.accountPlaced) && e.openDeal !== true && !e.customer && !e.partner && !e.vendor && !e.media && !e.internal) {
    roles.push(['prospect', e.persona ? 'a GAP persona at an account with no open deal' : 'placed at an account with no open deal']);
  }
  const evidence = [...roles.map(([, why]) => why), ...(e.sources ?? [])];
  if (e.openDeal === null) evidence.push('open deal unknown: the CRM was not read');
  if (!roles.length) return { value: 'unknown', evidence: [...evidence, 'no CRM, persona or flag evidence'] };
  if (roles.length > 1) return { value: 'mixed', evidence: [`${roles.map(([r]) => r).join(' and ')} at once`, ...evidence] };
  return { value: roles[0][0], evidence };
}

// ---------------------------------------------------------------------------
// C11: who may be re-engaged
// ---------------------------------------------------------------------------

const NEVER_REENGAGE_ON: ReadonlySet<Purpose> = new Set(['suspicious', 'calendar', 'automated', 'internal', 'vendor_solicitation', 'media']);

export interface ReengageInput {
  /** The purposes of the sender's inbound messages (a seller override already applied where one exists). */
  purposes: readonly Purpose[];
  relationship: Relationship;
  /** From the suppression read; the truth of an opt-out never lives here. */
  optedOut?: boolean;
}

export interface ReengageVerdict {
  eligible: boolean;
  reason: string;
  /** True when a person may be listed only with a review note (an unknown or a suspicious message beside a real one). */
  review: boolean;
}

/** C11: never on an opt-out, a vendor, a media or an internal sender, or a sender whose messages are only suspicious, calendar or automated. */
export function reengageEligible(input: ReengageInput): ReengageVerdict {
  if (input.optedOut) return { eligible: false, reason: 'opted out', review: false };
  if (input.relationship === 'internal' || input.relationship === 'vendor' || input.relationship === 'media') return { eligible: false, reason: `relationship ${input.relationship}`, review: false };
  if (!input.purposes.length) return { eligible: false, reason: 'no message to re-engage on', review: false };
  const real = input.purposes.filter((p) => !NEVER_REENGAGE_ON.has(p));
  if (!real.length) return { eligible: false, reason: `only ${[...new Set(input.purposes)].join(', ')} messages: not a prospect conversation`, review: false };
  if (real.every((p) => p === 'unknown')) return { eligible: true, reason: 'purpose unknown: review before any outreach', review: true };
  const suspicious = input.purposes.includes('suspicious');
  return { eligible: true, reason: `${[...new Set(real.filter((p) => p !== 'unknown'))].join(', ')}${suspicious ? '; one suspicious message beside it: review' : ''}`, review: suspicious };
}
