/**
 * How a verified fact's source is named in an observation (Release C review
 * SF4). An EDGAR-style title ("KROGER CO 10-Q (filed 2026-09-18)") reads like
 * a scraper; a filing is named the way a person would say it, "From Kroger's
 * 10-Q filed September 18". Any other title is kept as it is.
 *
 * Its own module (ops closeout 16) so the evidence gate can recognise a label
 * without importing the research proposer.
 */
const FILING_FORM = /\b(10-Q|10-K|8-K|20-F|6-K|S-1|S-4|DEF 14A)\b/;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CORPORATE_SUFFIX = /[\s,]+(co|corp|corporation|inc|incorporated|company|ltd|llc|plc|l\.?p)\.?$/i;

function issuerName(raw: string): string {
  const name = raw.trim().replace(CORPORATE_SUFFIX, '').replace(CORPORATE_SUFFIX, '').trim();
  // EDGAR shouts company names ("KROGER CO"); a person would write "Kroger".
  return name === name.toUpperCase() ? name.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : name;
}

/**
 * Release C review SF4: an EDGAR-style title ("KROGER CO 10-Q (filed
 * 2026-09-18)") reads like a scraper. A filing is named the way a person
 * would say it, "From Kroger's 10-Q filed September 18"; any other title is
 * kept as it is.
 */
export function sourceLabel(title: string, accountName?: string | null): string {
  const t = title.trim();
  const form = FILING_FORM.exec(t);
  if (!form) return t;
  const issuer = (accountName ?? '').trim() || issuerName(t.slice(0, form.index));
  const possessive = /['’]s$/i.test(issuer) ? issuer : `${issuer}${/s$/i.test(issuer) ? "'" : "'s"}`;
  const owner = issuer ? `${possessive} ` : 'the ';
  const date = /(\d{4})-(\d{2})-(\d{2})/.exec(t);
  const month = date ? MONTHS[Number(date[2]) - 1] : undefined;
  const when = date && month ? ` filed ${month} ${Number(date[3])}` : '';
  return `From ${owner}${form[1]}${when}`;
}

/**
 * The title as the hypothesis builder puts it in front of a quote: one line,
 * clipped to 160 characters on a word boundary (no ellipsis), sentence
 * terminators removed so the observation does not split mid-title. One
 * definition, shared by the builder and the evidence gate's label check.
 */
export const OBSERVATION_TITLE_CLIP = 160;

export function observationTitle(title: string): string {
  const one = title.replace(/\s+/g, ' ').trim();
  let clipped = one;
  if (one.length > OBSERVATION_TITLE_CLIP) {
    const head = one.slice(0, OBSERVATION_TITLE_CLIP);
    const cut = head.lastIndexOf(' ');
    clipped = (cut > 0 ? head.slice(0, cut) : head).trim();
  }
  return clipped.replace(/[.!?]+(?=\s|$)/g, '').replace(/\s+/g, ' ').trim();
}

/** Every way an observation may name this source in front of a quote. */
export function sourceLabelVariants(title: string, accountName?: string | null): string[] {
  const bases = [...new Set([title.trim(), observationTitle(title)])].filter(Boolean);
  return [...new Set(bases.flatMap((b) => [sourceLabel(b, accountName), sourceLabel(b), b]))];
}
