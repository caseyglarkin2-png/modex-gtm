/**
 * UNIVERSAL WORK INTAKE: parse what Casey actually supplies (2026-09-28).
 *
 * One parser for every list shape GAP accepts, whatever the source (a
 * newsletter's subscribers, conference attendees, a CRM export, a target
 * account list):
 *   csv / tsv        a table with a header row (a CSV file, or cells pasted
 *                    from a spreadsheet); common columns are mapped, every
 *                    other column is kept in `raw` and reported; a header
 *                    with no recognizable column is refused, never imported
 *   name_headline    a copied people list (the LinkedIn subscriber dialog):
 *                    each person is ANCHORED on its connection-degree line
 *                    (name just before, headline just after), so a doubled
 *                    name, a status line or a missing headline never shifts
 *                    anyone else
 *   lines            one person or account per line
 *
 * It keeps exactly what was supplied (`raw`) and NEVER fabricates a field:
 * a headline yields a company only for a current "Title at Company"; a line
 * never turns a credential or "Last, First" into a company. Pure: no I/O.
 */
import { parse as parseCsv } from 'csv-parse/sync';

export type IntakeKind = 'people' | 'accounts';
export type IntakeFormat = 'csv' | 'tsv' | 'lines' | 'name_headline';

export interface IntakeRow {
  kind: 'person' | 'account';
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  linkedinUrl?: string;
  companyDomain?: string;
  note?: string;
  /** An identifier the source itself supplied (a CRM record id), never invented. */
  sourceId?: string;
  /** Exactly what was supplied for this row. */
  raw: Record<string, string>;
}

export interface ParseResult {
  format: IntakeFormat;
  rows: IntakeRow[];
  unmappedColumns: string[];
  /** blank rows, exact duplicates, and lines a copied list could not place (never silently used). */
  skipped: { blank: number; duplicate: number; unparsed?: number };
  error?: string;
}

export const INTAKE_ROW_LIMIT = 2000;

type Field = 'name' | 'first' | 'last' | 'title' | 'company' | 'email' | 'linkedinUrl' | 'companyDomain' | 'note' | 'sourceId' | 'headline';
const COLUMN_ALIASES: Record<string, Field> = {
  name: 'name', fullname: 'name', contactname: 'name', person: 'name',
  firstname: 'first', first: 'first', givenname: 'first',
  lastname: 'last', last: 'last', surname: 'last', familyname: 'last',
  title: 'title', jobtitle: 'title', position: 'title', role: 'title',
  headline: 'headline',
  company: 'company', companyname: 'company', organization: 'company', organisation: 'company', organizationname: 'company', organisationname: 'company', account: 'company', accountname: 'company', employer: 'company', associatedcompany: 'company',
  email: 'email', emailaddress: 'email', workemail: 'email', businessemail: 'email',
  linkedin: 'linkedinUrl', linkedinurl: 'linkedinUrl', linkedinprofile: 'linkedinUrl', linkedinprofileurl: 'linkedinUrl', profileurl: 'linkedinUrl',
  domain: 'companyDomain', website: 'companyDomain', companydomain: 'companyDomain', companywebsite: 'companyDomain', companydomainname: 'companyDomain', websiteurl: 'companyDomain', domainname: 'companyDomain',
  notes: 'note', note: 'note', comment: 'note', comments: 'note',
  sourceid: 'sourceId', externalid: 'sourceId', recordid: 'sourceId', contactid: 'sourceId', hubspotid: 'sourceId',
};
const colKey = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

const clean = (v: string | undefined) => {
  const t = (v ?? '').replace(/\s+/g, ' ').trim();
  return t ? t : undefined;
};
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i;
const LINKEDIN = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s/?#]+/i;
const DOMAIN = /^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)\/?$/i;
/** Post-nominal credentials and suffixes: part of a name, never a company. */
export const CREDENTIAL = /^(?:mba|phd|ph\.d\.?|md|jd|cpa|pmp|cscp|cltd|cpim|cpsm|pe|p\.e\.|sphr|shrm-cp|cfa|esq|jr\.?|sr\.?|ii|iii|iv|lssbb|lssgb|six sigma)$/i;

/** A title part that describes a PAST or wished-for role: "at X" is then not a current employer. */
const NOT_CURRENT = /^(?:ex[-\s]|former\b|formerly\b|previously\b|retired\b|past\b|looking\b|seeking\b|open to\b|aspiring\b)/i;

/** "VP Distribution at Acme Foods" -> title + company; anything else stays a title only (no company invented). */
export function splitHeadline(headline: string): { title?: string; company?: string } {
  const h = headline.replace(/\s+/g, ' ').trim();
  const m = /^([^|·•]{2,100}?)\s+(?:at|@)\s+([^|·•]+?)\s*(?:[|·•].*)?$/i.exec(h);
  if (m && !/\|/.test(m[1]) && !NOT_CURRENT.test(m[1].trim()) && /^[A-Z0-9]/.test(m[2].trim())) return { title: clean(m[1]), company: clean(m[2]) };
  return { title: clean(h) };
}

/** The part of a DOMAIN column that is the domain ("https://www.acme.com/" -> "acme.com"). */
function domainOf(v: string | undefined): string | undefined {
  const t = clean(v);
  if (!t) return undefined;
  const m = /^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[/?#].*)?$/i.exec(t);
  return m ? m[1].toLowerCase() : t;
}

function finish(row: IntakeRow): IntakeRow {
  const out: IntakeRow = { kind: row.kind, raw: row.raw };
  for (const k of ['name', 'title', 'company', 'email', 'linkedinUrl', 'companyDomain', 'note', 'sourceId'] as const) {
    const v = clean(row[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function tableRows(text: string, kind: IntakeKind, delimiter: string): { rows: IntakeRow[]; unmapped: string[]; blank: number } {
  const records: string[][] = parseCsv(text, { delimiter, relax_column_count: true, relax_quotes: true, skip_empty_lines: false, trim: true, bom: true });
  const [header, ...body] = records;
  const fields = header.map((h) => COLUMN_ALIASES[colKey(h)] ?? null);
  const unmapped = header.filter((_, i) => !fields[i]);
  let blank = 0;
  const rows: IntakeRow[] = [];
  for (const rec of body) {
    if (rec.every((c) => !c.trim())) { blank += 1; continue; }
    const raw: Record<string, string> = {};
    header.forEach((h, i) => { if (rec[i] !== undefined && rec[i] !== '') raw[h] = rec[i]; });
    const get = (f: Field) => { const i = fields.indexOf(f); return i >= 0 ? rec[i] : undefined; };
    const name = clean(get('name')) ?? clean([get('first'), get('last')].filter(Boolean).join(' '));
    const headline = clean(get('headline'));
    const fromHeadline = headline ? splitHeadline(headline) : {};
    rows.push(finish({
      kind: kind === 'accounts' ? 'account' : 'person',
      name: kind === 'accounts' ? undefined : name,
      title: kind === 'accounts' ? undefined : get('title') ?? fromHeadline.title,
      company: get('company') ?? fromHeadline.company ?? (kind === 'accounts' ? name : undefined),
      email: get('email'),
      linkedinUrl: get('linkedinUrl'),
      companyDomain: domainOf(get('companyDomain')),
      note: get('note'),
      sourceId: get('sourceId'),
      raw,
    }));
  }
  return { rows, unmapped, blank };
}

const DEGREE = /^(?:[·•]\s*)?(1st|2nd|3rd\+?)$/i;
const DEGREE_LONG = /^(1st|2nd|3rd\+?)\s+degree connection$/i;
const LI_NOISE = [/^\d[\d,]*\s+subscribers?$/i, /^(?:message|connect|follow|following|pending|remove|invite sent)$/i, /^view .{1,80} profile$/i, /^status is\b/i, /^dialog content (?:start|end)\.?$/i];
const isDegree = (l: string) => DEGREE.test(l) || DEGREE_LONG.test(l);
const isNoise = (l: string) => LI_NOISE.some((re) => re.test(l));

/** Each person is anchored on a degree line: the name is the nearest line before it, the headline the first line after. */
function nameHeadlineRows(lines: string[]): { rows: IntakeRow[]; used: number } {
  // Collapse each run of degree lines ("2nd degree connection", "2nd") into one anchor.
  const anchors: Array<{ start: number; end: number; degree: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isDegree(lines[i])) continue;
    const m = DEGREE.exec(lines[i]) ?? DEGREE_LONG.exec(lines[i]);
    const last = anchors[anchors.length - 1];
    if (last && last.end === i - 1) last.end = i;
    else anchors.push({ start: i, end: i, degree: m![1] });
  }
  const rows: IntakeRow[] = [];
  let used = 0;
  let floor = 0; // lines before this belong to the previous person
  anchors.forEach((a, k) => {
    let n = a.start - 1;
    while (n >= floor && isNoise(lines[n])) n -= 1;
    if (n < floor) return; // a degree with no name before it: nothing to anchor
    const name = lines[n].replace(/\s+/g, ' ').trim();
    // The headline: the first real line after the anchor that is not the NEXT person's name.
    const next = anchors[k + 1];
    let nextName = next ? next.start - 1 : lines.length;
    while (next && nextName > a.end && isNoise(lines[nextName])) nextName -= 1;
    let h = a.end + 1;
    while (h < nextName && (isNoise(lines[h]) || lines[h] === name)) h += 1;
    const headline = h < nextName ? lines[h] : null;
    const raw: Record<string, string> = { name, degree: a.degree };
    if (headline) raw.headline = headline;
    rows.push(finish({ kind: 'person', name, ...(headline ? splitHeadline(headline) : {}), raw }));
    used += a.end - a.start + 1 + 1 + (headline ? 1 : 0);
    floor = Math.max(a.end + 1, headline ? h + 1 : a.end + 1);
  });
  return { rows, used };
}

function personFromLine(line: string): IntakeRow {
  const raw = { line };
  const angle = /^(.*?)\s*<([^<>\s]+@[^<>\s]+)>\s*$/.exec(line);
  if (angle) return finish({ kind: 'person', name: angle[1], email: angle[2], raw });
  if (EMAIL.test(line)) return finish({ kind: 'person', email: line, raw });
  if (LINKEDIN.test(line)) return finish({ kind: 'person', linkedinUrl: line, raw });
  const dash = /^(.+?)\s+[-–—]\s+(.+)$/.exec(line);
  if (dash) return finish({ kind: 'person', name: dash[1], ...splitHeadline(dash[2]), raw });
  const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
  // Credentials after a comma are part of the name ("Lee Placeholder, MBA").
  while (parts.length > 1 && CREDENTIAL.test(parts[parts.length - 1])) parts.splice(parts.length - 2, 2, `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`);
  if (parts.length >= 3) return finish({ kind: 'person', name: parts[0], title: parts.slice(1, -1).join(', '), company: parts[parts.length - 1], raw });
  // "Name, Company" only when the name part is a full name; "Doe, Jane" is a name as supplied.
  if (parts.length === 2 && parts[0].split(/\s+/).length >= 2) return finish({ kind: 'person', name: parts[0], company: parts[1], raw });
  return finish({ kind: 'person', name: line, raw });
}

function accountFromLine(line: string): IntakeRow {
  const raw = { line };
  const paren = /^(.+?)\s*\(([^()]+)\)\s*$/.exec(line);
  if (paren && DOMAIN.test(paren[2].trim())) return finish({ kind: 'account', company: paren[1], companyDomain: DOMAIN.exec(paren[2].trim())![1], raw });
  const comma = /^(.+?),\s*(\S+)$/.exec(line);
  if (comma && DOMAIN.test(comma[2])) return finish({ kind: 'account', company: comma[1], companyDomain: DOMAIN.exec(comma[2])![1], raw });
  if (DOMAIN.test(line) && !/\s/.test(line)) return finish({ kind: 'account', companyDomain: DOMAIN.exec(line)![1], raw });
  return finish({ kind: 'account', company: line, raw });
}

const rowKey = (r: IntakeRow) => JSON.stringify([r.kind, r.name?.toLowerCase(), r.title?.toLowerCase(), r.company?.toLowerCase(), r.email?.toLowerCase(), r.linkedinUrl?.toLowerCase(), r.companyDomain?.toLowerCase()]);

export function parseIntake(text: string, kind: IntakeKind): ParseResult {
  const body = text.replace(/\r\n?/g, '\n');
  const lines = body.split('\n');
  const first = lines.find((l) => l.trim()) ?? '';
  let format: IntakeFormat = 'lines';
  let rows: IntakeRow[] = [];
  let unmapped: string[] = [];
  let blank = 0;
  let unparsed = 0;

  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  const delimiter = first.includes('\t') ? '\t' : first.includes(',') ? ',' : null;
  const headerCells = delimiter ? first.split(delimiter).map((h) => h.trim()) : [];
  const headerHits = headerCells.filter((h) => COLUMN_ALIASES[colKey(h)]).length;
  // A pasted spreadsheet always has tabs and a header; comma lines may just be "Name, Title, Company".
  const looksTabular = delimiter === '\t';
  if (kind === 'people' && trimmed.some(isDegree)) {
    format = 'name_headline';
    const nh = nameHeadlineRows(trimmed);
    rows = nh.rows;
    unparsed = Math.max(0, trimmed.filter((l) => !isNoise(l)).length - nh.used);
  } else if (delimiter && headerHits >= 1) {
    format = delimiter === '\t' ? 'tsv' : 'csv';
    const t = tableRows(body.slice(body.indexOf(first)), kind, delimiter);
    rows = t.rows;
    unmapped = t.unmapped;
    blank = t.blank;
  } else if (delimiter && looksTabular && trimmed.length > 1) {
    // A table whose header GAP cannot read: refuse in preview rather than import the header as a row.
    return { format: delimiter === '\t' ? 'tsv' : 'csv', rows: [], unmappedColumns: headerCells, skipped: { blank: 0, duplicate: 0 }, error: `unrecognized_columns:${headerCells.join(',')}` };
  } else {
    // A one-column list may start with its header ("Company", "Name", "Email"): that line is not a row.
    const body1 = trimmed.length > 1 && COLUMN_ALIASES[colKey(trimmed[0])] ? trimmed.slice(1) : trimmed;
    rows = body1.map((l) => (kind === 'accounts' ? accountFromLine(l) : personFromLine(l)));
  }

  if (rows.length > INTAKE_ROW_LIMIT) {
    return { format, rows: [], unmappedColumns: unmapped, skipped: { blank, duplicate: 0 }, error: `too_many_rows:${rows.length}>${INTAKE_ROW_LIMIT}` };
  }
  const seen = new Set<string>();
  let duplicate = 0;
  const unique = rows.filter((r) => {
    const k = rowKey(r);
    if (seen.has(k)) { duplicate += 1; return false; }
    seen.add(k);
    return true;
  });
  return { format, rows: unique, unmappedColumns: unmapped, skipped: { blank, duplicate, ...(unparsed > 0 ? { unparsed } : {}) } };
}
