/**
 * FOR THE EAR (account-first UX, UX-11, contract 5.8): what spoken text may carry. Never an email address, a phone
 * number, a URL, a citation token, a provenance id or a machine word; never the private line (callers never pass
 * it). Pure string work; pinned by tests/unit/gap/voice-listen.test.ts.
 */
import type { StoryTag } from '../story/story';

const URL_RE = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const CITATION_RE = /\s*\[S:[^\]]+\]/g;
const ID_RE = /\b(?:evidence|bid|hypothesis|signal|touch|decision|persona):[\w:-]+\b|\bcm[a-z0-9]{20,}\b/g;
const BASIS_PAREN_RE = /\s*\((?:sec\.gov|[a-z0-9.-]+\.(?:com|gov|org|net|io)|the anchor|the brief|clawd|GAP)[^)]*\)/gi;

/** Strip what must never be spoken and smooth the rest into sentences. */
export function forTheEar(text: string): string {
  return text
    .replace(CITATION_RE, '')
    .replace(URL_RE, '')
    .replace(EMAIL_RE, (m) => m.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim() || 'someone')
    .replace(PHONE_RE, '')
    .replace(BASIS_PAREN_RE, '')
    .replace(ID_RE, '')
    .replace(/\b([a-z]+)_([a-z_]+)\b/g, (m) => m.replace(/_/g, ' '))
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\.\s*\./g, '.')
    .trim();
}

/** The tag as a spoken aside. */
export function spokenTag(tag: StoryTag): string {
  switch (tag) {
    case 'Buyer said':
      return 'the buyer said it';
    case 'Checked':
      return 'checked';
    case 'Our read':
      return 'our read';
    case 'Unverified':
      return 'not verified';
    case 'Contradicted':
      return 'contradicted';
    default:
      return 'unknown';
  }
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** A quote the screen cut short ends at its last full sentence for the ear (never "marking the largest commercial, checked"). */
export function completeSentence(text: string): string {
  const t = text.replace(/\s*(\.\.\.|\u2026)\s*"?\s*$/, '').trim();
  if (/[.!?]["\u201d]?$/.test(t)) return t;
  const cut = Math.max(t.lastIndexOf('. '), t.lastIndexOf('." '), t.lastIndexOf('! '), t.lastIndexOf('? '));
  return cut > 40 ? t.slice(0, cut + 1).trim() : t;
}

/** One sentence, ending in a period, with the tag aside when it is not already in the words. */
export function spokenSentence(text: string, tag?: StoryTag): string {
  const bare = forTheEar(completeSentence(text)).replace(/[.!?]+$/, '');
  if (!bare) return '';
  if (!tag) return `${bare}.`;
  const saysIt = (tag === 'Unverified' && /not verified|unverified/i.test(bare)) || (tag === 'Unknown' && /unknown|nothing from the buyer|not confirmed/i.test(bare)) || (tag === 'Buyer said' && /\bsays?\b|\bsaid\b/i.test(bare));
  return saysIt ? `${bare}.` : `${bare}, ${spokenTag(tag)}.`;
}

/** A name said naturally: "Glen Chaffee, Managing Director" (no machine words, no trailing company). */
export function spokenPerson(name: string, title: string | null, accountName?: string): string {
  let t = title ? forTheEar(title) : '';
  // A title that ends in the company's own name says nothing new to the ear ("..., FedEx Ground").
  if (t && accountName) {
    const head = accountName.split(/\s+/)[0];
    if (head.length >= 3) t = t.replace(new RegExp(`\\s*[,|]\\s*${head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b.*$`, 'i'), '');
  }
  return t ? `${name}, ${t}` : name;
}
