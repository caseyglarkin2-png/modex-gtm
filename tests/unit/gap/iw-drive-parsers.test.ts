// @vitest-environment node
/**
 * The Drive parsers (the Google Workspace and Gemini extension, 2026-10-10). Pinned on the captured fixtures: a
 * Gemini note's topic notes, summary and next steps are its interpretation while its transcript lines are source
 * statements attributed to the speaker, bounded; a document is cut along its headings; a sheet's rows ride under
 * their header, one block per sheet; a deck is one passage per slide, numbered; an image-only deck (the Inland26
 * PPTX, "# index.html") and anything under forty characters is unreadable with the reason and yields no passage;
 * a PDF without an extractor is unreadable with that reason; links and dates are kept.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIN_READABLE_CHARS, TRANSCRIPT_LINES_MAX, csvCells, datesIn, formatOf, isGeminiNotes, linksIn, parseDriveText, parseGeminiNotes } from '@/lib/gap/signals/drive-parsers';

const fx = (name: string) => readFileSync(path.join(process.cwd(), 'tests/fixtures/gap/drive', name), 'utf8');
const DOC = 'application/vnd.google-apps.document';
const SHEET = 'application/vnd.google-apps.spreadsheet';
const SLIDES = 'application/vnd.google-apps.presentation';

describe('the Drive parsers', () => {
  it('a Gemini note: the meeting title, date and attendees; the notes as interpretation; the transcript as attributed source lines; the boilerplate out', () => {
    const p = parseDriveText({ mimeType: DOC, name: 'Kenco x YardFlow - Discovery (Notes by Gemini)', text: fx('kenco-discovery-2026-07-16.gemini.md') });
    expect(p.readable).toBe(true);
    expect(p.format).toBe('gemini_notes');
    expect(p.title).toBe('Kenco x YardFlow - Discovery');
    expect(p.meetingDate).toBe('2026-07-16');
    expect(p.attendees).toEqual(['craig.morrison@kencogroup.com', 'dave.kiesling@kencogroup.com', 'casey@freightroll.com']);
    const headings = p.passages.map((x) => x.heading);
    // "Decisions" holds no words of its own in the fixture (its "Aligned" sub-heading does), so it is no passage.
    expect(headings).toEqual(expect.arrayContaining(['Organizational context and roles', 'Yard management system strategy', 'Summary', 'Aligned', 'Next steps', 'Details', 'Transcript']));
    expect(headings).not.toContain('Decisions');
    expect(p.passages.filter((x) => x.kind === 'gemini_interpretation').length).toBeGreaterThanOrEqual(6);
    const transcript = p.passages.filter((x) => x.kind === 'transcript');
    expect(transcript).toHaveLength(1);
    expect(transcript[0]).toMatchObject({ speaker: 'Casey Larkin', text: 'Jesus. Craig, hello. How we doing? Craig, can you hear me?' });
    expect(p.transcript).toEqual({ kept: 1, total: 2 });
    expect(p.passages.some((x) => /review Gemini/.test(x.text)), 'the review-your-notes footer is not a passage').toBe(false);
    expect(p.passages.some((x) => x.text === '*' || /^\*\s*$/m.test(x.text)), 'a line of markup alone is not a passage').toBe(false);
    expect(p.links).toContain('https://docs.google.com/document/d/1l3f23i9ia3NwVtIuZo0hgd3mrtTo7tFgpMm9X5X30ow/edit?usp=drive_web&tab=t.4317egl9zrmc');
    expect(p.links.some((u) => /support\.google\.com/.test(u))).toBe(false);
    expect(p.dates[0]).toBe('2026-07-16');
    const next = p.passages.find((x) => x.heading === 'Next steps')!;
    expect(next.text).toContain('Prepare Follow-up');
    expect(isGeminiNotes('# Quick notes\n\n# Full notes\n')).toBe(true);
    expect(isGeminiNotes('# A dossier')).toBe(false);
  });

  it('a long transcript is bounded to the substantive lines, in order, and the cut is counted', () => {
    const lines = Array.from({ length: 30 }, (_, i) => `**${i % 2 ? 'Dave Kiesling' : 'Casey Larkin'}:** ${i % 5 === 0 ? 'Okay.' : `Line ${i}: we run over one hundred and forty locations and the systems are fragmented across sites.`}`);
    const text = `# Quick notes\n\n## Kenco x YardFlow - Discovery\n\nJul 16, 2026\n\n## Summary\n\n  - The yard systems are fragmented.\n\n# Transcript\n\n## Kenco x YardFlow - Discovery - Transcript\n\n### 00:00:09\n\n${lines.join('\n\n')}\n`;
    const p = parseGeminiNotes(text);
    const t = p.passages.filter((x) => x.kind === 'transcript');
    expect(t).toHaveLength(TRANSCRIPT_LINES_MAX);
    expect(t[0].text).toBe('Line 1: we run over one hundred and forty locations and the systems are fragmented across sites.');
    expect(t.every((x) => x.text.length >= 30), 'the short "Okay." lines are not kept').toBe(true);
    expect(p.transcript).toEqual({ kept: TRANSCRIPT_LINES_MAX, total: 30 });
    expect(p.passages.find((x) => x.heading === 'Summary')).toMatchObject({ kind: 'gemini_interpretation' });
  });

  it('a Doc (markdown export and its plain twin): the sections along the headings, every passage the document\'s own words', () => {
    for (const name of ['crowley-jacksonville-cross-dock.doc.md', 'crowley-jacksonville-cross-dock.md']) {
      const p = parseDriveText({ mimeType: DOC, name, text: fx(name) });
      expect(p.readable, name).toBe(true);
      expect(p.format).toBe('document');
      expect(p.title).toMatch(/^Deep-Audit Dossier/);
      expect(p.passages.map((x) => x.heading)).toEqual(expect.arrayContaining(['Step 0 — Facility identification (roster geocode was wrong)', 'Key views', 'Gate / guard-shack / dock determinations', 'Yard zones & counts', 'Web findings', 'Final confidence — MEDIUM']));
      expect(p.passages.every((x) => x.kind === 'source')).toBe(true);
      expect(p.passages.find((x) => x.heading === 'Web findings')!.text).toContain('58 dock doors');
    }
  });

  it('a DOCX, a text file and a PDF text: documents, their headings and links kept', () => {
    const docx = parseDriveText({ mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Yard Flow-260 Site Yard Automation Deal updated.docx', text: fx('primo-260-site-deal.docx.txt') });
    expect(docx.readable).toBe(true);
    expect(docx.passages.map((x) => x.heading)).toEqual(expect.arrayContaining(['The Box in the Back of the Warehouse', 'The Steak Before the Sizzle']));
    const txt = parseDriveText({ mimeType: 'text/plain', name: '1-ARTICLE-BODY-paste-this.txt', text: fx('ooo-newsletter-edition-1.txt') });
    expect(txt.format).toBe('text');
    expect(txt.links).toEqual(['https://yardflow.ai/order-of-operations/?utm_source=linkedin&utm_medium=newsletter&utm_campaign=ooo&utm_content=edition-1', 'https://yardflow.ai/resources/?utm_source=linkedin&utm_medium=newsletter&utm_campaign=wtt-yard-black-hole&utm_content=edition-1']);
    expect(txt.passages[0].text).toContain('48-minute drop-and-hook turns became 24');
    // What a PDF extractor would yield reads as a document; without one the client hands the reason instead (below).
    const pdf = parseDriveText({ mimeType: 'application/pdf', name: 'YardFlow-Site-vs-Network-Carousel.pdf', text: fx('site-vs-network-carousel.pdf.txt') });
    expect(pdf).toMatchObject({ readable: true, format: 'document' });
    expect(pdf.passages[0].text).toContain('Your YMS Is a Site Tool');
  });

  it('a Sheet: the MCP table rendering and the XLSX extraction both become table passages under their header, one per sheet', () => {
    const mcp = parseDriveText({ mimeType: SHEET, name: 'Crowley — Yard Audit', text: fx('crowley-yard-audit.sheet.txt') });
    expect(mcp.readable).toBe(true);
    expect(mcp.format).toBe('sheet');
    expect(mcp.passages.every((x) => x.kind === 'table')).toBe(true);
    expect(mcp.passages.map((x) => x.text).join('\n')).toContain('Crowley Jacksonville Cross Dock Facility - Jacksonville FL');
    expect(mcp.links).toContain('https://www.google.com/maps/@30.34640,-81.69680,400m/data=!3m1!1e3');
    const xlsx = parseDriveText({ mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'Crowley + YardFlow Network Pricing - June 2026.xlsx', text: fx('crowley-network-pricing.xlsx.txt') });
    expect(xlsx.passages.map((x) => x.heading)).toEqual(['The Offer', 'Network Build', 'Rollout Schedule']);
    const build = xlsx.passages[1];
    expect(build.text.split('\n')[0]).toBe('# | Site | Location | Facility type | Size / char. | Point | Gate add-on | RTLS | Core ($/yr) | Gate ($/yr) | RTLS ($/yr) | Site total ($/yr) | Deployments');
    expect(build.text).toContain('1 | Talleyrand Terminal | Jacksonville, FL | Marine terminal + chassis pool (197 ac)');
    expect(csvCells('a,"b, c","d ""e""",,f')).toEqual(['a', 'b, c', 'd "e"', '', 'f']);
  });

  it('Slides: one numbered passage per slide', () => {
    const p = parseDriveText({ mimeType: SLIDES, name: 'Boston Beer Company Onsite Visit', text: fx('boston-beer-onsite.slides.txt') });
    expect(p.format).toBe('slides');
    expect(p.passages.map((x) => x.heading)).toEqual(['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4', 'Slide 5']);
    expect(p.passages[0]).toMatchObject({ kind: 'slide', text: 'Setting the Stage\nBoston Beer Company Onsite Visit at Primo Brands\nYARDFLOW x SAM ADAMS' });
    expect(p.title, 'a deck takes its name from the file, not its first slide').toBeNull();
  });

  it('an image-only deck (the Inland26 PPTX yields "# index.html"), an empty export and a short one are unreadable with the reason and yield no passage', () => {
    const inland = parseDriveText({ mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', name: 'Inland26_Tactical_Dossier.pptx', text: fx('inland26-tactical-dossier.pptx.txt') });
    expect(inland.readable).toBe(false);
    expect(inland.passages).toEqual([]);
    expect(inland.unreadableReason).toMatch(new RegExp(`fewer than ${MIN_READABLE_CHARS}: image-only or empty`));
    expect(parseDriveText({ mimeType: SLIDES, name: 'deck', text: '' })).toMatchObject({ readable: false, unreadableReason: 'the document yields no text (image-only or empty); nothing was extracted' });
    expect(parseDriveText({ mimeType: DOC, name: 'doc', text: null })).toMatchObject({ readable: false, passages: [] });
    expect(parseDriveText({ mimeType: DOC, name: 'doc', text: '   \n\n   ' }).readable).toBe(false);
    expect(parseDriveText({ mimeType: DOC, name: 'doc', text: 'a'.repeat(MIN_READABLE_CHARS - 1) }).readable).toBe(false);
    expect(parseDriveText({ mimeType: DOC, name: 'doc', text: 'a'.repeat(MIN_READABLE_CHARS) }).readable).toBe(true);
    // The client's own reason (a PDF without an extractor) passes through, ahead of the text.
    const pdf = parseDriveText({ mimeType: 'application/pdf', name: 'x.pdf', text: null, unreadableReason: 'PDF text extraction is not installed; the file is on record by its link' });
    expect(pdf).toMatchObject({ readable: false, unreadableReason: 'PDF text extraction is not installed; the file is on record by its link', passages: [] });
  });

  it('formats, links and dates: deterministic helpers', () => {
    expect(formatOf('text/csv', '')).toBe('sheet');
    expect(formatOf('text/markdown', '')).toBe('text');
    expect(formatOf('application/pdf', '')).toBe('document');
    expect(formatOf('application/pdf', 'You should review Gemini\'s notes')).toBe('gemini_notes');
    expect(linksIn('see (https://a.example/x), https://b.example/y. and mailto:x@y.z')).toEqual(['https://a.example/x', 'https://b.example/y']);
    expect(datesIn('Jul 16, 2026 then 2026-08-29 and October 9, 2026 and Jul 16, 2026 again and 2026-13-45')).toEqual(['2026-07-16', '2026-08-29', '2026-10-09']);
  });
});
