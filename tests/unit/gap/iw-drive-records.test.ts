// @vitest-environment node
/**
 * Drive file to records (the Google Workspace and Gemini extension, 2026-10-10). Pinned: a Gemini note is a
 * gemini_notes engagement record with its topic notes as the text, its summary and next steps as the interpretation,
 * and its transcript lines as a second record of what people said; the meeting date (eventDate) stands apart from
 * the Drive modified time (reportedOn, stated) and the extraction time (collectedAt); the account is a hint from the
 * folder, the title or a dossier's own Account label, said as a hint; the attendees are person hints without us;
 * the Drive link is the first source and the text's links follow; the archive names the Drive id and the mime
 * type; the evidence group key is deterministic; a document past the bound is cut into numbered records and the
 * cut is said; an UNREADABLE parse yields NO record; every record passes validateIntelligenceRecord.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDriveText, type DrivePassage } from '@/lib/gap/signals/drive-parsers';
import { RECORDS_PER_FILE, accountHintOf, driveRecordsOf, eventDateOf, groupPassages, type DriveFileMeta } from '@/lib/gap/signals/drive-records';
import { evidenceGroupKey, validateIntelligenceRecord } from '@/lib/gap/signals/intelligence-record';

const fx = (name: string) => readFileSync(path.join(process.cwd(), 'tests/fixtures/gap/drive', name), 'utf8');
const DOC = 'application/vnd.google-apps.document';
const SHEET = 'application/vnd.google-apps.spreadsheet';
const EXTRACTED = '2026-10-10T03:00:00.000Z';
const OPTS = { extractedAt: EXTRACTED, runId: 'drive-sync:test' };
const meta = (over: Partial<DriveFileMeta> = {}): DriveFileMeta => ({ id: 'g1', name: 'Kenco x YardFlow - Discovery (Notes by Gemini)', mimeType: DOC, modifiedTime: '2026-07-16T19:05:00.000Z', owners: ['casey@freightroll.com'], webViewLink: 'https://docs.google.com/document/d/g1/edit', folderName: 'Meet Recordings', size: null, ...over });

describe('Drive records', () => {
  it('a Gemini note: two records, the notes apart from the summary apart from the transcript; the dates apart; the account a hint; valid', () => {
    const file = meta();
    const parse = parseDriveText({ mimeType: DOC, name: file.name, text: fx('kenco-discovery-2026-07-16.gemini.md') });
    const records = driveRecordsOf(file, parse, OPTS);
    expect(records.map((r) => r.producerItemId)).toEqual(['g1', 'g1#transcript']);
    const [notes, transcript] = records;
    expect(notes).toMatchObject({ producer: 'gemini_notes', kind: 'engagement', title: 'Kenco x YardFlow - Discovery', eventDate: '2026-07-16', reportedOn: '2026-07-16', reportedOnBasis: 'stated', collectedAt: EXTRACTED, accountHint: 'Kenco', personHints: ['craig.morrison@kencogroup.com', 'dave.kiesling@kencogroup.com'], visibility: 'digest', evidenceGroup: 'kenco|2026-07-16|discovery', archive: { reportRef: 'drive:g1', section: DOC } });
    expect(notes.text).toContain('Organizational context and roles');
    expect(notes.text).toContain('140+ locations');
    expect(notes.text, 'the transcript is not in the notes record').not.toContain('Casey Larkin:');
    expect(notes.interpretation).toMatch(/^Gemini's summary: Meeting focused on current yard management fragmentation/);
    expect(notes.interpretation).toContain("\n\nGemini's decisions: - **2026-2027 Yard Management Strategic Focus**");
    expect(notes.interpretation).toContain("\n\nGemini's suggested next steps: ");
    expect(notes.interpretation).toContain('Prepare Follow-up');
    expect(notes.interpretation!.indexOf("Gemini's summary")).toBeLessThan(notes.interpretation!.indexOf("Gemini's suggested next steps"));
    expect(notes.uncertainty).toContain('Gemini-generated meeting notes');
    expect(notes.uncertainty).toContain("Owner casey@freightroll.com; modified in Drive 2026-07-16T19:05:00.000Z; the extraction time is the record's collectedAt.");
    expect(notes.uncertainty, 'the extraction time is not in the hashed words (a re-read is a duplicate, not a revision)').not.toContain(EXTRACTED);
    expect(notes.uncertainty).toContain('The account "Kenco" is a hint from the title, not a placement.');
    expect(notes.uncertainty).toContain('Transcript: 1 of 2 lines kept (its own record).');
    expect(notes.sources?.[0]).toEqual({ url: 'https://docs.google.com/document/d/g1/edit', publisher: 'Google Drive', label: file.name });
    expect(notes.sources?.some((s) => s.url?.includes('1l3f23i9ia3NwVtIuZo0hgd3mrtTo7tFgpMm9X5X30ow'))).toBe(true);
    expect(transcript).toMatchObject({ producer: 'gemini_notes', title: 'Kenco x YardFlow - Discovery: transcript excerpts', eventDate: '2026-07-16', interpretation: null, evidenceGroup: 'kenco|2026-07-16|discovery' });
    expect(transcript.text).toBe('Casey Larkin: Jesus. Craig, hello. How we doing? Craig, can you hear me?');
    expect(transcript.uncertainty).toMatch(/^A machine transcript \(Gemini\); 1 of 2 lines kept/);
    for (const r of records) {
      const v = validateIntelligenceRecord(r);
      expect(v.ok, JSON.stringify(v)).toBe(true);
      if (v.ok) {
        expect(v.record.evidenceGroup).toBe('kenco|2026-07-16|discovery');
        expect(v.record.collectedAt).toBe(EXTRACTED);
        expect(v.record.eventDate).toBe('2026-07-16');
      }
    }
  });

  it('a dossier: the account from its own Account label when the title does not name one; the title, the link, the dates; valid', () => {
    const file = meta({ id: 'c1', name: 'Deep-Audit Dossier — Crowley Jacksonville Cross Dock Facility', folderName: 'Yard Audits', modifiedTime: '2026-09-20T10:00:00.000Z', webViewLink: 'https://docs.google.com/document/d/c1/edit' });
    const parse = parseDriveText({ mimeType: DOC, name: file.name, text: fx('crowley-jacksonville-cross-dock.doc.md') });
    expect(accountHintOf(file, parse)).toEqual({ hint: 'Crowley', basis: 'text' });
    const records = driveRecordsOf(file, parse, OPTS);
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records.length).toBeLessThanOrEqual(RECORDS_PER_FILE);
    expect(records.every((r) => r.producer === 'google_drive' && r.kind === 'observation' && r.producerItemId.startsWith('c1') && r.accountHint === 'Crowley' && r.reportedOn === '2026-09-20' && r.eventDate === null && r.evidenceGroup === null)).toBe(true);
    expect(records[0].title).toMatch(/^Deep-Audit Dossier — Crowley Jacksonville Cross Dock Facility/);
    expect(records[0].uncertainty).toContain('The account "Crowley" is a hint from the text, not a placement.');
    expect(records.map((r) => r.text).join('\n')).toContain('58 dock doors');
    for (const r of records) expect(validateIntelligenceRecord(r).ok).toBe(true);
  });

  it('a Sheet in an account folder: the folder is the hint; the CSV export caveat; a deck takes the hint from the file name only when it names one', () => {
    const sheet = meta({ id: 's1', name: 'Crowley — Yard Audit', mimeType: SHEET, folderName: 'Crowley', modifiedTime: '2026-06-01T00:00:00.000Z' });
    const sp = parseDriveText({ mimeType: SHEET, name: sheet.name, text: fx('crowley-yard-audit.sheet.txt') });
    const [rec] = driveRecordsOf(sheet, sp, OPTS);
    expect(rec).toMatchObject({ producer: 'google_drive', producerItemId: 's1', accountHint: 'Crowley', title: 'Crowley — Yard Audit' });
    expect(rec.uncertainty).toContain('hint from the folder');
    expect(rec.uncertainty).toContain('The CSV export carries the first sheet only.');
    const deck = meta({ id: 'd1', name: 'Boston Beer Company Onsite Visit', mimeType: 'application/vnd.google-apps.presentation', folderName: 'Meet Recordings' });
    const dp = parseDriveText({ mimeType: deck.mimeType, name: deck.name, text: fx('boston-beer-onsite.slides.txt') });
    const [deckRec] = driveRecordsOf(deck, dp, OPTS);
    expect(deckRec.accountHint, 'five words is not a counterpart name: no hint rather than a wrong one').toBeNull();
    expect(deckRec.uncertainty).toContain('No account hint');
    expect(deckRec.text).toContain('Slide 1\nSetting the Stage');
    const named = meta({ id: 'd2', name: 'Boston Beer x YardFlow - Onsite.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', folderName: 'Meet Recordings' });
    expect(driveRecordsOf(named, dp, OPTS)[0]).toMatchObject({ accountHint: 'Boston Beer', title: 'Boston Beer x YardFlow - Onsite' });
  });

  it('the event date: the file name first, then a Gemini dateline, then a dateline at the top of the text, else none', () => {
    const parse = parseDriveText({ mimeType: 'text/plain', name: 'x.txt', text: 'Memo\n\nOctober 2, 2026\n\nThe yard audit found the gate unmanned after 6 pm on three of five nights observed.' });
    expect(eventDateOf({ name: 'notes-2026-09-30.txt' }, parse)).toBe('2026-09-30');
    expect(eventDateOf({ name: 'notes.txt' }, parse)).toBe('2026-10-02');
    const later = parseDriveText({ mimeType: 'text/plain', name: 'x.txt', text: `${'A dossier with no dateline. '.repeat(20)}\n\nSeen on October 2, 2026 at the gate.` });
    expect(eventDateOf({ name: 'notes.txt' }, later), 'a date deep in the text is not the document date').toBeNull();
  });

  it('an UNREADABLE parse yields NO record (the invariant the sync relies on)', () => {
    const pptx = meta({ id: 'p1', name: 'Inland26_Tactical_Dossier.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const parse = parseDriveText({ mimeType: pptx.mimeType, name: pptx.name, text: fx('inland26-tactical-dossier.pptx.txt') });
    expect(parse.readable).toBe(false);
    expect(driveRecordsOf(pptx, parse, OPTS)).toEqual([]);
    const pdf = parseDriveText({ mimeType: 'application/pdf', name: 'deck.pdf', text: null, unreadableReason: 'PDF text extraction is not installed; the file is on record by its link' });
    expect(driveRecordsOf(meta({ id: 'p2', name: 'deck.pdf', mimeType: 'application/pdf' }), pdf, OPTS)).toEqual([]);
  });

  it('a long document is cut into at most six numbered records and the cut is said; the evidence group key is deterministic', () => {
    const passages: DrivePassage[] = Array.from({ length: 10 }, (_, i) => ({ heading: `Section ${i + 1}`, text: 'words '.repeat(1_100), kind: 'source' as const }));
    const { groups, dropped } = groupPassages(passages);
    expect(groups).toHaveLength(RECORDS_PER_FILE);
    expect(dropped).toBe(4);
    const parse = { ...parseDriveText({ mimeType: DOC, name: 'Long.md', text: 'x'.repeat(50) }), passages };
    const records = driveRecordsOf(meta({ id: 'L', name: 'Long', folderName: 'Kenco' }), parse, OPTS);
    expect(records.map((r) => r.producerItemId)).toEqual(['L#1', 'L#2', 'L#3', 'L#4', 'L#5', 'L#6']);
    expect(records[0].title).toBe('Long: Section 1');
    expect(records[5].uncertainty).toContain('4 more sections not imported (the bound is 6 records per document); the whole document is at the link.');
    expect(evidenceGroupKey('Kenco', '2026-07-16', 'Kenco x YardFlow - Discovery')).toBe('kenco|2026-07-16|discovery');
    expect(evidenceGroupKey('Kenco Logistics', '2026-07-16', 'Kenco Logistics x YardFlow - Discovery call (Notes by Gemini)')).toBe('kenco-logistics|2026-07-16|discovery');
    expect(evidenceGroupKey(null, '2026-07-16', 'Discovery')).toBeNull();
    expect(evidenceGroupKey('Kenco', null, 'Discovery')).toBeNull();
    expect(evidenceGroupKey('Kenco', '16 July', 'Discovery')).toBeNull();
    expect(evidenceGroupKey('Kenco', '2026-07-16', 'Kenco')).toBe('kenco|2026-07-16|untitled');
  });
});
