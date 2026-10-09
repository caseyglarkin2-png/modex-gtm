/**
 * C52: the shape of a reference evaluation case. The data lives in tests/unit/gap/fixtures/reference-set.ts (frozen
 * by its lock); the types live here so the evaluators under src never import from tests.
 */
import type { ClaimClass, Purpose, Relationship } from '../context/commercial-context';

export type Motion = 'deal_work' | 'reengage' | 'reply_owed' | 'review_first' | 'no_outreach' | 'research_first' | 'retry_later';

export interface ReferenceSource {
  /** The provider's own id shape (gmail message id, hubspot object id, vault path#heading, clawd note id, public url). */
  sourceId: string;
  kind: 'gmail' | 'crm' | 'vault' | 'clawd' | 'public' | 'calendar';
  /** The event or observation date; null when the source gives none. */
  at: string | null;
  /** The refresh or index time, when the source has one apart from the observation (C15). */
  indexedAt?: string | null;
  claimClass: ClaimClass;
  text: string;
  /** External use allowed: only buyer_said and checked_public may be, and only when marked. */
  externalOk?: boolean;
}

export interface ReferenceCase {
  id: string;
  title: string;
  /** Which audit observation this case is the de-identified shape of. */
  shapeOf: string;
  person: { email: string; name: string; title: string | null } | null;
  account: { name: string; aliases: string[]; domains: string[]; hubspotCompanyId: string | null } | null;
  sources: ReferenceSource[];
  expected: {
    identity: { accountName: string | null; ambiguous: boolean; via: string | null };
    opportunity: 'open' | 'none' | 'unknown' | 'ambiguous';
    purposes: Purpose[];
    relationship: Relationship;
    motion: Motion;
    /** Phrases a prepared output must contain (one is enough per entry; alternatives separated by |). */
    mustSay: string[];
    /** Claims a prepared output must never make, with the reason. */
    prohibited: Array<{ claim: string; reason: string }>;
    /** Sources that must be retrieved (by sourceId) for the output to count as grounded (C53 recall). */
    requiredSources: string[];
    /** Quoted text that must never be executed (C53: an instruction in a source is data). */
    neverExecute: string[];
  };
  /** The same case with one source unreadable: what must be said then. */
  missingSource: { remove: string; expectedWords: string; expectedOpportunity?: 'open' | 'none' | 'unknown' | 'ambiguous' };
}
