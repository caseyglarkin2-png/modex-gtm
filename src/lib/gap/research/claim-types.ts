/**
 * CLAIM TYPES (GAP OS execution recovery, R22 / R23, 2026-10-06). Pure.
 *
 * A verified sentence (verbatim at its source, dated, naming the account) is one of several CLAIM TYPES, each with
 * its own permitted interpretation and its own prohibited leap (the mandate's evidence table). Today only a
 * physical-network change is admitted as first-touch outreach evidence; the other types were refused at the
 * verifier and lost. They are now kept as verified claims of their own type, never widened into outreach evidence
 * here: the approach-specific policy (R30) decides what each may support.
 *
 *   physical_change   a site, yard, dock, fleet or network change (research/facts.ts)
 *   job_posting       the employer says a role carries yard, dock, trailer, gate or fleet duties; status and dates
 *                     when stated; never "they lack a system" or "they have budget"
 *   procurement       an RFP / RFQ / tender / bid notice: the stated scope and deadline; never "the contract is open"
 *   technology        a deployment, implementation or selection the account itself states (a vendor's boast is the
 *                     vendor's claim, refused by the speaker rule elsewhere)
 *   partnership       a carrier, 3PL or partner relationship the account states
 *   leadership        an appointment or departure: who-to-approach context, never a buying trigger
 *   financial         an earnings, guidance or capital line: context, never buyer pain
 *   other             verified, unclassified: context only
 *
 * Attributes are extracted only when the sentence states them (a missing date or status stays unknown; it never
 * blocks reading and never proves urgency). Pinned by tests/unit/gap/claim-types.test.ts.
 */
import { isPhysicalOpsFact } from './facts';

export type ClaimType = 'physical_change' | 'job_posting' | 'procurement' | 'technology' | 'partnership' | 'leadership' | 'financial' | 'other';

export interface ClaimAttributes {
  /** job_posting: the role named, when the sentence names one. */
  role?: string | null;
  /** job_posting: open | closed | reposted | unknown (only when stated). */
  postingStatus?: 'open' | 'closed' | 'reposted' | 'unknown';
  /** procurement: the stated closing / due date (ISO date), when stated. */
  dueDate?: string | null;
  /** procurement: the issuing body, when stated. */
  issuer?: string | null;
  /** technology / partnership: the named system or partner, when stated. */
  counterparty?: string | null;
  /** leadership: appointed | departed | unknown. */
  move?: 'appointed' | 'departed' | 'unknown';
}

export interface ClaimClassification {
  type: ClaimType;
  attributes: ClaimAttributes;
  /** What the claim may support, in seller words (the permitted interpretation). */
  permits: string;
  /** The leap it never supports. */
  forbids: string;
}

const YARD_DUTY = /\b(yard|dock|trailer|gate|spotter|hostler|shuttle|switcher|fleet|dispatch|linehaul|line haul|transportation|logistics)\b/i;
const JOB = /\b(hiring|now hiring|job (?:posting|opening|openings)|position|positions|apply (?:now|today|by)|career|careers|is seeking|seeks a|seeking an?|looking for an?|recruit(?:ing|s)|openings? for|job description|responsibilities include|will be responsible for|requisition)\b/i;
const JOB_ROLE = /\b((?:senior |sr\.? |lead |regional |site |area |plant |dc |distribution center |yard |dock |fleet |transportation |logistics )?(?:yard|dock|fleet|transportation|logistics|distribution|warehouse|shipping|receiving|dispatch) (?:operations? )?(?:manager|supervisor|coordinator|director|lead|specialist|planner|analyst|jockey|driver|spotter|hostler|switcher)s?)\b/i;
const CLOSED = /\b(no longer accepting|position (?:has been )?filled|posting (?:has )?(?:closed|expired)|closed on|expired on|is closed|is no longer available)\b/i;
const REPOSTED = /\b(reposted|re-posted|posted again|relisted)\b/i;
const PROCUREMENT = /\b(request for (?:proposals?|quotation|quotes?|information|bids?)|rfp|rfq|rfi|invitation to bid|tender|solicitation|bid (?:due|opening|deadline)|proposals? (?:are )?due|sealed bids?)\b/i;
const DUE = /\b(?:due|deadline|closes?|closing|must be (?:received|submitted))(?: date)?(?: is| of| on| by)?:?\s+(?:on\s+)?([A-Z][a-z]+\.? \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i;
const ISSUER = /\b((?:The )?(?:Port|City|County|State|Department|Authority|Ministry) of (?:[A-Z][\w&.'-]*\s?){1,5}|(?:[A-Z][\w&.'-]+ ){1,4}(?:Authority|Department|County|City|Port|District|Agency|Commission))\b/;
const TECHNOLOGY = /\b(implement(?:ed|s|ing|ation)|deploy(?:ed|s|ing|ment)|rolled out|roll(?:s|ing)? out|went live|go-live|selected|selects|chose|adopt(?:ed|s|ing)|integrat(?:ed|es|ing)|upgrad(?:ed|es|ing)|migrat(?:ed|es|ing))\b.{0,80}\b(system|software|platform|wms|tms|yms|yard management|warehouse management|transportation management|telematics|rfid|visibility|automation|ai|robot|autonomous)\b/i;
const PARTNERSHIP = /\b(partner(?:ed|ship|s)?|agreement|contract|awarded|selected|teams? up|collaborat(?:e|es|ed|ion)|alliance|signed)\b.{0,60}\b(3pl|carrier|logistics provider|freight|transportation provider|trucking|fleet|autonomous|drayage|intermodal|rail)\b/i;
const LEADERSHIP = /\b(appoint(?:ed|s|ment)|named|names|promot(?:ed|es|ion)|hired as|joins as|joined as|steps? down|stepped down|retir(?:es|ed|ing)|resign(?:s|ed)|departs?|departure|succeed(?:s|ed)|new (?:ceo|cfo|coo|cso|chief|vice president|vp|svp|evp|head of|director of))\b/i;
const DEPARTED = /\b(steps? down|stepped down|retir(?:es|ed|ing)|resign(?:s|ed)|departs?|departure|leaves|left the company)\b/i;
const FINANCIAL = /\b(net (?:revenue|sales|income|earnings)|earnings per share|eps|guidance|operating (?:profit|margin|income)|gross margin|free cash flow|dividend|share repurchase|buyback|quarterly results|full[- ]year results|organic (?:revenue|growth)|basis points)\b/i;

const monthDate = (s: string): string | null => {
  const d = new Date(s.replace(/\./g, ''));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const CLAIM_POLICY: Record<ClaimType, { permits: string; forbids: string }> = {
  physical_change: { permits: 'that stated change, at the named scope and date; propose a relevant operational question', forbids: 'that the change proves congestion, loss, demand or a purchase intention' },
  job_posting: { permits: 'that the employer says the role carries those duties; qualify whether it is still open', forbids: 'that they lack a system, are understaffed, have a budget or suffer the listed problem' },
  procurement: { permits: 'the stated requirements, issuer, deadline and scope', forbids: 'that YardFlow qualifies, the contract is open or budget is secured unless stated' },
  technology: { permits: 'the attributed deployment and its scope; a possible complementary workflow', forbids: "that any software deployment implies a yard need, or that a vendor's claim is the buyer's admission" },
  partnership: { permits: 'the stated relationship and its scope', forbids: 'that the partner speaks for the account, or that the relationship proves a problem' },
  leadership: { permits: 'a role change that may affect who to approach', forbids: 'that a new leader is a buying trigger' },
  financial: { permits: 'the stated figure as context', forbids: 'that a finance line is operational pain' },
  other: { permits: 'the sentence as verified context', forbids: 'any inference beyond it' },
};

/** Classify one verified sentence. A physical change wins (the existing first-touch path); the rest by cue. */
export function classifyClaim(sentence: string): ClaimClassification {
  const s = sentence.trim();
  const build = (type: ClaimType, attributes: ClaimAttributes = {}): ClaimClassification => ({ type, attributes, ...CLAIM_POLICY[type] });
  if (isPhysicalOpsFact(s)) return build('physical_change');
  if (PROCUREMENT.test(s)) {
    const due = DUE.exec(s)?.[1] ?? null;
    const issuer = ISSUER.exec(s)?.[1]?.trim().replace(/\s+(?:issued|published|released|posted|announced)$/i, '') ?? null;
    return build('procurement', { dueDate: due ? monthDate(due) : null, issuer });
  }
  if (JOB.test(s) && (YARD_DUTY.test(s) || JOB_ROLE.test(s))) {
    const role = JOB_ROLE.exec(s)?.[1] ?? null;
    const postingStatus: ClaimAttributes['postingStatus'] = REPOSTED.test(s) ? 'reposted' : CLOSED.test(s) ? 'closed' : /\b(now hiring|apply|is seeking|seeks|openings?|open position)\b/i.test(s) ? 'open' : 'unknown';
    return build('job_posting', { role, postingStatus });
  }
  if (LEADERSHIP.test(s) && !TECHNOLOGY.test(s)) return build('leadership', { move: DEPARTED.test(s) ? 'departed' : /\b(appoint|named|names|promot|hired as|joins as|joined as|succeed|new )/i.test(s) ? 'appointed' : 'unknown' });
  if (TECHNOLOGY.test(s)) return build('technology', { counterparty: counterpartyOf(s) });
  if (PARTNERSHIP.test(s)) return build('partnership', { counterparty: counterpartyOf(s) });
  if (FINANCIAL.test(s)) return build('financial');
  return build('other');
}

/** R32: the role a job posting names ("a Yard Operations Manager"), when the sentence names one; else null. */
export function postingRoleOf(sentence: string | null | undefined): string | null {
  const m = JOB_ROLE.exec(String(sentence ?? ''));
  if (!m?.[1]) return null;
  // Title case for the seller ("yard operations manager" -> "Yard Operations Manager"); "DC" stays upper case.
  return m[1].trim().split(/\s+/).map((w) => (/^dc$/i.test(w) ? 'DC' : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ');
}

/** The proper noun after "with" / "from" / "by" / "selected", when one is stated. */
function counterpartyOf(s: string): string | null {
  const m = /\b(?:with|from|by|selected|chose|partnered with|agreement with)\s+((?:[A-Z][\w&.'-]*\s?){1,4})/.exec(s);
  const name = m?.[1]?.trim().replace(/[.,;:]$/, '') ?? null;
  return name && !/^(?:The|A|An|Its|Their|Our)$/.test(name) ? name : null;
}

/** The claim class stored on the signal row (`claim_class`), from the classification. */
export function claimClassOf(c: ClaimClassification): string {
  return c.type === 'physical_change' ? 'FACT' : c.type.toUpperCase();
}
