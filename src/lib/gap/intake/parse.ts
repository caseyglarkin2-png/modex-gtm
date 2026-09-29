/**
 * UNIVERSAL WORK INTAKE: parse what Casey actually supplies (2026-09-28).
 *
 * One parser for every list shape GAP accepts, whatever the source (a
 * newsletter's subscribers, conference attendees, a CRM export, a target
 * account list):
 *   csv / tsv        a table with a header row (a CSV file, or cells pasted
 *                    from a spreadsheet); common columns are mapped, every
 *                    other column is kept in `raw` and reported
 *   name_headline    a copied people list: a name line, then a headline line
 *                    (the LinkedIn subscriber dialog copied as-is; its degree
 *                    and button lines are dropped, the degree is kept raw)
 *   lines            one person or account per line
 *
 * It keeps exactly what was supplied (`raw`) and NEVER fabricates a field: a
 * headline without "at <company>" yields no company. Pure: no I/O.
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
  skipped: { blank: number; duplicate: number };
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
  company: 'company', companyname: 'company', organization: 'company', organisation: 'company', account: 'company', accountname: 'company', employer: 'company',
  email: 'email', emailaddress: 'email', workemail: 'email', businessemail: 'email',
  linkedin: 'linkedinUrl', linkedinurl: 'linkedinUrl', linkedinprofile: 'linkedinUrl', linkedinprofileurl: 'linkedinUrl', profileurl: 'linkedinUrl',
  domain: 'companyDomain', website: 'companyDomain', companydomain: 'companyDomain', companywebsite: 'companyDomain',
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

/** "VP Distribution at Acme Foods" -> title + company; a headline with no "at"/"@" company stays a title only. */
export function splitHeadline(headline: string): { title?: string; company?: string } {
  const h = headline.replace(/\s+/g, ' ').trim();
  const m = /^([^|·•]{2,100}?)\s+(?:at|@)\s+([^|·•]+?)\s*(?:[|·•].*)?$/i.exec(h);
  if (m && !/\|/.test(m[1])) return { title: clean(m[1]), company: clean(m[2]) };
  return { title: clean(h) };
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
      companyDomain: get('companyDomain'),
      note: get('note'),
      sourceId: get('sourceId'),
      raw,
    }));
  }
  return { rows, unmapped, blank };
}

const LI_NOISE = [/^\d[\d,]*\s+subscribers?$/i, /degree connection$/i, /^(?:·\s*)?(?:1st|2nd|3rd\+?)$/i, /^(?:message|connect|follow|following|pending|remove)$/i, /^view .{1,80} profile$/i];
const DEGREE = /^(?:·\s*)?(1st|2nd|3rd\+?)$/i;

function nameHeadlineRows(lines: string[]): IntakeRow[] {
  const rows: IntakeRow[] = [];
  let name: string | null = null;
  let degree: string | null = null;
  const emit = (headline: string | null) => {
    if (!name) return;
    const raw: Record<string, string> = { name };
    if (headline) raw.headline = headline;
    if (degree) raw.degree = degree;
    rows.push(finish({ kind: 'person', name, ...(headline ? splitHeadline(headline) : {}), raw }));
    name = null;
    degree = null;
  };
  for (const line of lines) {
    const d = DEGREE.exec(line);
    if (d) { degree = d[1]; continue; }
    if (LI_NOISE.some((re) => re.test(line))) continue;
    if (name === null) name = line;
    else emit(line);
  }
  emit(null);
  return rows;
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
  if (parts.length >= 3) return finish({ kind: 'person', name: parts[0], title: parts.slice(1, -1).join(', '), company: parts[parts.length - 1], raw });
  if (parts.length === 2) return finish({ kind: 'person', name: parts[0], company: parts[1], raw });
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

  const delimiter = first.includes('\t') ? '\t' : first.includes(',') ? ',' : null;
  const headerHits = delimiter ? first.split(delimiter).filter((h) => COLUMN_ALIASES[colKey(h)]).length : 0;
  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  if (delimiter && headerHits >= 1 && (headerHits >= 2 || first.split(delimiter).length <= 3)) {
    format = delimiter === '\t' ? 'tsv' : 'csv';
    const t = tableRows(body.slice(body.indexOf(first)), kind, delimiter);
    rows = t.rows;
    unmapped = t.unmapped;
    blank = t.blank;
  } else if (kind === 'people' && trimmed.some((l) => DEGREE.test(l) || /degree connection$/i.test(l))) {
    format = 'name_headline';
    rows = nameHeadlineRows(trimmed);
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
  return { format, rows: unique, unmappedColumns: unmapped, skipped: { blank, duplicate } };
}
